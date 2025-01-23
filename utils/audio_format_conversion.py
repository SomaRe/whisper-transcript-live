import os
import subprocess
from pathlib import Path

def convert_m4a_to_mp3(input_folder):
    folder = Path(input_folder)
    m4a_files = list(folder.glob('*.m4a'))
    
    for m4a_file in m4a_files:
        mp3_file = m4a_file.with_suffix('.mp3')
        if mp3_file.exists():
            continue  # Skip conversion if MP3 already exists
        
        try:
            subprocess.run([
                'ffmpeg',
                '-i', str(m4a_file),
                '-codec:a', 'libmp3lame',
                '-qscale:a', '2',
                str(mp3_file)
            ], check=True)
            print(f"Converted: {m4a_file.name} -> {mp3_file.name}")
        except subprocess.CalledProcessError as e:
            print(f"Error converting {m4a_file.name}: {e}")

if __name__ == "__main__":
    convert_m4a_to_mp3("audio")