# Minecraft Overviewer Docker Container
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies for C extensions and image processing
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libc6-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    pkg-config \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Overviewer source code
COPY /Users/rene/ikaria/Minecraft-Overviewer/ /app/

# Install Python dependencies
RUN pip install --no-cache-dir \
    numpy>=1.15.0 \
    Pillow>=6.0.0 \
    requests>=2.20.0

# Build Overviewer with C extensions
RUN python setup.py build_ext --inplace
RUN python setup.py install

# Create directories for output and world data
RUN mkdir -p /data/worlds /data/output /data/renders

# Set environment variables
ENV PYTHONPATH=/app:$PYTHONPATH
ENV OVERVIEWER_DATA_DIR=/data
ENV OVERVIEWER_OUTPUT_DIR=/data/output

# Expose port for web server (if needed)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import overviewer_core; print('OK')" || exit 1

# Default command
CMD ["python", "-c", "import overviewer_core; print('Minecraft Overviewer ready')"]
