FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/python

COPY requirements.txt /tmp/requirements.txt
COPY constraints-docker.txt /tmp/constraints-docker.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install \
        --extra-index-url https://download.pytorch.org/whl/cpu \
        -c /tmp/constraints-docker.txt \
        -r /tmp/requirements.txt

COPY . /workspace/python

CMD ["python", "-m", "bgm.analyze", "--help"]
