const audioSelect = document.getElementById('audioSelect');
const refreshButton = document.getElementById('refreshButton');
const processButton = document.getElementById('processButton');
const statusMessage = document.getElementById('statusMessage');

const audioPlayer = document.getElementById('audioPlayer');
const transcriptDiv = document.getElementById('transcript');
let transcriptData = [];

audioPlayer.addEventListener('timeupdate', () => {
  const currentTime = audioPlayer.currentTime;
  // Find the current transcript chunk
  const activeChunk = transcriptData.find(chunk => 
    currentTime >= chunk.timestamp[0] && currentTime < chunk.timestamp[1]
  );
  
  // Highlight active chunk
  document.querySelectorAll('.transcript-chunk').forEach(el => {
    el.classList.toggle('highlight', el.dataset.start <= currentTime && el.dataset.end > currentTime);
  });
});

// Implement loadTranscript function
function loadTranscript() {
  transcriptDiv.innerHTML = transcriptData.map(chunk => `
    <div class="transcript-chunk mb-2" data-start="${chunk.timestamp[0]}" data-end="${chunk.timestamp[1]}">
      ${chunk.text}
    </div>
  `).join('');
}

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
    const jsonFile = selectedFile.replace('.mp3', '') + '_*.json';
    fetch(`/api/transcripts?audio_file=${selectedFile}`)
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        transcriptData = data.chunks;
        loadTranscript();
      })
      .catch(() => {
        transcriptData = [];
        transcriptDiv.innerHTML = '<p class="text-muted">No transcript available. Generate one using the button above.</p>';
      });
  }
});

// Process audio to generate transcript
processButton.addEventListener('click', () => {
  const selectedFile = audioSelect.value;
  if (!selectedFile) {
    statusMessage.textContent = 'Please select an audio file first.';
    statusMessage.style.display = 'block';
    return;
  }

  statusMessage.textContent = 'Processing... This may take a few minutes.';
  statusMessage.style.display = 'block';

  fetch('/api/process_audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_file: selectedFile })
  })
    .then(response => response.json())
    then(data => {
      statusMessage.textContent = data.message || data.error;
      statusMessage.classList.toggle('alert-danger', !!data.error);
      if (!data.error) {
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