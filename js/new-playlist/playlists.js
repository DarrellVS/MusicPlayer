const {ipcRenderer} = require('electron')

// Close playlist window
let closeNewPlaylistWindow = () => win === null ? false : window.close();

// Create new playlist
let createPlaylist = () => {
    let name = document.getElementById('playlist-name')?.value?.trim();
    if (name === undefined || name.length === 0) return console.error('No or invalid playlist name');

    ipcRenderer.send('new-playlist', name)

    window.close();
}