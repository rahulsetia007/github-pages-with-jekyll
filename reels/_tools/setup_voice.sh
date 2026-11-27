#!/usr/bin/env bash
# Installs the house voice (Kokoro TTS, am_michael) into $VOICE_DIR (default: ~/.cache/kokoro).
set -e
VOICE_DIR="${VOICE_DIR:-$HOME/.cache/kokoro}"; mkdir -p "$VOICE_DIR"
pip install -q kokoro-onnx soundfile librosa scipy
R=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s "$VOICE_DIR/voices-v1.0.bin" ] || curl -sSL -o "$VOICE_DIR/voices-v1.0.bin" $R/voices-v1.0.bin
[ -s "$VOICE_DIR/kokoro-v1.0.onnx" ] || curl -sSL -o "$VOICE_DIR/kokoro-v1.0.onnx" $R/kokoro-v1.0.onnx
echo "voice ready in $VOICE_DIR"
