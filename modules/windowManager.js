const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
var windows = {};

module.exports = {
    getWindows: () => windows,

    create: {
        main: () => {
            // Create the browser window.
            windows.main = new BrowserWindow({
                width: 1400,
                height: 860,
                frame: false,
                icon: 'images/icon.png',
                show: false,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: true,
                    preload: path.join(__dirname, "../js/index/ipc.js") // use a preload script
                }
            })

            // and load the index.html of the app.
            windows.main.loadFile(path.join(__dirname, '../html/index.html'))
        },

        login: () => {
            // Create the browser window.
            windows.login = new BrowserWindow({
                width: 900,
                height: 500,
                modal: true,
                frame: false,
                icon: 'images/icon.png',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: true
                }
            })

            // and load the login.html of the app.
            windows.login.loadFile(path.join(__dirname, '../html/login.html'))
        },

        spotifyLogin: () => {
            // Create the browser window.
            windows.spotifyLogin = new BrowserWindow({
                width: 900,
                height: 500,
                modal: true,
                frame: false,
                icon: 'images/icon.png',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: true
                }
            })

            // and load the login.html of the app.
            windows.spotifyLogin.loadURL('https://accounts.spotify.com/authorize?client_id=dcc9cc1f44db4e7481140c498e090ee2&response_type=code&redirect_uri=http://localhost:4000&scope=ugc-image-upload%20user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20streaming%20app-remote-control%20user-read-email%20user-read-private%20playlist-read-collaborative%20playlist-modify-public%20playlist-read-private%20playlist-modify-private%20user-library-modify%20user-library-read%20user-top-read%20user-read-playback-position%20user-read-recently-played%20user-follow-read%20user-follow-modify')
        },

        loading: () => {
            // Create the browser window.
            windows.loading = new BrowserWindow({
                width: 400,
                height: 500,
                parent: windows.main,
                modal: true,
                frame: false,
                icon: 'images/icon.png',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: true,
                    preload: path.join(__dirname, "../js/loading/preload.js") // use a preload script
                }
            })

            // and load the loading.html of the app.
            windows.loading.loadFile(path.join(__dirname, '../html/loading.html'))
        }
    },

    destroy: window => {
        windows[window]?.close()
        delete windows[window]
    },

    show: window => windows[window]?.show()
}