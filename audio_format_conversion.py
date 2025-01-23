import os
import subprocess
from pathlib import Path

def convert_m4a_to_mp3(input_folder):
    # Create input folder Path object
    folder = Path(input_folder)
    
    # Find all .m4a files
    m4a_files = list(folder.glob('*.m4a'))
    
    for m4a_file in m4a_files:
        # Create output filename
        mp3_file = m4a_file.with_suffix('.mp3')
        
        try:
            # Run ffmpeg command
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
        except Exception as e:
            print(f"Unexpected error with {m4a_file.name}: {e}")

if __name__ == "__main__":
    convert_m4a_to_mp3("audio")