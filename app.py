from flask import Flask, render_template, jsonify, request, send_from_directory
import os
from pathlib import Path
import subprocess

app = Flask(__name__)

# Root path to serve the UI
@app.route('/')
def index():
    return render_template('index.html')

# API to list audio files
@app.route('/api/audio_files', methods=['GET'])
def list_audio_files():
    audio_folder = Path("audio")
    audio_files = [f.name for f in audio_folder.glob("*.mp3")]
    return jsonify(audio_files)

# API to process audio and generate transcript
@app.route('/api/process_audio', methods=['POST'])
def process_audio():
    audio_file = request.json.get('audio_file')
    if not audio_file:
        return jsonify({"error": "No audio file provided"}), 400

    audio_path = Path("audio") / audio_file
    json_path = audio_path.with_suffix('.json')

    # If JSON transcript already exists, return success
    if json_path.exists():
        return jsonify({"message": "Transcript already exists"}), 200

    # Run the audio-to-text processing script
    try:
        subprocess.run(["python", "transfromers_whisper(temp_fix).py", str(audio_path)], check=True)
        return jsonify({"message": "Transcript generated successfully"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Failed to generate transcript: {e}"}), 500

# Serve static files (audio files)
@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory('audio', filename)

if __name__ == '__main__':
    app.run(debug=True)