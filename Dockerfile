# KhmerDubStudio - headless web server image (browser-driven pipeline)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HUB_DISABLE_SYMLINKS_WARNING=1 \
    KHMERDUB_HOST=0.0.0.0 \
    KHMERDUB_PORT=8080

# ffmpeg for media processing, libgomp1 for ctranslate2 (faster-whisper)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY app.py server.py ./
COPY web ./web

RUN mkdir -p /app/output/stems /app/output/uploads

EXPOSE 8080
VOLUME ["/app/output"]

# ffmpeg is on PATH inside the image; whisper models download to the HF cache
CMD ["python", "server.py"]
