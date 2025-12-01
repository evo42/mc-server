# Minecraft Overviewer Docker Container - Production Ready
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Security: Create non-root user for running the application
RUN groupadd -r overviewer && useradd -r -g overviewer overviewer

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
    python3-dev \
    # Clean up package cache to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy Overviewer source code
COPY Minecraft-Overviewer/ /app/

# Security: Install fixed dependency versions with security patches
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    "Pillow>=9.5.0,<10.0.0" \
    "numpy>=1.24.0,<2.0.0" \
    "requests>=2.31.0,<3.0.0" && \
    # Clean pip cache
    pip cache purge

# Install Overviewer and its dependencies
RUN python setup.py build_ext --inplace && \
    python setup.py install && \
    # Clean up build artifacts
    rm -rf build/ *.egg-info/ __pycache__/ .git/

# Create necessary directories with proper ownership
RUN mkdir -p /data/worlds /data/output /data/renders && \
    chown -R overviewer:overviewer /data /app

# Set environment variables
ENV PYTHONPATH=/app:$PYTHONPATH
ENV OVERVIEWER_DATA_DIR=/data
ENV OVERVIEWER_OUTPUT_DIR=/data/output

# Switch to non-root user for security
USER overviewer

# Expose port for web server (if needed)
EXPOSE 8080

# Health check - enhanced with timeout and better error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import overviewer_core; print('OK')" || exit 1

# Default command
CMD ["python", "-c", "import overviewer_core; print('Minecraft Overviewer ready')"]

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
