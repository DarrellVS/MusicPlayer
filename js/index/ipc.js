// In renderer process (web page).
const { ipcRenderer, BrowserWindow } = require('electron')

// Convert sec to mm:ss
let calculateTime = secs => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${returnedSeconds}`;
}

ipcRenderer.on('user-data', (event, arg) => {
    // Save spotify tokens to local storage
    localStorage.setItem('spotify_tokens', arg.spotify_tokens)

    if (arg.code !== 200) return console.error(arg.error)
    document.getElementById('avatar').style.backgroundImage = `url("${arg.avatar?.url}")`;
    document.getElementById('username').innerText = arg.username;

    let savedTracksContainer = document.getElementById('saved-tracks-container')
    arg.savedTracks.forEach(t => {
        savedTracksContainer.insertAdjacentHTML('beforeend', `
        <div class="item" onClick="requestDownload('${t.track.id}', '${t.track.album.images[0]?.url}', '${t.track.artists[0].name.replace(`'`, '')}', '${t.track.name.replace(`'`, '')}')"
        onContextMenu="addToQueue('${t.track.id}', '${t.track.album.images[0]?.url}', '${t.track.artists[0].name.replace(`'`, '')}', '${t.track.name}')">
            <img src="${t.track.album.images[0]?.url}" width="50px" height="50px" alt="cover"
                class="cover">
            <div class="info">
                <p class="title">
                    ${t.track.name}
                </p>
                <p class="artists">
                    ${t.track.artists.map(a => a.name).join(', ')}
                </p>
            </div>
        </div>
        `)
    })

    let recentTracksContainer = document.getElementById('recent-tracks-container');
    arg.recentTracks.forEach(t => recentTracksContainer.insertAdjacentHTML('beforeend', `
    <div class="item">
        <div class="img-wrapper" style="background-image: url('${t.track.album.images[0]?.url}')">
            <div class="background"></div>
            <img src="${t.track.album.images[0].url}" width="150px" height="150px" alt="">
            <div class="playback-overlay">
                <!-- is not saved -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" onClick="toggleSave('${t.track.id}', '${t.track.album.images[0]?.url}', '${t.track.artists[0].name.replace(`'`, '')}', '${t.track.name.replace(`'`, '')}')"
                    class="bi bi-save" viewBox="0 0 16 16">
                    <path
                        d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z" />
                </svg>

                <!-- Playback icon -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" onClick="requestDownload('${t.track.id}', '${t.track.album.images[0]?.url}', '${t.track.artists[0].name.replace(`'`, '')}', '${t.track.name.replace(`'`, '')}')"
                    class="bi bi-play-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path
                        d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z" />
                </svg>

                <!-- Queue icon -->
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" onClick="addToQueue('${t.track.id}', '${t.track.album.images[0]?.url}', '${t.track.artists[0].name.replace(`'`, '')}', '${t.track.name.replace(`'`, '')}')"
                    class="bi bi-node-plus" viewBox="0 0 16 16">
                    <path fill-rule="evenodd"
                        d="M11 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM6.025 7.5a5 5 0 1 1 0 1H4A1.5 1.5 0 0 1 2.5 10h-1A1.5 1.5 0 0 1 0 8.5v-1A1.5 1.5 0 0 1 1.5 6h1A1.5 1.5 0 0 1 4 7.5h2.025zM11 5a.5.5 0 0 1 .5.5v2h2a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2h-2a.5.5 0 0 1 0-1h2v-2A.5.5 0 0 1 11 5zM1.5 7a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1z" />
                </svg>
            </div>
        </div>

        <div class="info">
            <p class="title">
                ${t.track.name}
            </p>

            <p class="artists">
                ${t.track.artists.map(a => a.name).join(', ')}
            </p>
        </div>
    </div>
    `))

    // Set featured
    let featuredTrack = arg.savedTracks[0]?.track;
    let featuredDiv = document.querySelector('.featured');
    featuredDiv.querySelector('.artists').innerText = featuredTrack.artists.map(a => a.name).join(', ')
    featuredDiv.querySelector('.track').innerText = featuredTrack.name
    featuredDiv.querySelector('.duration').innerText = calculateTime(Math.floor(featuredTrack.duration_ms / 1000))
    featuredDiv.querySelector('.image').style.backgroundImage = `url("${featuredTrack.album.images[0].url}")`
    featuredDiv.querySelector('.info').addEventListener('click', () => requestDownload(featuredTrack.id, featuredTrack.album.images[0].url, featuredTrack.artists[0].name.replace(`'`, ''), featuredTrack.name))

    // Set playlists
    arg.playlists.forEach(playlist => {
        document.getElementById('playlists-container').insertAdjacentHTML('afterbegin', `
        <div class="item" onclick="openPlaylist('${playlist.id}')">
            <img src="../images/placeholder_cover.jpg" width="150px" height="150px">

            <div class="info">
                <p class="title">
                    ${playlist.name}
                </p>
            </div>
        </div>`);
    })

    // First track
    let track = arg.recentTracks[0].track;
    requestDownload(track.id, track.album.images[0].url, track.artists[0].name, track.name, false)

    history.push({
        id: track.id,
        cover: track.album.images[0].url,
        artist: track.artists[0].name,
        title: track.name
    })

    // Up next
    let track2 = arg.recentTracks[1].track;
    document.querySelectorAll('.up-next-title').forEach(t => t.innerHTML = track2.name)
    addToQueue(track2.id, track2.album.images[0].url, track2.artists[0].name, track2.name)
})

ipcRenderer.on('search-results', (event, tracks) => {
    populateSearchResults(tracks);
})

// Un-hide body
ipcRenderer.on('ready', () => {
    ipcRenderer.send('loading-finished')
})

// Insert new playlist
ipcRenderer.on('insert-new-playlist', (event, data) => {
    document.getElementById('playlists-container').insertAdjacentHTML('afterbegin', `
    <div class="item" onclick="openPlaylist('${data.id}')">
        <img src="../../images/playlist_cover.jpg" width="150px" height="150px">

        <div class="info">
            <p class="title">
                ${data.name}
            </p>
        </div>
    </div>`);
})

ipcRenderer.on('tokens', (event, data) => {
    localStorage.setItem('spotify_tokens', JSON.stringify(data))
})

// Request user data
ipcRenderer.send('request-user-data')