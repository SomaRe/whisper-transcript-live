const audioSelect = document.getElementById('audioSelect');
const processButton = document.getElementById('processButton');
const audioPlayer = document.getElementById('audioPlayer');
const transcriptDiv = document.getElementById('transcript');

let transcriptData = [];

// Basic time update handler
audioPlayer.addEventListener('timeupdate', () => {
  const currentTime = audioPlayer.currentTime;
  
  transcriptData.forEach(chunk => {
    const element = document.querySelector(`[data-start="${chunk.timestamp[0]}"]`);
    if (element) {
      element.classList.toggle('highlight', 
        currentTime >= chunk.timestamp[0] && 
        currentTime <= chunk.timestamp[1]
      );
    }
  });
});

// Simple transcript loader
function loadTranscript() {
  transcriptDiv.innerHTML = transcriptData.map(chunk => `
    <div class="transcript-chunk" 
         data-start="${chunk.timestamp[0]}"
         onclick="audioPlayer.currentTime = ${chunk.timestamp[0]}; audioPlayer.play()">
      ${chunk.text}
    </div>
  `).join('');
}

// Basic file loader
audioSelect.addEventListener('change', async () => {
  const file = audioSelect.value;
  if (!file) return;

  // Load audio
  audioPlayer.src = `/audio/${file}`;

  // Load transcript
  try {
    const response = await fetch(`/api/transcripts?audio_file=${file}`);
    transcriptData = (await response.json()).chunks;
    loadTranscript();
  } catch {
    transcriptDiv.innerHTML = 'No transcript available';
  }
});

// Initial load
(async () => {
  const files = await fetch('/api/audio_files').then(r => r.json());
  files.forEach(file => {
    audioSelect.innerHTML += `<option value="${file}">${file}</option>`;
  });
})();