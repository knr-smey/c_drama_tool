#!/usr/bin/env python3
"""
KhmerDubStudio - Headless web server mode.

Serves the same dashboard UI over HTTP so the dubbing pipeline can run inside a
Docker container (or any headless machine) and be driven from a normal browser.
Progress events are streamed to the browser with Server-Sent Events (SSE).
"""

import json
import os
import queue
import time
import urllib.parse

from flask import Flask, Response, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from app import OUTPUT_DIR, WEB_DIR, DubbingAPI

HOST = os.environ.get("KHMERDUB_HOST", "0.0.0.0")
PORT = int(os.environ.get("KHMERDUB_PORT", "8080"))

UPLOAD_DIR = os.path.join(OUTPUT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024 * 1024  # 4 GB uploads

api = DubbingAPI()
_event_queue: "queue.Queue" = queue.Queue()


def _event_sink(event_name: str, data: dict):
    """Forward pipeline events to connected browsers, adding download links."""
    payload = data
    if event_name == "onJobComplete":
        output_path = data.get("output_path")
        if output_path and os.path.isfile(output_path):
            if os.path.dirname(os.path.abspath(output_path)) == os.path.abspath(OUTPUT_DIR):
                payload = dict(data)
                payload["download_url"] = "/api/download/" + urllib.parse.quote(
                    os.path.basename(output_path)
                )
    _event_queue.put((event_name, payload))


api._set_event_sink(_event_sink)


@app.get("/")
def index():
    return send_from_directory(WEB_DIR, "index.html")


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "mode": "web",
            "output_dir": OUTPUT_DIR,
            "ffmpeg": api._ffmpeg_path,
        }
    )


@app.post("/api/start_pipeline")
def start_pipeline():
    options = request.get_json(silent=True) or {}
    return jsonify(api.start_pipeline(options))


@app.post("/api/cancel_pipeline")
def cancel_pipeline():
    return jsonify(api.cancel_pipeline())


@app.post("/api/open_output_folder")
def open_output_folder():
    return jsonify(
        {
            "success": True,
            "web": True,
            "path": OUTPUT_DIR,
            "message": "Output is stored in the container at /app/output "
            "(mounted to ./output on your host).",
        }
    )


@app.post("/api/open_video")
def open_video():
    data = request.get_json(silent=True) or {}
    path = data.get("file_path") or data.get("path") or ""
    if path and os.path.isfile(path):
        return jsonify(
            {
                "success": True,
                "web": True,
                "download_url": "/api/download/"
                + urllib.parse.quote(os.path.basename(path)),
            }
        )
    return jsonify({"error": "File does not exist"}), 404


@app.post("/api/reveal_in_folder")
def reveal_in_folder():
    return open_output_folder()


@app.post("/api/upload")
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400
    upload_file = request.files["file"]
    if not upload_file.filename:
        return jsonify({"error": "Empty filename"}), 400

    safe_name = secure_filename(upload_file.filename) or "upload.mp4"
    dest = os.path.join(UPLOAD_DIR, f"{int(time.time())}_{safe_name}")
    upload_file.save(dest)
    return jsonify({"path": os.path.abspath(dest), "filename": safe_name})


@app.get("/api/download/<path:filename>")
def download(filename):
    return send_from_directory(OUTPUT_DIR, filename, as_attachment=True)


@app.get("/api/events")
def events():
    def stream():
        while True:
            try:
                event_name, data = _event_queue.get(timeout=20)
            except queue.Empty:
                yield ": keep-alive\n\n"
                continue
            yield f"event: {event_name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    return Response(
        stream(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


def run_server():
    print(f"KhmerDubStudio web mode running at http://{HOST}:{PORT}")
    print(f"Output directory: {OUTPUT_DIR}")
    app.run(host=HOST, port=PORT, threaded=True, debug=False)


if __name__ == "__main__":
    run_server()
