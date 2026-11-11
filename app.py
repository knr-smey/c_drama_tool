#!/usr/bin/env python3
"""
KhmerDubStudio - AI Video Dubbing Desktop Application
A cross-platform desktop (Windows / macOS / Linux) application built with pywebview,
Tailwind CSS, and AI libraries. It can also run headless as a browser-based web app
(used by the Docker image) via `python app.py --web` or `python server.py`.

Pipeline Stages:
1. Media Ingestion: Download MP4 video and audio stream using yt-dlp (or handle local file).
2. Audio Extraction: Convert audio to 16kHz mono uncompressed PCM WAV using ffmpeg.
3. Speech-to-Text: Run faster-whisper (int8 quantization) to extract timestamped dialogue segments.
4. Translation: Translate dialogue segments to Khmer (km) via deep-translator.
5. Voiceover Synthesis: Synthesize Khmer neural speech using edge-tts (Piseth or Sreymom).
6. Audio-Video Remux: Mix Khmer voiceover track with original video using ffmpeg.
"""

import os
import sys
import re
import json
import time
import shutil
import wave
import asyncio
import threading
import subprocess
import traceback
from pathlib import Path

# Third-party imports are dynamically validated/imported with fallbacks
try:
    import numpy as np
except ImportError:
    np = None

try:
    import webview
except ImportError:
    webview = None

# Suppress huggingface symlink warning on standard Windows installs
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# Automatically load .env file if present
_env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.isfile(_env_file):
    try:
        with open(_env_file, "r", encoding="utf-8") as _ef:
            for _line in _ef:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    os.environ.setdefault(_k.strip(), _v.strip())
    except Exception:
        pass

def ensure_windows_runtime_dlls():
    """
    On Windows machines without global VC++ 2015-2022 redistributable, ensure ctranslate2
    can locate msvcp140.dll by copying from numpy.libs if needed.
    """
    if sys.platform != "win32":
        return
    try:
        import ctranslate2
    except (ImportError, OSError):
        try:
            import numpy
            numpy_dir = os.path.dirname(numpy.__file__)
            numpy_libs = os.path.join(os.path.dirname(numpy_dir), "numpy.libs")
            if os.path.isdir(numpy_libs):
                for f in os.listdir(numpy_libs):
                    if f.startswith("msvcp140") and f.endswith(".dll"):
                        src = os.path.join(numpy_libs, f)
                        ct_dir = os.path.join(os.path.dirname(numpy_dir), "ctranslate2")
                        if os.path.isdir(ct_dir):
                            dst = os.path.join(ct_dir, "msvcp140.dll")
                            if not os.path.isfile(dst):
                                shutil.copy2(src, dst)
                                os.add_dll_directory(ct_dir)
                                break
        except Exception:
            pass

ensure_windows_runtime_dlls()

def ensure_pyav_compatibility():
    """
    PyAV >= 14.0 removed the `metadata_errors` keyword argument from av.open().
    faster-whisper 1.0+ passes metadata_errors='ignore' in decode_audio().
    This monkeypatch strips metadata_errors to guarantee 100% compatibility across all PyAV versions.
    """
    try:
        import av
        _orig_open = av.open
        def _safe_open(*args, **kwargs):
            kwargs.pop("metadata_errors", None)
            return _orig_open(*args, **kwargs)
        av.open = _safe_open
    except Exception:
        pass

ensure_pyav_compatibility()

# Base Paths
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(APP_ROOT, "output")
STEMS_DIR = os.path.join(OUTPUT_DIR, "stems")
WEB_DIR = os.path.join(APP_ROOT, "web")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(STEMS_DIR, exist_ok=True)


def _ffmpeg_binary_name() -> str:
    return "ffmpeg.exe" if sys.platform == "win32" else "ffmpeg"


def _ffprobe_binary_name() -> str:
    return "ffprobe.exe" if sys.platform == "win32" else "ffprobe"


def resolve_ffmpeg_path() -> str:
    """
    Locates the ffmpeg executable on Windows, macOS, and Linux:
    1. Checks system PATH
    2. Checks imageio_ffmpeg bundled binary
    3. Checks local project bin directory
    4. Checks standard platform installation paths (Homebrew, apt, Chocolatey, WinGet)
    """
    binary_name = _ffmpeg_binary_name()

    # 1. Check system PATH
    for candidate in ("ffmpeg", "ffmpeg.exe"):
        ffmpeg_exe = shutil.which(candidate)
        if ffmpeg_exe and os.path.isfile(ffmpeg_exe):
            _ensure_in_path(os.path.dirname(ffmpeg_exe))
            return os.path.abspath(ffmpeg_exe)

    # 2. Check imageio_ffmpeg if installed
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.isfile(exe):
            bin_dir = os.path.dirname(exe)
            standard_ffmpeg = os.path.join(bin_dir, binary_name)
            if not os.path.isfile(standard_ffmpeg):
                try:
                    shutil.copy2(exe, standard_ffmpeg)
                    os.chmod(standard_ffmpeg, 0o755)
                except Exception:
                    pass
            _ensure_in_path(bin_dir)
            return standard_ffmpeg if os.path.isfile(standard_ffmpeg) else os.path.abspath(exe)
    except Exception:
        pass

    # 3. Check local ./bin/ffmpeg(.exe)
    local_bin = os.path.join(APP_ROOT, "bin", binary_name)
    if os.path.isfile(local_bin):
        _ensure_in_path(os.path.dirname(local_bin))
        return local_bin

    # 4. Check common platform install locations
    common_locations = [
        # Windows
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\ProgramData\chocolatey\bin\ffmpeg.exe",
        os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"),
        # macOS (Homebrew Apple Silicon / Intel, MacPorts)
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/opt/local/bin/ffmpeg",
        # Linux
        "/usr/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/snap/bin/ffmpeg",
    ]
    for loc in common_locations:
        if os.path.isfile(loc):
            _ensure_in_path(os.path.dirname(loc))
            return loc

    return "ffmpeg"


def resolve_ffprobe_path(ffmpeg_exe: str = None) -> str:
    """Locates ffprobe on PATH, next to ffmpeg, or in common platform locations."""
    for candidate in ("ffprobe", "ffprobe.exe"):
        probe = shutil.which(candidate)
        if probe and os.path.isfile(probe):
            return os.path.abspath(probe)

    search_dirs = []
    if ffmpeg_exe:
        search_dirs.append(os.path.dirname(ffmpeg_exe))
    try:
        import imageio_ffmpeg
        search_dirs.append(os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe()))
    except Exception:
        pass

    for directory in search_dirs:
        candidate = os.path.join(directory, _ffprobe_binary_name())
        if os.path.isfile(candidate):
            return candidate

    for loc in (
        "/opt/homebrew/bin/ffprobe",
        "/usr/local/bin/ffprobe",
        "/usr/bin/ffprobe",
        "/snap/bin/ffprobe",
        r"C:\ffmpeg\bin\ffprobe.exe",
    ):
        if os.path.isfile(loc):
            return loc

    return "ffprobe"


def _ensure_in_path(directory: str):
    """Ensures the directory containing ffmpeg/ffprobe is prepended to os.environ['PATH']."""
    if directory and os.path.isdir(directory):
        current_path = os.environ.get("PATH", "")
        if directory.lower() not in current_path.lower():
            os.environ["PATH"] = directory + os.pathsep + current_path


def format_timestamp(seconds: float) -> str:
    """Format seconds into HH:MM:SS.mmm or MM:SS.mmm"""
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"
    return f"{int(m):02d}:{s:06.3f}"


def sanitize_filename(name: str) -> str:
    """Clean filename by removing illegal filesystem characters."""
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    clean = clean.replace(" ", "_")
    return clean[:60] if len(clean) > 60 else clean


_KHMER_RE = re.compile(r"[\u1780-\u17FF]")

# MyMemory expects RFC3066 codes (e.g. zh-CN), not bare ISO 639-1 codes.
_MYMEMORY_LANG_MAP = {
    "zh": "zh-CN", "zh-cn": "zh-CN", "zh-tw": "zh-TW",
    "en": "en-GB", "ja": "ja-JP", "ko": "ko-KR",
    "th": "th-TH", "vi": "vi-VN", "id": "id-ID",
    "fr": "fr-FR", "de": "de-DE", "es": "es-ES",
    "ru": "ru-RU", "ar": "ar-SA", "hi": "hi-IN",
    "pt": "pt-PT", "tr": "tr-TR", "km": "km-KH",
}


def contains_khmer(text: str) -> bool:
    """True if the text contains at least one Khmer script character."""
    return bool(text and _KHMER_RE.search(text))


def clean_translated_text(text: str) -> str:
    """Normalize provider output (decode entities, strip HTML/spacing artifacts)."""
    if not text:
        return ""
    import html as _html
    text = _html.unescape(text)
    text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")
    text = re.sub(r"&\s*#\s*\d+\s*;", "", text)   # e.g. "& # 160;"
    text = re.sub(r"&#?\w+;", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def mymemory_language_code(lang: str) -> str:
    """Map an ISO 639-1 language code to a MyMemory-compatible code."""
    if not lang:
        return ""
    return _MYMEMORY_LANG_MAP.get(lang.lower(), lang)


def get_configured_proxies(user_proxy: str = "") -> dict:
    """Returns proxy dictionary for requests, deep-translator, and edge-tts."""
    if user_proxy and user_proxy.strip():
        p = user_proxy.strip()
        if not (p.startswith("http://") or p.startswith("https://") or p.startswith("socks5://")):
            p = f"http://{p}"
        return {"http": p, "https": p}

    for k in ("HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy", "ALL_PROXY", "all_proxy"):
        val = os.environ.get(k)
        if val:
            return {"http": val, "https": val}

    # Auto-detect local proxy ports if running (e.g. Clash 7890, v2ray 10809)
    import socket
    for port in (7890, 10809, 10808):
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.15):
                p = f"http://127.0.0.1:{port}"
                return {"http": p, "https": p}
        except (OSError, socket.timeout):
            pass
    return {}



def get_media_duration(file_path: str, ffmpeg_exe: str) -> float:
    """Determines media duration using ffprobe or ffmpeg metadata parse."""
    ffprobe_exe = resolve_ffprobe_path(ffmpeg_exe)

    if ffprobe_exe and (os.path.isfile(ffprobe_exe) or shutil.which(ffprobe_exe)):
        try:
            cmd = [
                ffprobe_exe, "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            return float(res.stdout.strip())
        except Exception:
            pass

    # Fallback: parse ffmpeg stderr
    try:
        cmd = [ffmpeg_exe, "-i", file_path]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
        if match:
            h, m, s = match.groups()
            return int(h) * 3600 + int(m) * 60 + float(s)
    except Exception:
        pass

    return 60.0  # Safe default


class DubbingAPI:
    """
    Exposed pywebview JavaScript API interface and pipeline orchestrator.
    """

    def __init__(self):
        self._window = None
        self._is_aborted = False
        self._pipeline_thread = None
        self._ffmpeg_path = resolve_ffmpeg_path()
        # Optional callback(event_name, data) for non-pywebview hosts (web server mode)
        self._event_sink = None

    def _set_window(self, window):
        self._window = window

    def _set_event_sink(self, sink):
        self._event_sink = sink

    def _broadcast(self, event_name: str, data: dict):
        """Dispatches structured events to the webview UI and/or an external sink."""
        if self._event_sink:
            try:
                self._event_sink(event_name, data)
            except Exception as e:
                print(f"[Event Sink Error] {e}", file=sys.stderr)
        if not self._window:
            return
        try:
            json_str = json.dumps(data)
            # Invoke direct window handler if available; fallback to CustomEvent dispatch
            js_code = (
                f"(function() {{"
                f"  const payload = {json_str};"
                f"  if (typeof window.{event_name} === 'function') {{"
                f"    window.{event_name}(payload);"
                f"  }} else {{"
                f"    window.dispatchEvent(new CustomEvent('{event_name}', {{ detail: payload }}));"
                f"  }}"
                f"}})();"
            )
            self._window.evaluate_js(js_code)
        except Exception as e:
            print(f"[Broadcast Error] {e}", file=sys.stderr)

    def _emit_progress(self, stage: int, stage_name: str, progress: float, message: str = "",
                      log_level: str = "INFO", log_text: str = "", khmer_text: str = None):
        """Helper to send engine update events."""
        payload = {
            "stage": stage,
            "stage_name": stage_name,
            "progress": round(progress, 1),
            "message": message,
            "log": {
                "level": log_level,
                "text": log_text or message,
                "khmer": khmer_text
            }
        }
        self._broadcast("onEngineUpdate", payload)

    # -------------------------------------------------------------
    # JavaScript Callable Methods
    # -------------------------------------------------------------

    def start_pipeline(self, options: dict) -> dict:
        """
        Receives parameters from UI and triggers pipeline in a background thread.
        """
        if self._pipeline_thread and self._pipeline_thread.is_alive():
            return {"error": "A dubbing job is already in progress."}

        self._is_aborted = False
        self._pipeline_thread = threading.Thread(
            target=self._run_pipeline_worker,
            args=(options,),
            daemon=True
        )
        self._pipeline_thread.start()
        return {"status": "started"}

    def cancel_pipeline(self) -> dict:
        """Cancels any currently running dubbing pipeline."""
        self._is_aborted = True
        self._emit_progress(
            stage=1,
            stage_name="Aborted",
            progress=0,
            message="Pipeline cancellation requested by user.",
            log_level="WARN",
            log_text="Cancellation signal sent to pipeline engine."
        )
        return {"status": "cancelled"}

    def select_local_file(self) -> dict:
        """Native file dialog to pick an existing video file."""
        if not self._window:
            return {"error": "Window not initialized"}
        try:
            result = self._window.create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False,
                file_types=('Video Files (*.mp4;*.mkv;*.mov;*.webm;*.avi)', 'All files (*.*)')
            )
            if result and len(result) > 0:
                return {"path": result[0]}
            return {"path": None}
        except Exception as e:
            return {"error": str(e)}

    def search_movies(self, query: str, limit: int = 8, proxy: str = None) -> dict:
        """Searches online dramas and movies from the web using yt-dlp."""
        query = (query or "").strip()
        if not query:
            return {"results": [], "count": 0}

        try:
            import yt_dlp
            configured_proxy = proxy or os.environ.get("HTTP_PROXY") or os.environ.get("HTTPS_PROXY")
            if not configured_proxy:
                for auto_p in get_configured_proxies():
                    if auto_p:
                        configured_proxy = auto_p
                        break

            ydl_opts = {
                "extract_flat": True,
                "skip_download": True,
                "quiet": True,
                "no_warnings": True,
                "noplaylist": True,
                "socket_timeout": 15
            }
            if configured_proxy:
                ydl_opts["proxy"] = configured_proxy

            search_limit = min(max(int(limit), 1), 20)
            search_target = f"ytsearch{search_limit}:{query}"

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(search_target, download=False)
                entries = info.get("entries", []) if info else []

                results = []
                for e in entries:
                    if not e:
                        continue
                    vid_id = e.get("id") or ""
                    raw_dur = e.get("duration")
                    if raw_dur:
                        try:
                            m, s = divmod(int(raw_dur), 60)
                            h, m = divmod(m, 60)
                            dur_str = f"{h}:{m:02d}:{s:02d}" if h > 0 else f"{m}:{s:02d}"
                        except Exception:
                            dur_str = str(raw_dur)
                    else:
                        dur_str = "Video"

                    thumb = e.get("thumbnail")
                    if not thumb and e.get("thumbnails"):
                        thumb = e["thumbnails"][-1].get("url")
                    if not thumb and vid_id:
                        thumb = f"https://i.ytimg.com/vi/{vid_id}/hqdefault.jpg"

                    video_url = e.get("url") or (f"https://www.youtube.com/watch?v={vid_id}" if vid_id else "")
                    if not video_url.startswith("http"):
                        video_url = f"https://www.youtube.com/watch?v={video_url}"

                    results.append({
                        "id": vid_id,
                        "title": e.get("title") or "Untitled Video",
                        "url": video_url,
                        "thumbnail": thumb or "",
                        "duration": dur_str,
                        "uploader": e.get("uploader") or e.get("channel") or "Online"
                    })

                return {"results": results, "count": len(results)}
        except Exception as e:
            return {"error": str(e), "results": []}

    def list_library(self) -> dict:
        """Returns list of exported videos in the output directory."""
        items = []
        if os.path.isdir(OUTPUT_DIR):
            for fname in sorted(os.listdir(OUTPUT_DIR), reverse=True):
                fpath = os.path.join(OUTPUT_DIR, fname)
                if os.path.isfile(fpath) and fname.lower().endswith((".mp4", ".mkv", ".mov", ".webm", ".avi")):
                    try:
                        stat = os.stat(fpath)
                        size_mb = stat.st_size / (1024 * 1024)
                        mtime_str = time.strftime("%Y-%m-%d %H:%M", time.localtime(stat.st_mtime))
                        items.append({
                            "filename": fname,
                            "path": fpath,
                            "size_mb": round(size_mb, 2),
                            "created_at": mtime_str
                        })
                    except Exception:
                        pass
        return {"items": items, "count": len(items), "output_dir": OUTPUT_DIR}

    def close_app(self) -> dict:
        """Force quits the desktop application immediately."""
        def _force_exit():
            time.sleep(0.15)
            if self._window:
                try:
                    self._window.destroy()
                except Exception:
                    pass
            os._exit(0)
        threading.Thread(target=_force_exit, daemon=True).start()
        return {"status": "quitting"}

    def open_output_folder(self, path: str = None) -> dict:
        """Opens the output folder in Windows Explorer."""
        target_dir = path if (path and os.path.exists(path)) else OUTPUT_DIR
        try:
            if sys.platform == "win32":
                os.startfile(target_dir)
            elif sys.platform == "darwin":
                subprocess.Popen(["open", target_dir])
            else:
                subprocess.Popen(["xdg-open", target_dir])
            return {"success": True}
        except Exception as e:
            return {"error": str(e)}

    def open_video(self, file_path: str) -> dict:
        """Opens the exported video file in the platform default media player."""
        if not file_path or not os.path.isfile(file_path):
            return {"error": "File does not exist"}
        try:
            if sys.platform == "win32":
                os.startfile(file_path)
            elif sys.platform == "darwin":
                subprocess.Popen(["open", file_path])
            else:
                subprocess.Popen(["xdg-open", file_path])
            return {"success": True}
        except Exception as e:
            return {"error": str(e)}

    def reveal_in_folder(self, file_path: str) -> dict:
        """Reveals the exported file in the platform file manager."""
        if not file_path or not os.path.isfile(file_path):
            return self.open_output_folder()
        try:
            if sys.platform == "win32":
                subprocess.Popen(f'explorer /select,"{os.path.abspath(file_path)}"')
            elif sys.platform == "darwin":
                subprocess.Popen(["open", "-R", os.path.abspath(file_path)])
            else:
                self.open_output_folder(os.path.dirname(file_path))
            return {"success": True}
        except Exception as e:
            return {"error": str(e)}

    # -------------------------------------------------------------
    # Background Pipeline Execution Engine
    # -------------------------------------------------------------

    def _run_pipeline_worker(self, options: dict):
        """
        Executes all 6 pipeline stages in sequential non-blocking daemon thread.
        """
        url = options.get("url", "").strip()
        voice = options.get("voice", "km-KH-PisethNeural")
        whisper_model_name = options.get("whisper_model", "base")
        speech_rate = options.get("speech_rate", "+0%")
        remux_mode = options.get("remux_mode", "replace")
        proxy = options.get("proxy", "").strip()
        gemini_api_key = options.get("gemini_api_key", "").strip() or os.environ.get("GEMINI_API_KEY", "").strip()
        audio_delay_ms = float(options.get("audio_delay_ms", 250))
        production_mode = options.get("production_mode", "recap")
        vocal_enhancer = options.get("vocal_enhancer", "studio_human")
        if production_mode == "recap":
            remux_mode = "duck"  # In recap mode, background audio ducking keeps dramatic movie score & SFX

        # Unique session stem directory for this job
        job_id = int(time.time())
        job_stem_dir = os.path.join(STEMS_DIR, f"job_{job_id}")
        os.makedirs(job_stem_dir, exist_ok=True)

        try:
            self._emit_progress(
                stage=1,
                stage_name="Media Ingestion",
                progress=2.0,
                message="Initializing ingestion...",
                log_level="INFO",
                log_text=f"Dubbing job {job_id} started. Target: {url}"
            )

            # =========================================================
            # STAGE 1: Media Ingestion (yt-dlp or local file)
            # =========================================================
            source_video_path, video_title, video_duration = self._stage_1_ingest(url, job_stem_dir)
            if self._is_aborted:
                return

            # =========================================================
            # STAGE 2: Audio Extraction (16kHz Mono PCM WAV)
            # =========================================================
            extracted_wav_path = self._stage_2_extract_audio(source_video_path, job_stem_dir)
            if self._is_aborted:
                return

            # =========================================================
            # STAGE 3: Speech-to-Text (faster-whisper)
            # =========================================================
            segments, source_language = self._stage_3_transcribe(extracted_wav_path, whisper_model_name, video_duration)
            if self._is_aborted:
                return

            # =========================================================
            # STAGE 4: Script Generation (Drama Recap Storyteller or Direct Dubbing)
            # =========================================================
            if production_mode == "recap":
                translated_segments = self._stage_4_recap_storyteller(
                    segments, source_language, proxy, gemini_api_key, video_duration
                )
            else:
                translated_segments = self._stage_4_translate(
                    segments, source_language, proxy, gemini_api_key
                )
            if self._is_aborted:
                return

            # =========================================================
            # STAGE 5: Voiceover Synthesis (edge-tts) & Audio Alignment
            # =========================================================
            aligned_voiceover_wav = self._stage_5_synthesize_voiceover(
                translated_segments, voice, speech_rate, video_duration, job_stem_dir, proxy, audio_delay_ms, vocal_enhancer
            )
            if self._is_aborted:
                return

            # =========================================================
            # STAGE 6: Audio-Video Remux (ffmpeg)
            # =========================================================
            final_output_path, final_size_mb = self._stage_6_remux(
                source_video_path, aligned_voiceover_wav, video_title, voice, remux_mode
            )

            # Job Finished Successfully!
            mins, secs = divmod(int(video_duration), 60)
            duration_str = f"{mins:02d}:{secs:02d}"

            self._broadcast("onJobComplete", {
                "success": True,
                "output_path": os.path.abspath(final_output_path),
                "filename": os.path.basename(final_output_path),
                "file_size": f"{final_size_mb:.2f} MB",
                "duration": duration_str
            })

        except InterruptedError:
            self._emit_progress(
                stage=1,
                stage_name="Cancelled",
                progress=0,
                message="Operation cancelled by user.",
                log_level="WARN",
                log_text="Pipeline process successfully terminated."
            )
        except Exception as e:
            traceback.print_exc()
            err_msg = str(e)
            self._broadcast("onJobError", {
                "error": err_msg,
                "stage": 1
            })
            self._emit_progress(
                stage=1,
                stage_name="Error",
                progress=0,
                message=f"Pipeline error: {err_msg}",
                log_level="ERROR",
                log_text=f"Fatal Exception: {err_msg}\n{traceback.format_exc()}"
            )

    # -------------------------------------------------------------
    # Stage Implementation Details
    # -------------------------------------------------------------

    def _stage_1_ingest(self, target_url: str, stem_dir: str):
        """Downloads video using yt-dlp or copies local video file."""
        self._emit_progress(
            stage=1,
            stage_name="Media Ingestion",
            progress=5.0,
            message="Analyzing media source...",
            log_level="INFO",
            log_text="Inspecting target video source..."
        )

        # Check if target is a local file
        if os.path.isfile(target_url):
            self._emit_progress(
                stage=1,
                stage_name="Media Ingestion",
                progress=15.0,
                message="Loaded local video file.",
                log_level="INFO",
                log_text=f"Using local file directly: {target_url}"
            )
            title = Path(target_url).stem
            duration = get_media_duration(target_url, self._ffmpeg_path)
            return target_url, title, duration

        # Download via yt-dlp
        import yt_dlp

        download_template = os.path.join(stem_dir, "source_media.%(ext)s")
        downloaded_file = None

        def ytdl_progress_hook(d):
            if self._is_aborted:
                raise InterruptedError("Cancelled by user")
            if d.get("status") == "downloading":
                downloaded = d.get("downloaded_bytes", 0)
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 1
                ratio = downloaded / total
                pct = 5.0 + ratio * 10.0  # Stage 1 spans 5% - 15%
                speed = d.get("speed")
                speed_str = f" @ {speed / (1024 * 1024):.1f} MB/s" if speed else ""
                self._emit_progress(
                    stage=1,
                    stage_name="Media Ingestion",
                    progress=pct,
                    message=f"Downloading: {downloaded / (1024*1024):.1f}/{total / (1024*1024):.1f} MB{speed_str}",
                    log_level="INFO",
                    log_text=f"yt-dlp: {ratio * 100:.1f}% downloaded{speed_str}"
                )

        ydl_opts = {
            'format': 'bestvideo[vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': download_template,
            'progress_hooks': [ytdl_progress_hook],
            'ffmpeg_location': self._ffmpeg_path,
            'quiet': True,
            'no_warnings': True,
            'merge_output_format': 'mp4'
        }

        self._emit_progress(
            stage=1,
            stage_name="Media Ingestion",
            progress=7.0,
            message="Connecting to stream via yt-dlp...",
            log_level="INFO",
            log_text="Querying media manifest and formats..."
        )

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target_url, download=True)
            title = info.get("title", f"Video_{int(time.time())}")
            duration = info.get("duration") or get_media_duration(download_template.replace("%(ext)s", "mp4"), self._ffmpeg_path)
            downloaded_file = ydl.prepare_filename(info)

        # Confirm file exists or locate matching output
        if not os.path.isfile(downloaded_file):
            candidate = os.path.splitext(downloaded_file)[0] + ".mp4"
            if os.path.isfile(candidate):
                downloaded_file = candidate
            else:
                # Find any media file in stem_dir
                files = os.listdir(stem_dir)
                if files:
                    downloaded_file = os.path.join(stem_dir, files[0])
                else:
                    raise FileNotFoundError("yt-dlp completed but output media file was not found.")

        self._emit_progress(
            stage=1,
            stage_name="Media Ingestion",
            progress=16.0,
            message=f"Downloaded '{title[:30]}...' ({duration:.1f}s)",
            log_level="SUCCESS",
            log_text=f"Media ingestion complete: {downloaded_file} (Duration: {duration:.1f}s)"
        )
        return downloaded_file, title, float(duration)

    def _stage_2_extract_audio(self, video_path: str, stem_dir: str) -> str:
        """Converts video audio to 16kHz mono uncompressed PCM WAV using ffmpeg."""
        self._emit_progress(
            stage=2,
            stage_name="Audio Extraction",
            progress=18.0,
            message="Extracting 16kHz mono PCM WAV...",
            log_level="INFO",
            log_text=f"Running ffmpeg extraction on: {os.path.basename(video_path)}"
        )

        output_wav = os.path.join(stem_dir, "extracted_16k_mono.wav")
        cmd = [
            self._ffmpeg_path, "-y",
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            output_wav
        ]

        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0 or not os.path.isfile(output_wav):
            raise RuntimeError(f"FFmpeg audio extraction failed:\n{proc.stderr}")

        self._emit_progress(
            stage=2,
            stage_name="Audio Extraction",
            progress=22.0,
            message="Audio extraction complete (16kHz PCM).",
            log_level="SUCCESS",
            log_text=f"Created speech-ready WAV: {os.path.basename(output_wav)}"
        )
        return output_wav

    def _stage_3_transcribe(self, wav_path: str, model_size: str, total_duration: float = 60.0) -> tuple:
        """Runs faster-whisper speech recognition with int8 quantization."""
        self._emit_progress(
            stage=3,
            stage_name="Speech-to-Text",
            progress=24.0,
            message=f"Loading faster-whisper model ({model_size}-int8)...",
            log_level="INFO",
            log_text=f"Initializing faster-whisper (model={model_size}, compute_type=int8)..."
        )

        from faster_whisper import WhisperModel

        model = WhisperModel(model_size, device="cpu", compute_type="int8")

        self._emit_progress(
            stage=3,
            stage_name="Speech-to-Text",
            progress=27.0,
            message="Transcribing dialogue segments...",
            log_level="INFO",
            log_text="Running transcription inference..."
        )

        try:
            segments_iter, info = model.transcribe(
                wav_path,
                beam_size=5,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=400)
            )
        except Exception:
            segments_iter, info = model.transcribe(wav_path, beam_size=5)
        detected_language = getattr(info, "language", None) or "auto"
        self._emit_progress(
            stage=3,
            stage_name="Speech-to-Text",
            progress=29.0,
            message=f"Detected speech language: {info.language} ({info.language_probability*100:.1f}%)",
            log_level="WHISPER",
            log_text=f"Detected language '{info.language}' with {info.language_probability*100:.1f}% confidence."
        )

        segments = []
        for s in segments_iter:
            if self._is_aborted:
                raise InterruptedError("Cancelled by user")
            text = s.text.strip()
            if not text:
                continue
            item = {
                "id": len(segments),
                "start": s.start,
                "end": s.end,
                "text": text
            }
            segments.append(item)
            time_tag = f"[{format_timestamp(s.start)} -> {format_timestamp(s.end)}]"

            # Dynamic progress based on audio timestamp processed
            progress_ratio = min(1.0, s.end / max(1.0, total_duration))
            current_pct = 29.0 + progress_ratio * 11.0  # Spans 29% - 40%

            self._emit_progress(
                stage=3,
                stage_name="Speech-to-Text",
                progress=current_pct,
                message=f"Transcribed {len(segments)} segments ({format_timestamp(s.end)} / {format_timestamp(total_duration)})...",
                log_level="WHISPER",
                log_text=f"{time_tag} {text}"
            )

        if not segments:
            # Fallback segment if no dialogue was detected
            segments.append({
                "id": 0,
                "start": 0.0,
                "end": 3.0,
                "text": "Hello, welcome to this video."
            })
            self._emit_progress(
                stage=3,
                stage_name="Speech-to-Text",
                progress=40.0,
                message="No spoken dialogue detected; injected placeholder dialogue.",
                log_level="WARN",
                log_text="Audio stream contained no clear dialogue. Defaulting to intro narration."
            )

        self._emit_progress(
            stage=3,
            stage_name="Speech-to-Text",
            progress=40.0,
            message=f"Transcription finished ({len(segments)} segments).",
            log_level="SUCCESS",
            log_text=f"Successfully extracted {len(segments)} timestamped dialogue segments."
        )
        return segments, detected_language

    def _stage_4_recap_storyteller(self, segments: list, source_language: str = "auto",
                                   proxy_url: str = "", gemini_api_key: str = "",
                                   video_duration: float = 60.0) -> list:
        """
        Analyzes the full drama scene and generates an engaging, thrilling
        movie recap narration script in spoken Khmer (សង្ខេបរឿង).
        Maps narrative chunks across the video timeline.
        """
        self._emit_progress(
            stage=4,
            stage_name="Story Recap Analysis",
            progress=42.0,
            message="Analyzing drama plot & generating Khmer story recap (សង្ខេបរឿង)...",
            log_level="INFO",
            log_text="AI Storyteller analyzing full scene context, character conflict, and plot..."
        )

        import requests
        import urllib.parse
        proxies = get_configured_proxies(proxy_url)
        req_proxies = proxies if proxies else None

        key = gemini_api_key.strip() or os.environ.get("GEMINI_API_KEY", "").strip()

        # Build complete transcript with timestamps
        dialogue_transcript = "\n".join([
            f"[{format_timestamp(s['start'])} -> {format_timestamp(s['end'])}] {s['text']}"
            for s in segments if s.get("text", "").strip()
        ])

        if not dialogue_transcript:
            dialogue_transcript = "No spoken dialogue. Visual cinematic scene."

        system_prompt = (
            "You are a master Cambodian movie recap narrator and storyteller (អ្នកនិពន្ធរឿងសង្ខេប / និទានរឿងភាពយន្ត).\n\n"
            "Below is the complete transcript of character dialogues and timestamps from a drama clip:\n"
            "--------------------\n"
            f"{dialogue_transcript}\n"
            "--------------------\n"
            f"Total clip duration: {video_duration:.1f} seconds.\n\n"
            "YOUR TASK:\n"
            "1. Read and analyze the entire plot, characters, weapons, conflict, and drama taking place in this clip.\n"
            "2. Write an exciting, thrilling MOVIE RECAP (សង្ខេបរឿង) narration script in natural, spoken Khmer (ភាសាខ្មែរ), "
            "as heard on popular Cambodian movie review and storytelling channels.\n"
            "3. Structure your narration into time-aligned blocks [START_SECONDS - END_SECONDS] that narrate the events "
            f"progressively from 1.0s up to {max(2.0, video_duration - 1.0):.1f}s.\n"
            "4. Each block should be between 6 to 14 seconds long with 1 to 2 seconds of breathing room between blocks.\n"
            "5. Tone: Dramatic, engaging, vivid storytelling (e.g. 'នៅក្នុងឈុតនេះ...', 'ស្រាប់តែ...', 'តួប្រុសបាននិយាយថា...', 'ដោយសារតែ...').\n\n"
            "OUTPUT FORMAT (STRICT):\n"
            "Output ONLY the timecoded narration lines. No introductions, no English, no markdown formatting.\n"
            "Format:\n"
            "[START_SEC - END_SEC] Khmer narration text\n\n"
            "Example:\n"
            "[2.0 - 10.5] នៅក្នុងឈុតឆាកនេះ លោកម្ចាស់បានដកដាវដ៏កម្រមួយដើមចេញមក...\n"
            "[12.0 - 22.0] ខណៈពេលនោះ សត្រូវក៏បាននិយាយឌឺដងថា ដាវនេះគឺជាដាវមួយជំនាន់..."
        )

        recap_text = ""

        # Call AI with priority: OpenRouter / Gemini
        is_openrouter = key.startswith("sk-or-")
        is_groq = key.startswith("gsk_")
        is_openai_style = is_openrouter or is_groq or (key.startswith("sk-") and not is_openrouter)

        if is_openai_style:
            if is_openrouter:
                endpoint = "https://openrouter.ai/api/v1/chat/completions"
                candidate_models = [
                    "deepseek/deepseek-r1:free",
                    "deepseek/deepseek-chat:free",
                    "meta-llama/llama-3.3-70b-instruct:free",
                    "qwen/qwen-2.5-72b-instruct:free",
                    "google/gemini-2.0-flash-thinking-exp:free"
                ]
            elif is_groq:
                endpoint = "https://api.groq.com/openai/v1/chat/completions"
                candidate_models = ["llama-3.3-70b-versatile"]
            else:
                endpoint = "https://api.openai.com/v1/chat/completions"
                candidate_models = ["gpt-4o-mini"]

            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json"
            }
            if is_openrouter:
                headers["HTTP-Referer"] = "https://github.com/KhmerDubStudio"
                headers["X-Title"] = "KhmerDubStudio"

            for model_name in candidate_models:
                payload = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": system_prompt}],
                    "temperature": 0.4
                }
                try:
                    resp = requests.post(endpoint, headers=headers, json=payload, proxies=req_proxies, timeout=45)
                    if resp.status_code == 200:
                        recap_text = resp.json()["choices"][0]["message"]["content"]
                        if recap_text and contains_khmer(recap_text):
                            break
                    else:
                        print(f"[Recap AI] Model {model_name} error: {resp.status_code}", file=sys.stderr)
                except Exception as ex:
                    print(f"[Recap AI] Model {model_name} error: {ex}", file=sys.stderr)

        elif key.startswith("AIzaSy"):
            payload = {
                "contents": [{"parts": [{"text": system_prompt}]}],
                "generationConfig": {"temperature": 0.35, "maxOutputTokens": 4096}
            }
            for model_id in ("gemini-2.0-flash", "gemini-1.5-flash"):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={key}"
                try:
                    resp = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, proxies=req_proxies, timeout=35)
                    if resp.status_code == 200:
                        recap_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        if recap_text and contains_khmer(recap_text):
                            break
                except Exception as ex:
                    print(f"[Recap Gemini] Error: {ex}", file=sys.stderr)

        # Parse recap narration blocks
        recap_segments = []
        if recap_text:
            raw_lines = recap_text.split("\n")
            for line in raw_lines:
                line = line.strip()
                # Matches [START - END] Text or START - END: Text
                m = re.match(r"^\[?(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*\]?[\s.:\-]+(.+)$", line)
                if m:
                    try:
                        s_start = float(m.group(1))
                        s_end = float(m.group(2))
                        s_text = clean_translated_text(m.group(3).strip())
                        if s_text and contains_khmer(s_text):
                            recap_segments.append({
                                "id": len(recap_segments),
                                "start": max(0.5, s_start),
                                "end": min(video_duration, max(s_start + 1.0, s_end)),
                                "text": s_text,
                                "km_text": s_text
                            })
                    except Exception:
                        continue

        # If recap parsing succeeded with valid blocks, return them!
        if recap_segments:
            self._emit_progress(
                stage=4,
                stage_name="Story Recap Analysis",
                progress=60.0,
                message=f"Drama recap script created ({len(recap_segments)} storytelling scenes).",
                log_level="SUCCESS",
                log_text=f"Successfully generated {len(recap_segments)} Khmer movie recap (សង្ខេបរឿង) narration scenes."
            )
            # Log the story lines for the user in the execution terminal!
            for s in recap_segments:
                self._emit_progress(
                    stage=4,
                    stage_name="Story Recap Analysis",
                    progress=60.0,
                    message="Recap story narration prepared",
                    log_level="TRANSLATE",
                    log_text=f"[{format_timestamp(s['start'])} -> {format_timestamp(s['end'])}] និទាន: {s['km_text']}",
                    khmer_text=s["km_text"]
                )
            return recap_segments

        # Fallback to standard line translation if recap generation did not produce blocks
        self._emit_progress(
            stage=4,
            stage_name="Translation",
            progress=45.0,
            message="Falling back to direct line dubbing...",
            log_level="WARN",
            log_text="Recap format unavailable; falling back to direct dialogue translation."
        )
        return self._stage_4_translate(segments, source_language, proxy_url, gemini_api_key)

    def _stage_4_translate(self, segments: list, source_language: str = "auto", proxy_url: str = "", gemini_api_key: str = "") -> list:
        """
        Translates each dialogue segment to natural spoken Khmer (km).
        Provider chain: Gemini AI (Movie Quality) -> Google -> MyMemory -> direct Google endpoint, with
        per-provider failover so a temporary rate limit cannot silently leave
        segments untranslated.
        """
        self._emit_progress(
            stage=4,
            stage_name="Translation",
            progress=42.0,
            message="Initializing Khmer translator...",
            log_level="INFO",
            log_text=f"Connecting to translation engine (source={source_language}, target=Khmer/km)..."
        )

        import urllib.parse
        import requests

        proxies = get_configured_proxies(proxy_url)
        if proxies:
            self._emit_progress(
                stage=4,
                stage_name="Translation",
                progress=43.0,
                message="Using network proxy for translation...",
                log_level="INFO",
                log_text=f"Translation routed through proxy: {proxies.get('http') or proxies.get('https')}"
            )

        total = len(segments)

        # Already Khmer: nothing to translate.
        if source_language and source_language.lower() == "km":
            for seg in segments:
                seg["km_text"] = seg["text"]
            self._emit_progress(
                stage=4,
                stage_name="Translation",
                progress=60.0,
                message="Source audio is already Khmer; translation skipped.",
                log_level="SUCCESS",
                log_text="Detected Khmer speech. Reusing original dialogue text."
            )
            return segments

        cache = {}
        counts = {"Gemini AI": 0, "Google": 0, "MyMemory": 0, "Google GTX": 0, "Ollama": 0}
        untranslated = 0
        google_disabled = False
        ollama_model = os.environ.get("OLLAMA_MODEL", "qwen2.5:1.5b")

        # -------------------------------------------------------------
        # 1. AI Drama Batch Translation (Gemini / OpenRouter / Groq)
        # -------------------------------------------------------------
        if gemini_api_key and gemini_api_key.strip():
            key = gemini_api_key.strip()
            is_openrouter = key.startswith("sk-or-")
            is_groq = key.startswith("gsk_")
            is_openai_style = is_openrouter or is_groq or (key.startswith("sk-") and not is_openrouter)

            engine_name = "OpenRouter (Gemini 2.0 Free)" if is_openrouter else ("Groq AI" if is_groq else "Gemini AI")
            self._emit_progress(
                stage=4,
                stage_name="Translation",
                progress=44.0,
                message=f"Translating with {engine_name} (Movie Dubbing Quality)...",
                log_level="INFO",
                log_text=f"Connecting to {engine_name} with drama translation prompt."
            )

            batch_size = 15
            req_proxies = proxies if proxies else None

            for b_idx in range(0, total, batch_size):
                if self._is_aborted:
                    raise InterruptedError("Cancelled by user")

                batch = segments[b_idx:b_idx + batch_size]
                lines_text = "\n".join([f"[{s['id']}] {s['text']}" for s in batch if s['text'].strip()])
                if not lines_text:
                    continue

                system_prompt = (
                    "You are an expert Chinese drama dubbing translator specializing in translating "
                    "Chinese dramas (historical, Xianxia, Wuxia, and romance) into natural, fluent spoken Khmer (ភាសាខ្មែរ).\n\n"
                    "Task: Translate each dialogue line into authentic, natural Khmer dubbing speech.\n"
                    "Rules:\n"
                    "1. Use appropriate historical drama honorifics and respectful pronouns (e.g. 奴婢 -> ខ្ញុំម្ចាស់, 公子 -> អ្នកប្រុស/លោកម្ចាស់, 阁下 -> លោកម្ចាស់, 陛下 -> ព្រះអង្គ, 师傅 -> លោកគ្រូ).\n"
                    "2. Translate idioms and martial arts terms naturally with their true meaning and emotional tone (e.g. 斩草除根 -> កម្ចាត់ស្មៅត្រូវរំលើងឫស).\n"
                    "3. Keep lines concise for natural spoken lip-sync timing.\n"
                    "4. Output format: Exactly one line per input with matching [ID], containing only the Khmer translation.\n"
                    "Example:\n[0] ខ្ញុំម្ចាស់សូមដោះលែងលោកប្រុស...\n[1] ដាវស្វៀនហួន...\n\n"
                    f"Dialogue lines:\n{lines_text}"
                )

                if is_openai_style:
                    # OpenRouter / Groq / OpenAI compatible endpoint
                    if is_openrouter:
                        endpoint = "https://openrouter.ai/api/v1/chat/completions"
                        candidate_models = [
                            "deepseek/deepseek-r1:free",
                            "deepseek/deepseek-chat:free",
                            "meta-llama/llama-3.3-70b-instruct:free",
                            "qwen/qwen-2.5-72b-instruct:free",
                            "google/gemini-2.0-flash-thinking-exp:free"
                        ]
                    elif is_groq:
                        endpoint = "https://api.groq.com/openai/v1/chat/completions"
                        candidate_models = ["llama-3.3-70b-versatile"]
                    else:
                        endpoint = "https://api.openai.com/v1/chat/completions"
                        candidate_models = ["gpt-4o-mini"]

                    headers = {
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json"
                    }
                    if is_openrouter:
                        headers["HTTP-Referer"] = "https://github.com/KhmerDubStudio"
                        headers["X-Title"] = "KhmerDubStudio"

                    for model_name in candidate_models:
                        payload = {
                            "model": model_name,
                            "messages": [{"role": "user", "content": system_prompt}],
                            "temperature": 0.25
                        }
                        try:
                            resp = requests.post(endpoint, headers=headers, json=payload, proxies=req_proxies, timeout=30)
                            if resp.status_code == 200:
                                data = resp.json()
                                raw_out = data["choices"][0]["message"]["content"]
                                found_any = False
                                for r_line in raw_out.split("\n"):
                                    r_line = r_line.strip()
                                    m = re.match(r"^\[?(\d+)\]?[\s.:\-]+(.+)$", r_line)
                                    if m:
                                        s_id = int(m.group(1))
                                        km_t = clean_translated_text(m.group(2).strip())
                                        if km_t and contains_khmer(km_t):
                                            matched_seg = next((s for s in batch if s["id"] == s_id), None)
                                            if matched_seg:
                                                cache[matched_seg["text"].strip()] = (km_t, "AI Drama")
                                                found_any = True
                                if found_any:
                                    break
                            else:
                                print(f"[{engine_name}] Model {model_name} returned {resp.status_code}, trying next...", file=sys.stderr)
                        except Exception as ai_err:
                            print(f"[{engine_name}] Connection error with {model_name}: {ai_err}", file=sys.stderr)
                else:
                    # Standard Google AI Studio endpoint
                    payload = {
                        "contents": [{"parts": [{"text": system_prompt}]}],
                        "generationConfig": {"temperature": 0.25, "maxOutputTokens": 4096}
                    }

                    for model_id in ("gemini-2.0-flash", "gemini-1.5-flash"):
                        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={key}"
                        try:
                            resp = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, proxies=req_proxies, timeout=25)
                            if resp.status_code == 200:
                                data = resp.json()
                                raw_out = data["candidates"][0]["content"]["parts"][0]["text"]
                                for r_line in raw_out.split("\n"):
                                    r_line = r_line.strip()
                                    m = re.match(r"^\[?(\d+)\]?[\s.:\-]+(.+)$", r_line)
                                    if m:
                                        s_id = int(m.group(1))
                                        km_t = clean_translated_text(m.group(2).strip())
                                        if km_t and contains_khmer(km_t):
                                            matched_seg = next((s for s in batch if s["id"] == s_id), None)
                                            if matched_seg:
                                                cache[matched_seg["text"].strip()] = (km_t, "Gemini AI")
                                break
                            elif resp.status_code == 429:
                                time.sleep(1.0)
                        except Exception as g_err:
                            print(f"[Gemini] {model_id} error: {g_err}", file=sys.stderr)

        google = None
        try:
            from deep_translator import GoogleTranslator
            google = GoogleTranslator(source="auto", target="km", proxies=proxies if proxies else None)
        except Exception as e:
            print(f"[Translation] GoogleTranslator unavailable: {e}", file=sys.stderr)

        mymemory = None
        mymemory_src = mymemory_language_code(source_language)
        try:
            from deep_translator import MyMemoryTranslator
            if mymemory_src:
                mymemory = MyMemoryTranslator(source=mymemory_src, target="km-KH", proxies=proxies if proxies else None)
        except Exception as e:
            print(f"[Translation] MyMemoryTranslator unavailable: {e}", file=sys.stderr)

        def google_direct(text: str) -> str:
            req_proxies = proxies if proxies else None
            for domain in ("translate.googleapis.com", "translate.google.com"):
                try:
                    url = f"https://{domain}/translate_a/single?client=gtx&sl=auto&tl=km&dt=t&q=" + urllib.parse.quote(text)
                    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, proxies=req_proxies, timeout=12)
                    if resp.status_code == 429:
                        raise RuntimeError("Google rate limit (HTTP 429)")
                    if resp.status_code == 200:
                        payload = resp.json()
                        result = "".join(part[0] for part in payload[0] if part and part[0])
                        if result and result.strip() and contains_khmer(result):
                            return result.strip()
                except RuntimeError:
                    raise
                except Exception:
                    continue
            return ""

        def mymemory_direct(text: str) -> str:
            langpair = urllib.parse.quote(f"{mymemory_src}|km-KH")
            url = (
                "https://api.mymemory.translated.net/get?q="
                + urllib.parse.quote(text)
                + f"&langpair={langpair}"
            )
            req_proxies = proxies if proxies else None
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, proxies=req_proxies, timeout=15)
            resp.raise_for_status()
            payload = resp.json()
            status = payload.get("responseStatus")
            if str(status) != "200":
                raise RuntimeError(payload.get("responseDetails") or f"MyMemory error {status}")
            return (payload.get("responseData") or {}).get("translatedText") or ""

        def ollama_direct(text: str) -> str:
            prompt = (
                "Translate this Chinese text into natural, spoken Khmer (Cambodian). "
                "Output ONLY the Khmer translation, with no pinyin, no quotes, no explanations.\n\n"
                f"Chinese: {text}"
            )
            resp = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": ollama_model, "prompt": prompt, "stream": False},
                timeout=30,
            )
            resp.raise_for_status()
            return (resp.json() or {}).get("response") or ""

        def translate_text(text: str):
            """Returns (khmer_text, provider_name_or_None)."""
            nonlocal google_disabled
            clean = text.strip()
            if not clean:
                return "", None
            if clean in cache:
                return cache[clean]

            # 1. Google via deep-translator
            if google and not google_disabled:
                try:
                    out = clean_translated_text(google.translate(clean))
                    if out and contains_khmer(out):
                        cache[clean] = (out, "Google")
                        return cache[clean]
                except Exception as e:
                    if "429" in str(e) or "TooManyRequests" in type(e).__name__:
                        google_disabled = True
                        print("[Translation] Google rate limited; switching to MyMemory.", file=sys.stderr)

            # 2. MyMemory (library, then direct API)
            if mymemory_src:
                for attempt in range(2):
                    try:
                        if mymemory and attempt == 0:
                            out = mymemory.translate(clean)
                        else:
                            out = mymemory_direct(clean)
                        out = clean_translated_text(out)
                        if out and contains_khmer(out):
                            cache[clean] = (out, "MyMemory")
                            return cache[clean]
                    except Exception:
                        time.sleep(0.6)

            # 3. Direct Google endpoint as a last resort
            try:
                out = clean_translated_text(google_direct(clean))
                if out:
                    cache[clean] = (out, "Google GTX")
                    return cache[clean]
            except Exception:
                pass

            # 4. Local Ollama model - final fallback, used only when every network
            # translator above has failed (e.g. fully offline). Quality is not
            # guaranteed for Khmer with small local models.
            try:
                out = clean_translated_text(ollama_direct(clean))
                if out and contains_khmer(out):
                    cache[clean] = (out, "Ollama")
                    return cache[clean]
            except Exception:
                pass

            return clean, None

        for idx, seg in enumerate(segments):
            if self._is_aborted:
                raise InterruptedError("Cancelled by user")

            original_text = seg["text"]
            khmer_text, provider = translate_text(original_text)
            seg["km_text"] = khmer_text

            if provider:
                counts[provider] += 1
            else:
                untranslated += 1

            pct = 42.0 + ((idx + 1) / total) * 18.0  # Spans 42% - 60%
            time_tag = f"[{format_timestamp(seg['start'])} -> {format_timestamp(seg['end'])}]"
            self._emit_progress(
                stage=4,
                stage_name="Translation",
                progress=pct,
                message=f"Translated {idx+1}/{total} dialogue lines to Khmer...",
                log_level="TRANSLATE" if provider else "WARN",
                log_text=f"{time_tag} [{provider or 'UNTRANSLATED'}] Original: {original_text}",
                khmer_text=khmer_text if provider else None
            )
            # Be gentle with public endpoints to avoid rate limiting.
            time.sleep(0.5 if provider == "MyMemory" else 0.7)

        summary = ", ".join(f"{name}: {count}" for name, count in counts.items() if count)
        if untranslated:
            self._emit_progress(
                stage=4,
                stage_name="Translation",
                progress=60.0,
                message=f"Translation finished with {untranslated}/{total} untranslated segments.",
                log_level="WARN",
                log_text=(
                    f"Could not translate {untranslated}/{total} segments "
                    f"({summary or 'no provider succeeded'}). Those segments will be skipped in the voiceover."
                )
            )
        else:
            self._emit_progress(
                stage=4,
                stage_name="Translation",
                progress=60.0,
                message=f"Khmer translation completed ({total} segments).",
                log_level="SUCCESS",
                log_text=f"All {total} dialogue segments translated to Khmer ({summary})."
            )
        return segments

    def _stage_5_synthesize_voiceover(self, segments: list, voice: str, rate: str,
                                      total_duration: float, stem_dir: str, proxy_url: str = "",
                                      audio_delay_ms: float = 250.0,
                                      vocal_enhancer: str = "studio_human") -> str:
        """
        Synthesizes natural Khmer speech for each segment using edge-tts with
        SSML natural breathing and studio vocal mastering (human chest warmth EQ,
        de-essing, broadcast dynamic compression & acoustic room presence).
        """
        enhancer_label = {
            "studio_human": "Studio Human Voice (Chest Warmth + Natural Breathing)",
            "dramatic_movie": "Dramatic Movie Narrator (Deep Tone + Studio Reverb)",
            "warm_storyteller": "Warm Storyteller (Intimate Acoustic Presence)",
            "raw": "Standard Synthetic Voice (Dry)"
        }.get(vocal_enhancer, "Studio Human Voice")

        self._emit_progress(
            stage=5,
            stage_name="Voiceover Synthesis",
            progress=62.0,
            message=f"Synthesizing voiceover: {voice} [{enhancer_label}]...",
            log_level="INFO",
            log_text=f"Connecting to Microsoft Edge TTS ({voice}, rate={rate}, enhancer={vocal_enhancer}, delay=+{audio_delay_ms:.0f}ms)..."
        )

        import edge_tts
        global np
        if np is None:
            import numpy as np

        proxies = get_configured_proxies(proxy_url)
        edge_proxy = (proxies.get("https") or proxies.get("http")) if proxies else None

        tts_dir = os.path.join(stem_dir, "tts_chunks")
        os.makedirs(tts_dir, exist_ok=True)

        sample_rate = 48000
        audio_delay_sec = max(0.0, float(audio_delay_ms) / 1000.0)
        total_samples = max(int((total_duration + audio_delay_sec) * sample_rate) + (sample_rate * 2), sample_rate * 5)
        # Create blank 2-channel 16-bit PCM master track
        master_audio = np.zeros((total_samples, 2), dtype=np.int16)

        total_segs = len(segments)

        # Human Vocal Studio Mastering Chain Configuration
        pitch_val = "+0Hz"
        vocal_filters = []
        if vocal_enhancer == "studio_human":
            pitch_val = "-1Hz"
            vocal_filters = [
                "highpass=f=75",
                "equalizer=f=200:t=q:w=1.2:g=3.5",
                "equalizer=f=3300:t=q:w=1.5:g=2.5",
                "equalizer=f=7200:t=q:w=2.0:g=-2.5",
                "acompressor=threshold=-16dB:ratio=3.0:attack=10:release=60"
            ]
        elif vocal_enhancer == "dramatic_movie":
            pitch_val = "-3Hz"  # Deeper cinematic authority
            vocal_filters = [
                "highpass=f=70",
                "equalizer=f=180:t=q:w=1.2:g=4.5",
                "equalizer=f=3500:t=q:w=1.5:g=3.0",
                "equalizer=f=7500:t=q:w=2.0:g=-2.0",
                "acompressor=threshold=-18dB:ratio=3.5:attack=8:release=50",
                "aecho=0.8:0.88:25:0.12"
            ]
        elif vocal_enhancer == "warm_storyteller":
            pitch_val = "+0Hz"
            vocal_filters = [
                "highpass=f=85",
                "equalizer=f=240:t=q:w=1.4:g=3.0",
                "equalizer=f=3000:t=q:w=1.5:g=2.0",
                "lowpass=f=9500",
                "acompressor=threshold=-20dB:ratio=2.5:attack=15:release=80"
            ]

        def _humanize_khmer_script(text: str) -> str:
            # Inserts subtle breathing pauses at sentence boundaries
            t = re.sub(r'([។!?])\s*', r'\1 , ', text)
            t = re.sub(r',\s*,+', ', ', t)
            return t.strip()

        for idx, seg in enumerate(segments):
            if self._is_aborted:
                raise InterruptedError("Cancelled by user")

            km_text = seg.get("km_text", "").strip()
            if not km_text:
                continue

            # Never feed non-Khmer text to a Khmer neural voice: edge-tts returns
            # "NoAudioReceived" and the segment would be silently dropped.
            if not contains_khmer(km_text):
                self._emit_progress(
                    stage=5,
                    stage_name="Voiceover Synthesis",
                    progress=62.0 + ((idx + 1) / max(1, total_segs)) * 22.0,
                    message=f"Skipped segment {idx+1}: translation unavailable.",
                    log_level="WARN",
                    log_text=f"Segment {idx+1} has no Khmer text; skipping TTS: '{km_text[:30]}...'"
                )
                continue

            mp3_path = os.path.join(tts_dir, f"seg_{idx:04d}.mp3")
            wav_path = os.path.join(tts_dir, f"seg_{idx:04d}.wav")

            speech_input = _humanize_khmer_script(km_text) if vocal_enhancer != "raw" else km_text

            # Asynchronously synthesize mp3 via edge-tts with automatic retry
            async def _synthesize():
                communicate = edge_tts.Communicate(
                    speech_input, voice=voice, rate=rate, pitch=pitch_val, proxy=edge_proxy
                )
                await communicate.save(mp3_path)

            success = False
            last_error = None
            for attempt in range(3):
                try:
                    asyncio.run(_synthesize())
                    if os.path.isfile(mp3_path) and os.path.getsize(mp3_path) > 0:
                        success = True
                        break
                except Exception as e:
                    last_error = e
                    time.sleep(0.5)

            pct = 62.0 + ((idx + 1) / total_segs) * 22.0  # Spans 62% - 84%

            if not success:
                error_detail = f" ({type(last_error).__name__}: {last_error})" if last_error else ""
                self._emit_progress(
                    stage=5,
                    stage_name="Voiceover Synthesis",
                    progress=pct,
                    message=f"Warning: TTS skipped segment {idx+1}",
                    log_level="WARN",
                    log_text=f"TTS failed for '{km_text[:30]}...'{error_detail}"
                )
                continue

            # Calculate duration matching: stretch or compress Khmer TTS audio to match the original actor's speech duration
            target_dur = max(0.5, float(seg.get("end", 0.0)) - float(seg.get("start", 0.0)))
            tts_dur = get_media_duration(mp3_path, self._ffmpeg_path)

            all_filters = []
            if tts_dur > 0:
                speed_ratio = tts_dur / target_dur
                # Clamp to natural human speech bounds (0.85x to 1.35x) so audio sounds completely natural
                if speed_ratio > 1.08:
                    atempo = min(1.35, speed_ratio)
                    all_filters.append(f"atempo={atempo:.3f}")
                elif speed_ratio < 0.92:
                    atempo = max(0.88, speed_ratio)
                    all_filters.append(f"atempo={atempo:.3f}")

            if vocal_filters:
                all_filters.extend(vocal_filters)

            filter_args = ["-filter:a", ",".join(all_filters)] if all_filters else []

            # Convert segment mp3 to 48kHz stereo WAV with dynamic duration matching + vocal mastering
            convert_cmd = [
                self._ffmpeg_path, "-y",
                "-i", mp3_path,
                *filter_args,
                "-ar", str(sample_rate),
                "-ac", "2",
                "-acodec", "pcm_s16le",
                wav_path
            ]
            subprocess.run(convert_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

            # Read segment WAV samples
            with wave.open(wav_path, "rb") as wf:
                n_frames = wf.getnframes()
                raw_bytes = wf.readframes(n_frames)
                seg_samples = np.frombuffer(raw_bytes, dtype=np.int16).reshape(-1, 2)

            # Ensure master_audio has enough capacity for this segment
            start_sample = max(0, int((seg["start"] + audio_delay_sec) * sample_rate))
            end_sample = start_sample + len(seg_samples)
            if end_sample > len(master_audio):
                extension = np.zeros((end_sample - len(master_audio) + sample_rate, 2), dtype=np.int16)
                master_audio = np.vstack((master_audio, extension))

            paste_len = len(seg_samples)
            if paste_len > 0:
                # Additive mixing with clipping bounds
                mixed = (master_audio[start_sample:end_sample].astype(np.int32) +
                         seg_samples.astype(np.int32))
                master_audio[start_sample:end_sample] = np.clip(mixed, -32768, 32767).astype(np.int16)

            self._emit_progress(
                stage=5,
                stage_name="Voiceover Synthesis",
                progress=pct,
                message=f"Synthesized voiceover {idx+1}/{total_segs}...",
                log_level="INFO",
                log_text=f"Rendered voice segment {idx+1}: {km_text[:40]}..."
            )

        # Export aligned master WAV
        master_wav_path = os.path.join(stem_dir, "dubbed_voiceover_aligned.wav")
        with wave.open(master_wav_path, "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(master_audio.tobytes())

        self._emit_progress(
            stage=5,
            stage_name="Voiceover Synthesis",
            progress=85.0,
            message="Time-aligned Khmer voiceover track assembled.",
            log_level="SUCCESS",
            log_text=f"Master voice track created: {os.path.basename(master_wav_path)}"
        )
        return master_wav_path

    def _stage_6_remux(self, source_video_path: str, voiceover_wav: str,
                       title: str, voice_name: str, remux_mode: str) -> tuple:
        """
        Remuxes Khmer voiceover audio with the original video using ffmpeg.
        Supports both full audio replacement and studio background audio ducking.
        """
        self._emit_progress(
            stage=6,
            stage_name="Audio-Video Remux",
            progress=87.0,
            message="Remuxing audio and video streams...",
            log_level="INFO",
            log_text="Running ffmpeg remux pipeline..."
        )

        safe_title = sanitize_filename(title)
        voice_short = "Piseth" if "Piseth" in voice_name else "Sreymom"
        output_filename = f"{safe_title}_KhmerDub_{voice_short}_{int(time.time())}.mp4"
        final_output_path = os.path.join(OUTPUT_DIR, output_filename)

        # Probe the source video codec. Widely-playable codecs (H.264/HEVC) can be
        # stream-copied for speed; anything else (e.g. AV1, which QuickTime and many
        # other players can't decode) must be transcoded to H.264 or the exported
        # file will open with a black/unplayable video track.
        probe = subprocess.run(
            [self._ffmpeg_path, "-i", source_video_path],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
        codec_match = re.search(r"Video:\s*([a-zA-Z0-9_]+)", probe.stderr or "")
        source_codec = codec_match.group(1).lower() if codec_match else ""

        if source_codec in ("h264", "avc", "avc1"):
            video_codec_args = ["-c:v", "copy"]
        elif source_codec in ("hevc", "h265"):
            video_codec_args = ["-c:v", "copy", "-tag:v", "hvc1"]
        else:
            video_codec_args = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p"]
            self._emit_progress(
                stage=6,
                stage_name="Audio-Video Remux",
                progress=88.0,
                message="Transcoding video for playback compatibility...",
                log_level="INFO",
                log_text=f"Source video codec '{source_codec or 'unknown'}' is not widely supported on Mac/QuickTime; re-encoding to standard H.264."
            )

        if remux_mode == "duck":
            # Studio ducking: keep 15% original audio under full Khmer voice
            cmd = [
                self._ffmpeg_path, "-y",
                "-i", source_video_path,
                "-i", voiceover_wav,
                "-filter_complex",
                "[0:a]volume=0.15[bg];[1:a]volume=1.0[voice];[bg][voice]amix=inputs=2:duration=first[aout]",
                "-map", "0:v",
                "-map", "[aout]",
                *video_codec_args,
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                "-shortest",
                final_output_path
            ]
        else:
            # Default per spec: pure replacement (-c:v copy -c:a aac -shortest)
            cmd = [
                self._ffmpeg_path, "-y",
                "-i", source_video_path,
                "-i", voiceover_wav,
                "-map", "0:v:0",
                "-map", "1:a:0",
                *video_codec_args,
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                "-shortest",
                final_output_path
            ]

        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        # If duck mode failed (e.g. source has no audio stream), fallback to direct voice replacement
        if proc.returncode != 0 and remux_mode == "duck":
            self._emit_progress(
                stage=6,
                stage_name="Audio-Video Remux",
                progress=92.0,
                message="Ducking filter fell back to pure voiceover replacement...",
                log_level="WARN",
                log_text="Background mix not applicable to stream; replacing audio directly."
            )
            cmd = [
                self._ffmpeg_path, "-y",
                "-i", source_video_path,
                "-i", voiceover_wav,
                "-map", "0:v:0",
                "-map", "1:a:0",
                *video_codec_args,
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                final_output_path
            ]
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if proc.returncode != 0 or not os.path.isfile(final_output_path):
            raise RuntimeError(f"FFmpeg remuxing failed:\n{proc.stderr}")

        file_size_mb = os.path.getsize(final_output_path) / (1024 * 1024)

        self._emit_progress(
            stage=6,
            stage_name="Audio-Video Remux",
            progress=100.0,
            message="Export complete!",
            log_level="SUCCESS",
            log_text=f"Exported finished MP4 ({file_size_mb:.2f} MB): {final_output_path}"
        )
        return final_output_path, file_size_mb


def main():
    """Application entrypoint (desktop GUI by default, browser server with --web)."""
    if "--web" in sys.argv or os.environ.get("KHMERDUB_MODE", "").lower() == "web":
        from server import run_server
        run_server()
        return

    # Single-instance lock: prevents multiple stacked windows from opening
    global _app_lock_file
    try:
        import tempfile
        lock_path = os.path.join(tempfile.gettempdir(), "khmerdubstudio_instance.lock")
        _app_lock_file = open(lock_path, "a+")
        if sys.platform != "win32":
            import fcntl
            fcntl.flock(_app_lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        else:
            import msvcrt
            msvcrt.locking(_app_lock_file.fileno(), msvcrt.LK_NBLCK, 1)
    except Exception:
        print("[INFO] Another instance of KhmerDubStudio is already running. Exiting duplicate.")
        sys.exit(0)

    html_path = os.path.join(WEB_DIR, "index.html")
    if not os.path.isfile(html_path):
        print(f"Error: Frontend file not found at {html_path}", file=sys.stderr)
        sys.exit(1)

    if webview is None:
        print(
            "Error: pywebview is not installed. Install desktop dependencies with "
            "`pip install -r requirements-desktop.txt`, or run browser mode with "
            "`python app.py --web`.",
            file=sys.stderr,
        )
        sys.exit(1)

    api = DubbingAPI()

    window = webview.create_window(
        title="KhmerDubStudio - AI Video Dubbing Studio",
        url=html_path,
        js_api=api,
        width=1280,
        height=840,
        min_size=(1080, 700),
        background_color="#09090b"
    )

    api._set_window(window)
    def _on_close():
        os._exit(0)
    window.events.closing += _on_close
    window.events.closed += _on_close
    webview.start(debug=False)
    os._exit(0)


if __name__ == "__main__":
    main()
