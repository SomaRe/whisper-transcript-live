const audioFileInput = document.getElementById('audioFile');
const jsonFileInput = document.getElementById('jsonFile');
const audioPlayer = document.getElementById('audioPlayer');
const transcriptDiv = document.getElementById('transcript');

let transcriptData = [];

// Load transcript into the DOM
function loadTranscript() {
  transcriptDiv.innerHTML = '';
  transcriptData.forEach(chunk => {
    if (chunk.text.trim() !== '') {
      const p = document.createElement('p');
      p.textContent = chunk.text;
      p.dataset.start = chunk.timestamp[0];
      p.dataset.end = chunk.timestamp[1];
      p.addEventListener('click', () => {
        audioPlayer.currentTime = chunk.timestamp[0];
        audioPlayer.play();
      });
      transcriptDiv.appendChild(p);
    }
  });
}

// Highlight transcript as audio plays
audioPlayer.addEventListener('timeupdate', () => {
  const currentTime = audioPlayer.currentTime;
  const paragraphs = transcriptDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    const start = parseFloat(p.dataset.start);
    const end = parseFloat(p.dataset.end);
    if (currentTime >= start && currentTime <= end) {
        console.log(start, end);
      p.classList.add('highlight');
      p.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      p.classList.remove('highlight');
    }
  });
});

// Load audio file
audioFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
  }
});

// Load JSON file
jsonFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        transcriptData = JSON.parse(event.target.result).chunks;
        loadTranscript();
      } catch (error) {
        alert('Invalid JSON file. Please upload a valid transcript JSON.');
      }
    };
    reader.readAsText(file);
  }
});