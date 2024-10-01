#!/bin/sh

npx tsc --project tsconfig.scripts.json

find dist/scripts -name "*.js" -exec bash -c 'mv "$0" "${0%.js}.mjs"' {} \;

for file in dist/scripts/scripts/content.mjs dist/scripts/lib/pageroutes.mjs; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    sed -i 's|import { Documents } from '\''@/settings/documents'\''|import { Documents } from '\''../settings/documents.mjs'\''|g' "$file"

    if [ $? -ne 0 ]; then
      echo "Error: Failed to update $file"
      exit 1
    fi
    
    echo "$file updated successfully."
  else
    echo "$file not found!"
  fi
done

node dist/scripts/scripts/content.mjs || exit 1
