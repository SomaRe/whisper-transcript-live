const audioSelect = document.getElementById('audioSelect');
const processButton = document.getElementById('processButton');
const refreshButton = document.getElementById('refreshButton');
const audioPlayer = document.getElementById('audioPlayer');
const transcriptDiv = document.getElementById('transcript');
const statusMessage = document.getElementById('statusMessage');

let transcriptData = [];
let type = 'chunks';

// Function to scroll the highlighted chunk to the center
function scrollToHighlightedChunk() {
  const highlightedChunk = document.querySelector('.highlight');
  if (highlightedChunk) {
    const transcriptContainer = document.getElementById('transcript');
    const chunkRect = highlightedChunk.getBoundingClientRect();
    const containerRect = transcriptContainer.getBoundingClientRect();

    const scrollPosition = chunkRect.top + transcriptContainer.scrollTop - containerRect.top - (containerRect.height / 2) + (chunkRect.height / 2);

    transcriptContainer.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }
}

// Time update handler with auto-centering
audioPlayer.addEventListener('timeupdate', () => {
  const currentTime = audioPlayer.currentTime;
 
  if(type === 'chunks') {
    transcriptData.forEach(chunk => {
      const element = document.querySelector(`[data-start="${chunk.timestamp[0]}"]`);
      if (element) {
        const isHighlighted = currentTime >= chunk.timestamp[0] && currentTime <= chunk.timestamp[1];
        element.classList.toggle('highlight', isHighlighted);

        // Scroll to center if newly highlighted
        if (isHighlighted) {
          scrollToHighlightedChunk();
        }
      }
    });
  } else if(type === 'segments') {
    transcriptData.forEach(segment => {
      const element = document.querySelector(`[data-start="${segment.start}"]`);
      if (element) {
        const isHighlighted = currentTime >= segment.start && currentTime <= segment.end;
        element.classList.toggle('highlight', isHighlighted);

        // Scroll to center if newly highlighted
        if (isHighlighted) {
          scrollToHighlightedChunk();
        }
      }
    });
  }
});

// Simple transcript loader
function loadTranscript() {
  if (type === 'chunks') {
  transcriptDiv.innerHTML = transcriptData.map(chunk => `
    <div class="transcript-chunk" 
         data-start="${chunk.timestamp[0]}"
         onclick="audioPlayer.currentTime = ${chunk.timestamp[0]}; audioPlayer.play()">
      ${chunk.text}
    </div>
  `).join('');
  }
  else if (type === 'segments') {
    transcriptDiv.innerHTML = transcriptData.map(segment => `
    <div class="transcript-chunk" 
         data-start="${segment.start}"
         onclick="audioPlayer.currentTime = ${segment.start}; audioPlayer.play()">
      ${segment.text}
    </div>
  `).join('');
  }
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
    if (!response.ok) {
      throw new Error('Transcript not found');
    }
    const data = await response.json();

    // Check if the response contains chunks or segments
    if (data.chunks && data.chunks.length > 0) {
      transcriptData = data.chunks; // Assign chunks array
      type = 'chunks';
    } else if (data.segments && data.segments.length > 0) {
      transcriptData = data.segments; // Assign segments array
      type = 'segments';
    } else {
      transcriptData = []; // Fallback to empty array if no valid data
    }

    loadTranscript();
  } catch (error) {
    transcriptDiv.innerHTML = 'No transcript available';
    transcriptData = []; // Ensure transcriptData is an array even if there's an error
  }
});

// Function to fetch audio files
async function fetchAudioFiles() {
  const files = await fetch('/api/audio_files').then(r => r.json());
  audioSelect.innerHTML = '<option value="">-- Select an audio file --</option>';
  files.forEach(file => {
    audioSelect.innerHTML += `<option value="${file}">${file}</option>`;
  });
}

// Process audio file to generate transcript
processButton.addEventListener('click', async () => {
  const file = audioSelect.value;
  if (!file) {
    statusMessage.textContent = 'Please select an audio file.';
    statusMessage.style.display = 'block';
    return;
  }

  statusMessage.textContent = 'Generating transcript... Please wait.';
  statusMessage.style.display = 'block';

  try {
    const response = await fetch('/api/process_audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ audio_file: file })
    });

    if (!response.ok) {
      throw new Error('Failed to generate transcript');
    }

    statusMessage.textContent = 'Transcript generated successfully!';
    setTimeout(() => statusMessage.style.display = 'none', 3000);

    // Reload the transcript
    const transcriptResponse = await fetch(`/api/transcripts?audio_file=${file}`);
    transcriptData = (await transcriptResponse.json()).chunks;
    loadTranscript();
  } catch (error) {
    statusMessage.textContent = 'Error generating transcript.';
  }
});

// Refresh audio file list
refreshButton.addEventListener('click', async () => {
  await fetchAudioFiles();
  statusMessage.textContent = 'Audio file list refreshed.';
  statusMessage.style.display = 'block';
  setTimeout(() => statusMessage.style.display = 'none', 3000);
});

// Initial load
(async () => {
  await fetchAudioFiles();
})();