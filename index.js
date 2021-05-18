require('dotenv').config()

const { app, BrowserWindow, ipcMain } = require('electron')
require('@electron/remote/main').initialize()
const fetch = require('node-fetch')
require('./server')(ipcMain)

let windowManager = require('./modules/windowManager')

let userStore = require('./modules/userstore')

app.whenReady().then(async () => {
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    // Create loading window
    windowManager.create['loading']();

    // Upon receiving user data from localstorage
    ipcMain.on('send-user-data', (event, arg) => {
        const { user, spotify_tokens } = arg;
        try {
            var user_data = JSON.parse(user)
            var tokens = JSON.parse(spotify_tokens)

            // Create login window if user is not logged in
            if (user_data === undefined || user_data.api_key === undefined) return windowManager.create.login()

            // Save spotify tokens to user store if available
            if (tokens?.access_token && tokens?.refresh_token && tokens?.expiration_time) userStore.setSpotifyTokens(tokens)
        } catch (err) {
            // Create login window if user is not logged in
            if (user_data === undefined || user_data.api_key === undefined) return windowManager.create.login()
        }

        // Create login window if user is not logged in
        if (user_data === undefined || user_data.api_key === undefined) return windowManager.create.login()

        // Got user credentials, log user in
        login(user_data.api_key)
    })
})

ipcMain.on('login-success', async (event, data) => {
    login(data.api_key)
})

ipcMain.on('sign-out', () => {
    windowManager.create.login();
    windowManager.destroy('main')
})

ipcMain.on('loading-finished', () => {
    windowManager.show('main');

    // Remove loading window
    try {
        windowManager.destroy('loading')
    } catch (err) { }
})

let login = async api_key => {
    // Get user data
    let res = await fetch(`https://api.darrellvs.nl/musicplayer/auth`, {
        method: 'post',
        body: JSON.stringify({ api_key }),
        headers: { 'Content-Type': 'application/json' },
    })
    let result = await res.json();

    // Validate
    if (result.code !== 200) {
        windowManager.create.login();
        return windowManager.destroy('loading');
    }
    let { user_data } = result;

    // If no user matched (invalid api key)
    if (user_data === undefined) {
        windowManager.destroy('loading')
        return windowManager.create.login();
    }

    userStore.setAPIKey(user_data.api_key)
    userStore.setUsername(user_data.username)

    // If spotify is not logged in
    let spotifyTokens = userStore.getSpotifyTokens();
    if (spotifyTokens.access_token === undefined || spotifyTokens.refresh_token === undefined || spotifyTokens.expiration_time === undefined) return windowManager.create.spotifyLogin();

    // Create main window
    windowManager.create.main();

    // Remove login window
    try {
        windowManager.destroy('login')
    } catch (err) { }
}

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})