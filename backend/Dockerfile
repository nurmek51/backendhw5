FROM python:3.12-slim

WORKDIR /app

# Set noninteractive frontend for apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Ensure apt cache is updated and install system dependencies (jq, netcat, curl)
RUN apt-get update
RUN apt-get install -y --no-install-recommends jq netcat-openbsd curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app/src

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]