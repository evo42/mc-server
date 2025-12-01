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
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Overviewer source code
COPY Minecraft-Overviewer/ /app/

# Install Pillow from source to ensure headers are available
RUN pip install --no-cache-dir --no-binary Pillow "Pillow==8.4.0"

# Install other Python dependencies
RUN pip install --no-cache-dir numpy==1.21.6 requests>=2.20.0

# Since direct installation of Pillow doesn't provide the needed headers,
# we need to build it in a way that makes the headers available.
# First download the Pillow source to access the header files
RUN pip download --no-binary Pillow "Pillow==8.4.0" --dest /tmp/ && \
    cd /tmp && \
    tar -xzf Pillow-8.4.0.tar.gz

# Make the Imaging.h header available in the main include path
RUN cp /tmp/Pillow-8.4.0/src/libImaging/Imaging.h /usr/include/Imaging.h && \
    cp -r /tmp/Pillow-8.4.0/src/libImaging /usr/include/libImaging && \
    # Also copy the entire libImaging directory to the local app directory for the build process
    cp -r /tmp/Pillow-8.4.0/src/libImaging ./libImaging && \
    # Symlink the main header to current directory
    ln -s ./libImaging/Imaging.h ./Imaging.h

# Add the libImaging directory to the compiler's include path
ENV C_INCLUDE_PATH=/app/libImaging:$C_INCLUDE_PATH
ENV CPLUS_INCLUDE_PATH=/app/libImaging:$CPLUS_INCLUDE_PATH

# Generate the required header files first, then build
RUN python setup.py build
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
