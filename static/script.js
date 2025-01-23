const audioSelect = document.getElementById('audioSelect');
const refreshButton = document.getElementById('refreshButton');
const processButton = document.getElementById('processButton');
const statusMessage = document.getElementById('statusMessage');

// Load audio files from the backend
function loadAudioFiles() {
  fetch('/api/audio_files')
    .then(response => response.json())
    .then(files => {
      audioSelect.innerHTML = '<option value="">-- Select an audio file --</option>';
      files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        audioSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading audio files:', error);
    });
}

// Refresh audio file list
refreshButton.addEventListener('click', () => {
  loadAudioFiles();
});

// Handle audio file selection
audioSelect.addEventListener('change', (e) => {
  const selectedFile = e.target.value;
  if (selectedFile) {
    const audioUrl = `/audio/${selectedFile}`;
    audioPlayer.src = audioUrl;

    // Load corresponding JSON transcript if it exists
    const jsonFile = selectedFile.replace('.mp3', '.json');
    fetch(`/audio/${jsonFile}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Transcript not found');
        }
      })
      .then(data => {
        transcriptData = data.chunks;
        loadTranscript();
      })
      .catch(() => {
        transcriptData = [];
        transcriptDiv.innerHTML = '<p>No transcript available. Generate one below.</p>';
      });
  }
});

// Process audio to generate transcript
processButton.addEventListener('click', () => {
  const selectedFile = audioSelect.value;
  if (!selectedFile) {
    alert('Please select an audio file first.');
    return;
  }

  fetch('/api/process_audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_file: selectedFile })
  })
    .then(response => response.json())
    .then(data => {
      statusMessage.textContent = data.message || data.error;
      if (!data.error) {
        // Refresh the transcript after processing
        audioSelect.dispatchEvent(new Event('change'));
      }
    })
    .catch(error => {
      statusMessage.textContent = 'Failed to process audio.';
      console.error('Error:', error);
    });
});

// Initial load of audio files
loadAudioFiles();