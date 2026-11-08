# KhmerDubStudio - AI Video Dubbing Desktop Application

**KhmerDubStudio** is a desktop application for Windows built with **Python (`pywebview`)**, **Tailwind CSS**, and AI speech/audio libraries. It automatically transcribes, translates, synthesizes, and remuxes videos into Khmer neural voiceovers (`km-KH`).

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
3. **Speech-to-Text**: Runs `faster-whisper` (`base` / `small` with `int8` quantization) to extract timestamped dialogue segments (`start`, `end`, `text`).
4. **Translation**: Translates dialogue segments into Khmer (`km`) via `deep-translator` adapted for natural spoken narration.
5. **Voiceover Synthesis**: Synthesizes neural Khmer speech using `edge-tts`:
   - `km-KH-PisethNeural` (Male — crisp, authoritative narration)
   - `km-KH-SreymomNeural` (Female — warm, melodious storytelling)
   Segments are time-aligned and mixed into a master PCM audio track matching the original video's duration.
6. **Audio-Video Remux**: Remuxes the voiceover with original video using `ffmpeg` (`-c:v copy -c:a aac -shortest`). Also supports **Studio Ducking** (15% original background score + 100% voiceover).

---

## 🛠️ Tech Stack & Requirements

- **Operating System**: Windows 10 / 11 (with Microsoft Edge WebView2 runtime)
- **Runtime**: Python 3.10+
- **Desktop GUI**: `pywebview` (using Edge Chromium backend)
- **Speech Recognition**: `faster-whisper` (`ctranslate2`, `int8` CPU/GPU inference)
- **Translation**: `deep-translator`
- **Neural TTS**: `edge-tts` (Microsoft Edge Neural Voices)
- **Media Engine**: `ffmpeg` (system executable or automatic `imageio-ffmpeg` provider) & `yt-dlp`
- **Frontend**: HTML5, ES6 JavaScript, Tailwind CSS (via CDN), Lucide Icons

---

## 📦 Installation & Setup

### 1. Install Dependencies
In PowerShell or Command Prompt, run:
```bash
pip install -r requirements.txt
```

### 2. FFmpeg Executable
KhmerDubStudio automatically detects `ffmpeg` from:
1. System `PATH` (`ffmpeg.exe`)
2. `imageio-ffmpeg` bundled binary (included in `requirements.txt`)
3. `./bin/ffmpeg.exe` in the application directory
4. Standard locations (`C:\ffmpeg\bin\ffmpeg.exe`, WinGet links, Chocolatey)

---

## 🎬 Running the Application

### Option A: Using the Launcher (Recommended)
Double-click `run.bat` or run in terminal:
```cmd
run.bat
```

### Option B: Direct Python Execution
```bash
python app.py
```

---

## 🖥️ User Interface & Controls

- **Split Dashboard Layout**:
  - **Left Panel (Control Center)**:
    - Target Video URL input with validation and clipboard paste button.
    - Native file picker button for local `.mp4`, `.mkv`, `.mov` files.
    - Khmer Voice cards: `Piseth Neural` (Male) vs `Sreymom Neural` (Female).
    - Faster-Whisper model selector (`base` for speed, `small` for balance, `medium` for precision).
    - Narration speed adjustments (`0.9x`, `1.0x`, `1.1x`, `1.2x`).
    - Remux Strategy: Full Voiceover Replacement vs Studio Background Ducking.
    - Primary Action button ("Start Dubbing Pipeline") with dynamic loading spinner.
    - Clean "Cancel Operation" button to abort running tasks.
  - **Right Panel (Live Monitor & Diagnostic Terminal)**:
    - **Step Tracker**: 6 visual cards indicating `Pending`, `In Progress` (pulsing animation), `Completed` (checkmark), or `Error`.
    - **Dynamic Progress Bar**: Live gradient progress bar (0% to 100%).
    - **Diagnostic Console**: Color-coded live logs (`[INFO]`, `[WHISPER]`, `[TRANSLATE]`, `[SUCCESS]`, `[ERROR]`), Khmer text preview, auto-scroll lock, copy logs.
    - **Completion Banner**: Displays output path, duration, file size, with one-click "Play Video" and "Show in Folder" shortcuts.

---

## 📁 File Structure

```
c_drama_tool/
├── app.py              # pywebview API bridge, threading, & 6-stage pipeline
├── requirements.txt    # Pinned Python package dependencies
├── run.bat             # One-click Windows desktop launcher
├── README.md           # Documentation and architecture guide
├── web/
│   └── index.html      # Desktop GUI interface (Tailwind CSS, Lucide, JS Bridge)
└── output/             # Output folder created automatically
    ├── stems/          # Temporary audio stems and TTS chunks (cleaned per job)
    └── *_KhmerDub_*.mp4 # Finished exported dubbed videos
```

---

## 🛡️ Concurrency & Error Handling
- **Thread Isolation**: All heavy downloads, AI inferences, translation queries, and ffmpeg muxing jobs run inside a non-blocking `threading.Thread(daemon=True)`. The GUI never freezes.
- **Bi-Directional Bridge**: Python pushes updates via `window.evaluate_js()` using the structured event system (`onEngineUpdate`, `onJobComplete`, `onJobError`).
- **Graceful Diagnostics**: Subprocess failures (e.g. invalid URL, corrupt audio) emit exact stderr to the console and re-enable controls.
