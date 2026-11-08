# KhmerDubStudio - AI Video Dubbing Studio

**KhmerDubStudio** is an AI video dubbing application built with **Python**, **Tailwind CSS**, and AI speech/audio libraries. It automatically transcribes, translates, synthesizes, and remuxes videos into Khmer neural voiceovers (`km-KH`).

It runs three ways:

- **macOS / Linux desktop** — native window via `pywebview`
- **Windows desktop** — native window via `pywebview` (Edge WebView2)
- **Docker / browser** — headless HTTP server, drive the same UI from any browser

---

## 🚀 Key Highlights & Architecture

```
[ Video URL / File ]
        │
        ▼ (Stage 1: yt-dlp)
[ Downloaded MP4 Stream ]
        │
        ▼ (Stage 2: ffmpeg)
[ 16kHz Mono PCM Audio (WAV) ]
        │
        ▼ (Stage 3: faster-whisper int8)
[ Timestamped Dialogue Segments ]
        │
        ▼ (Stage 4: deep-translator)
[ Translated Khmer Dialogue (km) ]
        │
        ▼ (Stage 5: edge-tts + numpy)
[ Time-Aligned Khmer Voiceover Track ]
        │
        ▼ (Stage 6: ffmpeg remux)
[ Final Exported Khmer Dubbed Video ]
```

### 1. Pipeline Stages
1. **Media Ingestion**: Uses `yt-dlp` to fetch high-resolution MP4 video and audio streams (or consumes local video files directly).
2. **Audio Extraction**: Converts audio to 16kHz mono uncompressed PCM WAV via `ffmpeg` for optimal speech recognition.
3. **Speech-to-Text**: Runs `faster-whisper` (`base` / `small` / `medium` with `int8` quantization) to extract timestamped dialogue segments.
4. **Translation**: Translates dialogue segments into Khmer (`km`) via `deep-translator`, with automatic provider failover (Google → MyMemory → Google direct endpoint). If Google rate-limits the machine (HTTP 429), MyMemory is used instead, and the log shows which provider translated each line.
5. **Voiceover Synthesis**: Synthesizes neural Khmer speech using `edge-tts`:
   - `km-KH-PisethNeural` (Male — crisp, authoritative narration)
   - `km-KH-SreymomNeural` (Female — warm, melodious storytelling)
   Segments are time-aligned and mixed into a master PCM audio track matching the original video's duration.
6. **Audio-Video Remux**: Remuxes the voiceover with original video using `ffmpeg` (`-c:v copy -c:a aac -shortest`). Also supports **Studio Ducking** (15% original background score + 100% voiceover).

---

## 🛠️ Tech Stack & Requirements

- **Runtime**: Python 3.10+
- **Desktop GUI**: `pywebview` (WKWebView on macOS, Edge WebView2 on Windows, GTK/WebKit on Linux)
- **Web/Docker mode**: `Flask` + Server-Sent Events
- **Speech Recognition**: `faster-whisper` (`ctranslate2`, `int8` CPU inference)
- **Translation**: `deep-translator`
- **Neural TTS**: `edge-tts` (Microsoft Edge Neural Voices)
- **Media Engine**: `ffmpeg` (system executable or automatic `imageio-ffmpeg` provider) & `yt-dlp`
- **Frontend**: HTML5, ES6 JavaScript, Tailwind CSS (via CDN), Lucide Icons

---

## 📦 Installation & Running

### Option A: macOS desktop

1. Install Python 3.10+ and ffmpeg:
   ```bash
   brew install ffmpeg
   ```
2. Launch the app:
   ```bash
   chmod +x run.sh run.command
   ./run.sh
   ```
   Or double-click `run.command` in Finder. The launcher creates a `.venv`, installs `requirements-desktop.txt`, and opens the native window.

Manual equivalent:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-desktop.txt
python app.py
```

> If macOS blocks the app, allow `Python`/`Terminal` under **System Settings → Privacy & Security**.

### Option B: Windows desktop

Double-click `run.bat`, or run:
```cmd
run.bat
```

### Option C: Docker (macOS, Linux, Windows with Docker Desktop)

```bash
docker compose up --build
```

Then open **http://localhost:8080** in your browser.

- Finished videos appear in `./output/` on your host (mounted into the container).
- Use **“Select local video file”** to upload a local video from your computer into the container.
- **Play Video / Show in Folder** download the finished file through the browser.
- `docker compose down` stops the container; `docker compose logs -f` shows server logs.

Without Compose:
```bash
docker build -t khmerdubstudio .
docker run --rm -p 8080:8080 -v "$(pwd)/output:/app/output" khmerdubstudio
```

### ffmpeg resolution

KhmerDubStudio automatically detects `ffmpeg`/`ffprobe` from:
1. System `PATH`
2. `imageio-ffmpeg` bundled binary (included in requirements)
3. `./bin/ffmpeg` (or `ffmpeg.exe` on Windows)
4. Standard platform locations:
   - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`
   - Linux: `/usr/bin`, `/usr/local/bin`, `/snap/bin`
   - Windows: `C:\ffmpeg\bin`, Chocolatey, WinGet

---

## 🖥️ User Interface & Controls

- **Split Dashboard Layout**:
  - **Left Panel (Control Center)**:
    - Target Video URL input with validation and clipboard paste button.
    - Local video picker (native dialog on desktop, upload in Docker/browser mode).
    - Khmer Voice cards: `Piseth Neural` (Male) vs `Sreymom Neural` (Female).
    - Faster-Whisper model selector (`base` for speed, `small` for balance, `medium` for precision).
    - Narration speed adjustments (`0.9x`, `1.0x`, `1.1x`, `1.2x`).
    - Remux Strategy: Full Voiceover Replacement vs Studio Background Ducking.
    - Primary action button ("Start Dubbing Pipeline") with dynamic loading spinner.
    - Clean "Cancel Operation" button to abort running tasks.
  - **Right Panel (Live Monitor & Diagnostic Terminal)**:
    - **Step Tracker**: 6 visual cards indicating `Pending`, `In Progress`, `Completed`, or `Error`.
    - **Dynamic Progress Bar**: Live gradient progress bar (0% to 100%).
    - **Diagnostic Console**: Color-coded live logs (`[INFO]`, `[WHISPER]`, `[TRANSLATE]`, `[SUCCESS]`, `[ERROR]`), Khmer text preview, auto-scroll lock, copy logs.
    - **Completion Banner**: Displays output path, duration, file size, with one-click Play / Show in Folder (or download in browser mode).

---

## 📁 File Structure

```
c_drama_tool/
├── app.py                   # pywebview API bridge, threading, & 6-stage pipeline
├── server.py                # Flask web/Docker mode (HTTP + SSE, upload/download)
├── requirements.txt         # Core pipeline + web dependencies (Docker)
├── requirements-desktop.txt # Core + pywebview (Windows/macOS/Linux desktop)
├── run.bat                  # One-click Windows launcher
├── run.sh                   # macOS/Linux virtualenv launcher
├── run.command              # Double-click macOS launcher
├── Dockerfile               # Headless web-server image
├── docker-compose.yml       # Ports + output/model volume mounts
├── .dockerignore
├── README.md
├── web/
│   └── index.html           # Desktop GUI / browser UI (Tailwind, Lucide, JS bridge)
└── output/                  # Created automatically (mounted in Docker)
    ├── uploads/             # Videos uploaded through the browser
    ├── stems/               # Temporary audio stems and TTS chunks (per job)
    └── *_KhmerDub_*.mp4     # Finished exported dubbed videos
```

---

## 🛡️ Concurrency & Error Handling
- **Thread Isolation**: All heavy downloads, AI inference, translation queries, and ffmpeg muxing jobs run inside a non-blocking `threading.Thread(daemon=True)`. The UI never freezes.
- **Bi-Directional Bridge (desktop)**: Python pushes updates via `window.evaluate_js()` using the structured event system (`onEngineUpdate`, `onJobComplete`, `onJobError`).
- **HTTP Bridge (Docker/browser)**: The same events stream to the browser through `/api/events` (Server-Sent Events).
- **Graceful Diagnostics**: Subprocess failures (e.g. invalid URL, corrupt audio) emit exact stderr to the console and re-enable controls.

---

## 🩺 Troubleshooting

- **Logs show Chinese/original text as "Khmer"**: Google Translate was rate-limited (HTTP 429). The app now automatically falls back to MyMemory, and labels each line with the provider (`[Google]`, `[MyMemory]`, `[Google GTX]`). If all providers fail, those segments are marked `UNTRANSLATED` and skipped in the voiceover instead of producing silent TTS failures.
- **`TTS failed ... NoAudioReceived`**: the Khmer neural voice cannot speak non-Khmer text. This now only happens if the text is genuinely not Khmer; re-run once translation succeeds.
- **Chinese transcription is inaccurate**: use the `small` model instead of `base` (better accuracy, slower).
- **Output video is silent**: it was produced by an older run where translation/TTS failed. Regenerate it after updating.
- **Google keeps returning 429**: wait a while (the limit is temporary) or use a different network; MyMemory is used in the meantime.

---

## ⚠️ Notes
- Dubbing requires outbound internet access (yt-dlp, Google Translate, Edge TTS, and Whisper model download on first run).
- In Docker, the first run downloads the Whisper model into the `khmerdub_models` volume, so later runs start faster.
- On Apple Silicon, `faster-whisper` runs on CPU with `int8`; expect slower transcription for `medium` models.
