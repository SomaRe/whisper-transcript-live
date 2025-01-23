import torch
import numpy as np
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor
import time
import json
import librosa
import os

device = "cuda:0" if torch.cuda.is_available() else "cpu"
print(device, torch.version.cuda)
torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
print(torch_dtype)

model_id = "openai/whisper-large-v3-turbo"
model = AutoModelForSpeechSeq2Seq.from_pretrained(
    model_id, 
    torch_dtype=torch_dtype,
    use_safetensors=True
)
model.to(device)
processor = AutoProcessor.from_pretrained(model_id)

def process_audio(audio_path, chunk_length_s=30):
    # Load audio file
    audio_array, sampling_rate = librosa.load(audio_path, sr=16000)
    
    # Calculate chunk size in samples
    chunk_length_samples = int(chunk_length_s * sampling_rate)
    
    results = []
    offset = 0
    
    # Process audio in chunks
    while offset < len(audio_array):
        # Extract chunk
        chunk = audio_array[offset:offset + chunk_length_samples]
        
        # Process chunk
        inputs = processor(
            chunk, 
            return_tensors="pt", 
            sampling_rate=sampling_rate
        )
        inputs = inputs.to(device, torch_dtype)
        
        # Generate with timestamps and segments
        output = model.generate(
            **inputs,
            return_timestamps=True,
            return_segments=True
        )
        
        # Decode and process results
        chunk_result = processor.batch_decode(
            output['sequences'], 
            skip_special_tokens=True, 
            output_offsets=True
        )[0]
        
        # Add correct timestamps from segments, adjusting for chunk offset
        time_offset = offset / sampling_rate
        for i in range(len(chunk_result['offsets'])):
            start_time = output['segments'][0][i]['start'].item() + time_offset
            end_time = output['segments'][0][i]['end'].item() + time_offset
            chunk_result['offsets'][i]['timestamp'] = (start_time, end_time)
        
        results.append(chunk_result)
        offset += chunk_length_samples
    
    # Combine results from all chunks
    combined_result = {
        'text': ' '.join(r['text'] for r in results),
        'chunks': []
    }
    
    for r in results:
        combined_result['chunks'].extend(r['offsets'])
    
    return combined_result

# Process the audio file
folder = "audio"
files = ["Skip the dishes.mp3", "skip the dish.mp3", "skip the dish2.mp3"]
for file in files:
    start = time.time()
    result = process_audio(os.path.join(folder, file), chunk_length_s=30)
    end = time.time()

    print(f"Time taken: ", end-start, "seconds")

    # Save to file
    with open("transcripts/"+file.split(".")[0]+f"_result_{str(time.time())}.json", 'w') as f:
        json.dump(result, f, indent=4)

# Clear CUDA cache
torch.cuda.empty_cache()