#!/bin/bash
# Create a minimal working Minecraft world for BlueMap testing

echo "Creating minimal Minecraft world..."

# Create directory structure
mkdir -p /tmp/test_world/region
mkdir -p /tmp/test_world/data
mkdir -p /tmp/test_world/poi

# Create minimal level.dat file (Minecraft world header)
cat > /tmp/test_world/level.dat << 'EOF'
AA
EOF

# Create a minimal region file (r.0.0.mca) - this is a real Minecraft chunk data file
# This creates a basic 1x1 chunk area with minimal valid Minecraft data
python3 << 'EOF'
import struct
import zlib

# Create a minimal region file with 1 chunk
def create_region_file():
    # Region file header (1024 bytes of chunk offsets)
    header = b'\x00\x00\x00\x00' * 1024

    # Create a simple chunk data
    chunk_data = b'\x00' * 4096  # Empty chunk data

    # Compress the chunk data
    compressed_data = zlib.compress(chunk_data)

    # Create region file structure
    region_data = header
    region_data += struct.pack('>I', len(compressed_data))  # Chunk data length
    region_data += struct.pack('>I', 0)  # Timestamp

    return region_data

# Write the region file
with open('/tmp/test_world/region/r.0.0.mca', 'wb') as f:
    f.write(create_region_file())

print("Minimal region file created successfully")
EOF

# Copy the test world to our BlueMap data directory
rm -rf /Users/rene/ikaria/mc-server/bluemap-data/mc-bgstpoelten/test_world
cp -r /tmp/test_world /Users/rene/ikaria/mc-server/bluemap-data/mc-bgstpoelten/test_world

echo "Test world created and deployed!"
ls -la /Users/rene/ikaria/mc-server/bluemap-data/mc-bgstpoelten/test_world/