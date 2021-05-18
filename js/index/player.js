const audioPlayerContainer = document.getElementById('player-container');
const currentTimeContainer = document.getElementById('current-time');
const queueContainer = document.getElementById('queue-container');
const durationContainer = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const seekSlider = document.getElementById('seek-slider');
const audio = document.querySelector('audio');

let queue = []
let history = []

let buttons = {
    play: document.getElementById('play-button'),
    backward: document.getElementById('backward-button'),
    forward: document.getElementById('forward-button')
}
let state = 0;
let isDownloading = false;

// Functions
let togglePlayback = () => {
    if (!audio.src) return displayNotification('No track has loaded yet')
    state == 0 ? audio.play() : audio.pause();
}

let displayDuration = ({ duration }) => {
    durationContainer.textContent = calculateTime(duration)
}

let setSeekSliderMax = ({ duration }) => {
    seekSlider.max = Math.floor(duration);
}

let showRangeProgress = rangeInput => {
    audioPlayerContainer.style.setProperty('--seek-before-width', (rangeInput.value / rangeInput.max * 100) + 0.5 + '%');
}

let calculateTime = secs => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${returnedSeconds}`;
}

let requestDownload = (id, cover, artist, title, autoPlay = true) => {
    if (isDownloading) return displayNotification('Another track is still downloading')
    isDownloading = true;
    ipcRenderer.send('start-playback', { id, cover, artist, title, autoPlay })
}

let startPlayback = ({ url, cover, artist, title, autoPlay }) => {
    console.log({ url, cover, artist, title, autoPlay });

    audio.src = url;
    if (autoPlay) audio.play();

    isDownloading = false

    document.querySelectorAll('.now-playing-title').forEach(i => i.innerText = title);
    document.querySelectorAll('.now-playing-artists').forEach(i => i.innerText = artist);
    document.querySelectorAll('.now-playing-cover').forEach(i => i.src = cover);

    let prevTrack = history[history.length - 2]
    if (!prevTrack) return;
    document.getElementById('previous-track-container').style.opacity = "1";
    document.querySelectorAll('.previous-track').forEach(i => i.innerText = prevTrack.title);
}

let addToQueue = (id, cover, artist, title) => {
    queue.push({ id, cover, artist, title })

    queueContainer.insertAdjacentHTML('beforeend', `
    <div class="item">
        <span class="dot"></span>
        <div class="info">
            <p class="title">
                ${title}
            </p>
            <p class="artists">
                ${artist}
            </p>
        </div>
    </div>`)

    // Show or hide next up depending on queue length
    document.querySelectorAll('.up-next').forEach(n => n.style.display = queue.length == 0 ? 'none' : 'grid');
    if (queue[0]) document.querySelectorAll('.up-next-title').forEach(t => t.innerHTML = queue[0].title)
}

let setPlaybackIcon = () => {
    buttons.play.innerHTML = state ?
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-circle" viewBox="0 0 16 16">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
      <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5z"/>
    </svg>`: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
  </svg>`;
}

let forward = () => {
    // Request the download
    let el = queue[0];
    requestDownload(el.id, el.cover, el.artist, el.title, true)

    // Add item to history
    history.push(el)

    // Remove first element from queue
    queue = queue.slice(1, queue.length);

    // Remove item from queue list
    document.getElementById('queue-container').querySelector('.item').remove();

    // Show or hide next up depending on queue length
    document.querySelectorAll('.up-next').forEach(n => n.style.display = queue.length == 0 ? 'none' : 'grid');
    if (queue[0]) document.querySelectorAll('.up-next-title').forEach(t => t.innerHTML = queue[0].title)
}

let backward = () => {
    let el = history[history.length - 2]
    requestDownload(el.id, el.cover, el.artist, el.title, true)

    let el2 = history[history.length - 1]

    // Show or hide next up depending on queue length
    document.querySelector('#previous-track-container').style.display = history.length == 0 ? 'none' : 'grid';
    if (el2) document.querySelectorAll('.previous-track').forEach(t => t.innerHTML = el2.title)

    // Remove last element from queue
    // history = history.slice(history.length - 2, history.length - 1);
}

let initPlayer = () => {
    if (audio.readyState > 0) return init()
    audio.addEventListener('loadedmetadata', init);

    function init() {
        displayDuration(audio);
        setSeekSliderMax(audio);
    }
}
initPlayer()

// Event listeners
buttons.play.addEventListener('click', togglePlayback);
buttons.forward.addEventListener('click', forward);
buttons.backward.addEventListener('click', backward);

seekSlider.addEventListener('input', (e) => {
    showRangeProgress(e.target);
});

seekSlider.addEventListener('change', () => {
    audio.currentTime = seekSlider.value;
});

audio.addEventListener('timeupdate', () => {
    seekSlider.value = Math.floor(audio.currentTime);
    audioPlayerContainer.style.setProperty('--seek-before-width', (audio.currentTime / audio.duration * 100) + 0.5 + '%');

    currentTimeContainer.innerText = calculateTime(Math.floor(audio.currentTime));

    if (audio.currentTime / audio.duration > 0.98 && queue.length > 0) forward()
});

audio.addEventListener('pause', () => {
    state = 0;
    setPlaybackIcon();
})

audio.addEventListener('play', () => {
    state = 1;
    setPlaybackIcon();
})

volumeSlider.addEventListener('input', (e) => {
    audio.volume = volumeSlider.value / 100;
})

ipcRenderer.on('start-playback', (event, arg) => startPlayback(arg));
ipcRenderer.on('log', (event, arg) => console.log(arg))