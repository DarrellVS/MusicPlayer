const { ipcRenderer } = require('electron')

let user = localStorage.getItem('user') ?? undefined;
let spotify_tokens = localStorage.getItem('spotify_tokens') ?? undefined

ipcRenderer.send('send-user-data', {
    user,
    spotify_tokens
})