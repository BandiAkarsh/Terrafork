# Python 3.11 slim image (Green Code: smaller than full image)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for lxml (Green Code: faster parser)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libxml2-dev \
    libxslt1-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Green Code: Run with minimal workers for local dev
# In production, Cloudflare Workers handles scaling automatically
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--loop", "uvloop"]
