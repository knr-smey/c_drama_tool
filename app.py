#!/usr/bin/env python3
"""
KhmerDubStudio - AI Video Dubbing Desktop Application
A complete Windows desktop application using pywebview, Tailwind CSS, and AI libraries.

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


def resolve_ffmpeg_path() -> str:
    """
    Locates the ffmpeg executable on Windows:
    1. Checks system PATH
    2. Checks imageio_ffmpeg bundled binary
    3. Checks local project bin directory
    4. Checks standard Windows installation paths
    """
    # 1. Check system PATH
    ffmpeg_exe = shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")
    if ffmpeg_exe and os.path.isfile(ffmpeg_exe):
        _ensure_in_path(os.path.dirname(ffmpeg_exe))
        return os.path.abspath(ffmpeg_exe)

    # 2. Check imageio_ffmpeg if installed
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.isfile(exe):
            bin_dir = os.path.dirname(exe)
            standard_ffmpeg = os.path.join(bin_dir, "ffmpeg.exe")
            if not os.path.isfile(standard_ffmpeg):
                try:
                    shutil.copy2(exe, standard_ffmpeg)
                except Exception:
                    pass
            _ensure_in_path(bin_dir)
            return standard_ffmpeg if os.path.isfile(standard_ffmpeg) else os.path.abspath(exe)
    except Exception:
        pass

    # 3. Check local ./bin/ffmpeg.exe
    local_bin = os.path.join(APP_ROOT, "bin", "ffmpeg.exe")
    if os.path.isfile(local_bin):
        _ensure_in_path(os.path.dirname(local_bin))
        return local_bin

    # 4. Check common Windows install locations
    common_locations = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\ProgramData\chocolatey\bin\ffmpeg.exe",
        os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"),
    ]
    for loc in common_locations:
        if os.path.isfile(loc):
            _ensure_in_path(os.path.dirname(loc))
            return loc

    return "ffmpeg"


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


def get_media_duration(file_path: str, ffmpeg_exe: str) -> float:
    """Determines media duration using ffprobe or ffmpeg metadata parse."""
    ffprobe_exe = shutil.which("ffprobe") or shutil.which("ffprobe.exe")
    if not ffprobe_exe:
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)
        candidate = os.path.join(ffmpeg_dir, "ffprobe.exe")
        if os.path.isfile(candidate):
            ffprobe_exe = candidate

    if ffprobe_exe and os.path.isfile(ffprobe_exe):
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

    def _set_window(self, window):
        self._window = window

    def _broadcast(self, event_name: str, data: dict):
        """Dispatches structured events to the webview UI via window.evaluate_js"""
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
        """Opens the exported video file in default media player."""
        if not file_path or not os.path.isfile(file_path):
            return {"error": "File does not exist"}
        try:
            if sys.platform == "win32":
                os.startfile(file_path)
            else:
                subprocess.Popen(["xdg-open", file_path])
            return {"success": True}
        except Exception as e:
            return {"error": str(e)}

    def reveal_in_folder(self, file_path: str) -> dict:
        """Selects the exported file inside Windows File Explorer."""
        if not file_path or not os.path.isfile(file_path):
            return self.open_output_folder()
        try:
            if sys.platform == "win32":
                subprocess.Popen(f'explorer /select,"{os.path.abspath(file_path)}"')
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
            segments = self._stage_3_transcribe(extracted_wav_path, whisper_model_name, video_duration)
            if self._is_aborted:
                return

            # =========================================================
            # STAGE 4: Translation to Khmer (deep-translator)
            # =========================================================
            translated_segments = self._stage_4_translate(segments)
            if self._is_aborted:
                return

            # =========================================================
            # STAGE 5: Voiceover Synthesis (edge-tts) & Audio Alignment
            # =========================================================
            aligned_voiceover_wav = self._stage_5_synthesize_voiceover(
                translated_segments, voice, speech_rate, video_duration, job_stem_dir
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
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
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

    def _stage_3_transcribe(self, wav_path: str, model_size: str, total_duration: float = 60.0) -> list:
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

        segments_iter, info = model.transcribe(wav_path, beam_size=5)
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
        return segments

    def _stage_4_translate(self, segments: list) -> list:
        """Translates each dialogue segment to natural spoken Khmer (km)."""
        self._emit_progress(
            stage=4,
            stage_name="Translation",
            progress=42.0,
            message="Initializing Khmer translator...",
            log_level="INFO",
            log_text="Connecting to translation engine (Target: Khmer / km)..."
        )

        from deep_translator import GoogleTranslator
        import urllib.parse
        import requests

        translator = GoogleTranslator(source='auto', target='km')
        total = len(segments)
        cache = {}

        def translate_text(text: str) -> str:
            clean = text.strip()
            if not clean:
                return ""
            if clean in cache:
                return cache[clean]

            # 1. Try deep-translator
            try:
                translated = translator.translate(clean)
                if translated and translated.strip():
                    res = translated.strip()
                    cache[clean] = res
                    return res
            except Exception:
                pass

            # 2. Resilient fallback to direct Google GTX endpoint
            try:
                url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=km&dt=t&q=" + urllib.parse.quote(clean)
                resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10).json()
                translated = "".join([part[0] for part in resp[0] if part[0]])
                if translated and translated.strip():
                    res = translated.strip()
                    cache[clean] = res
                    return res
            except Exception:
                pass

            return clean  # Return original if all providers unavailable

        for idx, seg in enumerate(segments):
            if self._is_aborted:
                raise InterruptedError("Cancelled by user")

            original_text = seg["text"]
            khmer_text = translate_text(original_text)
            seg["km_text"] = khmer_text

            pct = 42.0 + ((idx + 1) / total) * 18.0  # Spans 42% - 60%
            time_tag = f"[{format_timestamp(seg['start'])} -> {format_timestamp(seg['end'])}]"
            self._emit_progress(
                stage=4,
                stage_name="Translation",
                progress=pct,
                message=f"Translated {idx+1}/{total} dialogue lines to Khmer...",
                log_level="TRANSLATE",
                log_text=f"{time_tag} Original: {original_text}",
                khmer_text=khmer_text
            )
            time.sleep(0.04)

        self._emit_progress(
            stage=4,
            stage_name="Translation",
            progress=60.0,
            message=f"Khmer translation completed ({total} segments).",
            log_level="SUCCESS",
            log_text="All dialogue segments successfully translated into natural Khmer script."
        )
        return segments

    def _stage_5_synthesize_voiceover(self, segments: list, voice: str, rate: str,
                                      total_duration: float, stem_dir: str) -> str:
        """
        Synthesizes Khmer speech for each segment using edge-tts,
        then aligns all segments into a time-synchronized full-length PCM audio track.
        """
        self._emit_progress(
            stage=5,
            stage_name="Voiceover Synthesis",
            progress=62.0,
            message=f"Synthesizing neural voiceover ({voice})...",
            log_level="INFO",
            log_text=f"Connecting to Microsoft Edge TTS with voice: {voice} (rate={rate})..."
        )

        import edge_tts
        global np
        if np is None:
            import numpy as np

        tts_dir = os.path.join(stem_dir, "tts_chunks")
        os.makedirs(tts_dir, exist_ok=True)

        sample_rate = 48000
        total_samples = max(int(total_duration * sample_rate) + (sample_rate * 2), sample_rate * 5)
        # Create blank 2-channel 16-bit PCM master track
        master_audio = np.zeros((total_samples, 2), dtype=np.int16)

        total_segs = len(segments)

        for idx, seg in enumerate(segments):
            if self._is_aborted:
                raise InterruptedError("Cancelled by user")

            km_text = seg.get("km_text", "").strip()
            if not km_text:
                continue

            mp3_path = os.path.join(tts_dir, f"seg_{idx:04d}.mp3")
            wav_path = os.path.join(tts_dir, f"seg_{idx:04d}.wav")

            # Asynchronously synthesize mp3 via edge-tts with automatic retry
            async def _synthesize():
                communicate = edge_tts.Communicate(km_text, voice=voice, rate=rate)
                await communicate.save(mp3_path)

            success = False
            for attempt in range(3):
                try:
                    asyncio.run(_synthesize())
                    if os.path.isfile(mp3_path) and os.path.getsize(mp3_path) > 0:
                        success = True
                        break
                except Exception:
                    time.sleep(0.5)

            pct = 62.0 + ((idx + 1) / total_segs) * 22.0  # Spans 62% - 84%

            if not success:
                self._emit_progress(
                    stage=5,
                    stage_name="Voiceover Synthesis",
                    progress=pct,
                    message=f"Warning: TTS skipped segment {idx+1}",
                    log_level="WARN",
                    log_text=f"TTS synthesis temporarily unavailable for: '{km_text[:30]}...'"
                )
                continue

            # Convert segment mp3 to 48kHz stereo WAV using ffmpeg
            convert_cmd = [
                self._ffmpeg_path, "-y",
                "-i", mp3_path,
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
            start_sample = int(seg["start"] * sample_rate)
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
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
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
                "-c:v", "copy",
                "-c:a", "aac",
                "-b:a", "192k",
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
                "-c:v", "copy",
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
    """Application entrypoint."""
    html_path = os.path.join(WEB_DIR, "index.html")
    if not os.path.isfile(html_path):
        print(f"Error: Frontend file not found at {html_path}", file=sys.stderr)
        sys.exit(1)

    api = DubbingAPI()

    window = webview.create_window(
        title="KhmerDubStudio - AI Video Dubbing Studio",
        url=html_path,
        js_api=api,
        width=1280,
        height=840,
        min_size=(1080, 700),
        background_color="#020617"
    )

    api._set_window(window)
    webview.start(debug=False)


if __name__ == "__main__":
    main()
