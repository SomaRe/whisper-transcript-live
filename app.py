from flask import Flask, render_template, jsonify, request, send_from_directory
import os
from pathlib import Path
import subprocess
from utils.audio_format_conversion import convert_m4a_to_mp3
from datetime import datetime
import json

app = Flask(__name__)

# Root path to serve the UI
@app.route('/')
def index():
    return render_template('index.html')

# API to list audio files
@app.route('/api/audio_files', methods=['GET'])
def list_audio_files():
    # Convert any m4a files first
    # convert_m4a_to_mp3("audio")
    
    audio_folder = Path("audio")
    audio_files = [f.name for f in audio_folder.glob("*")]  # Changed to .m4a
    return jsonify(audio_files)

# Process audio using the external script TODO: Doesnt work as expected, needs fixing, better UI
@app.route('/api/process_audio', methods=['POST'])
def process_audio():
    audio_file = request.json.get('audio_file')
    if not audio_file:
        return jsonify({"error": "No audio file provided"}), 400

    audio_path = Path("audio") / audio_file
    timestamp = int(datetime.now().timestamp())
    json_filename = f"{audio_path.stem}_{timestamp}.json"
    json_path = Path("transcripts") / json_filename

    if json_path.exists():
        return jsonify({"message": "Transcript already exists"}), 200

    venv_python = Path(os.getcwd() +  "/.venv/Scripts/python.exe")

    try:
        subprocess.run([venv_python, "utils/openai_whisper.py", str(audio_path)], check=True)
        return jsonify({"message": "Transcript generated successfully"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Failed to generate transcript: {e}"}), 500

# Serve static files (audio files)
@app.route('/audio/<filename>')
def serve_audio(filename):
    return send_from_directory('audio', filename)

# Fetch transcripts
@app.route('/api/transcripts', methods=['GET'])
def get_transcript():
    audio_file = request.args.get('audio_file')
    if not audio_file:
        return jsonify({"error": "No audio file provided"}), 400

    transcript_folder = Path("transcripts")
    transcript_files = list(transcript_folder.glob(f"{audio_file.replace('.'+audio_file.split('.')[-1], '')}_result_*.json"))  # Changed to .m4a
    
    if not transcript_files:
        return jsonify({"error": "Transcript not found"}), 404

    # Return the most recent transcript
    latest_transcript = max(transcript_files, key=os.path.getctime)
    with open(latest_transcript, 'r') as f:
        transcript_data = json.load(f)
    
    return jsonify(transcript_data)

if __name__ == '__main__':
    app.run(debug=True)