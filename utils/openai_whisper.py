from datetime import datetime
from pathlib import Path
import whisper
import json

def process_audio(audio_path):
    model = whisper.load_model("turbo")
    result = model.transcribe(str(audio_path))

    # Create output directory if needed
    output_dir = Path("transcripts")
    output_dir.mkdir(exist_ok=True)

    timestamp = int(datetime.now().timestamp())
    output_path = output_dir / f"{audio_path.stem}_{timestamp}.json"

    with open(output_path, "w") as f:
        json.dump(result, f)

    print(f"Transcript saved to: {output_path}")


if __name__ == "__main__":
    import sys
    process_audio(Path(sys.argv[1]))