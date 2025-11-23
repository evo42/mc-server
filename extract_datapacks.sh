#!/bin/bash
cd /tmp
mkdir -p vanillatweaks_individual

# Loop through each zip file (excluding the main archive)
for file in *.zip; do
  if [ "$file" != "VanillaTweaks_datapack.zip" ]; then
    echo "Extracting $file..."
    # Remove the .zip extension to create directory name
    dir_name=$(echo "$file" | sed 's/\.zip$//')
    mkdir -p "vanillatweaks_individual/$dir_name"
    unzip -q "$file" -d "vanillatweaks_individual/$dir_name"
  fi
done