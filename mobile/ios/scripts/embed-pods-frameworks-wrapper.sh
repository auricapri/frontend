#!/bin/bash
# Wrapper script for CocoaPods Embed Frameworks script
# This wrapper handles code signing errors gracefully, especially for Debug builds
# Created to fix "Command PhaseScriptExecution failed with a nonzero exit code" errors

# Get the original script path
ORIGINAL_SCRIPT="${PODS_ROOT}/Target Support Files/Pods-Auricapri/Pods-Auricapri-frameworks.sh"

# Check if original script exists
if [ ! -f "$ORIGINAL_SCRIPT" ]; then
  echo "error: Original CocoaPods script not found at $ORIGINAL_SCRIPT" >&2
  exit 1
fi

# For Debug builds, we'll allow code signing failures to be warnings
if [[ "$CONFIGURATION" == *Debug* ]]; then
  # Execute the original script and capture both stdout and stderr
  # We use a temporary file to capture output since some commands may output to stderr
  TEMP_OUTPUT=$(mktemp)
  "$ORIGINAL_SCRIPT" > "$TEMP_OUTPUT" 2>&1
  EXIT_CODE=$?
  
  # Read the output
  OUTPUT=$(cat "$TEMP_OUTPUT")
  rm -f "$TEMP_OUTPUT"
  
  # Check if the error is related to code signing
  if [ $EXIT_CODE -ne 0 ]; then
    # Check for code signing specific errors
    if echo "$OUTPUT" | grep -qE "errSecInternalComponent|unable to build chain|Code Signing.*failed|codesign.*failed"; then
      # Filter out the error messages but keep the rest of the output
      echo "$OUTPUT" | grep -vE "errSecInternalComponent|unable to build chain" || true
      echo "warning: Code signing failed for embedded frameworks in Debug build, continuing..." >&2
      # In Debug, we can continue even if code signing fails
      # The frameworks will still be embedded, just not signed
      exit 0
    else
      # For other errors, propagate them
      echo "$OUTPUT" >&2
      exit $EXIT_CODE
    fi
  else
    # Success case - output normally
    echo "$OUTPUT"
    exit 0
  fi
else
  # For Release builds, code signing is mandatory - execute normally with error propagation
  exec "$ORIGINAL_SCRIPT"
fi

