const path = require('path')
let win;

// Create playlist window
let createNewPlaylistWindow = () => {
    const modalPath = path.join('file://', __dirname, '/modals/newPlaylist.html')
    win = new BrowserWindow({
        width: 400,
        height: 500,
        frame: false,
        show: false,
        icon: 'images/icon.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })
    win.on('close', () => win = null)
    win.loadURL(modalPath)
    win.show()
}