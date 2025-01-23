import whisper

model = whisper.load_model("turbo")
result = model.transcribe("audio/Skip the dishes.mp3")
print(result)