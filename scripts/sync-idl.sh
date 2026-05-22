#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Paths
PROGRAM_DIR="$REPO_ROOT/terraledger-programs"
SOURCE_IDL="$PROGRAM_DIR/target/idl/terraledger.json"

echo "--- IDL Sync (Bash) ---"

# 1. Check if source IDL exists, if not build it
if [ ! -f "$SOURCE_IDL" ]; then
    echo "Source IDL not found. Running anchor build..."
    (cd "$PROGRAM_DIR" && anchor build) || { echo "Error: anchor build failed"; exit 1; }
fi

if [ ! -f "$SOURCE_IDL" ]; then
    echo "Error: Source IDL still not found at $SOURCE_IDL"
    exit 1
fi

# 2. Run the Node.js sync script to do the heavy lifting (copying and generating TS)
# This avoids duplicating logic and ensures consistency
node "$SCRIPT_DIR/sync-idl.js"
