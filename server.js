// Define variables and include libraries
var SpotifyWebApi = require('spotify-web-api-node');
let userStore = require('./modules/userstore')
const fetch = require('node-fetch');
const ytdl = require('ytdl-core')
var express = require('express')
const path = require('path')
const ytsr = require('ytsr')
const fs = require('fs')
var app = express();

let windowManager = require('./modules/windowManager')

let isDist = true;
let refreshInterval;
let globalEvent;

if (isDist) var updateRichPresence = require('./discord-rpc')
// var updateRichPresence = require('./discord-rpc')

// Port on which the webserver listens
let port = 4000;

// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: 'http://localhost:4000'
});

module.exports = ipcMain => {
    ipcMain.on('request-user-data', async (event, arg) => {
        // Store event
        globalEvent = event

        // Get user details
        let api_key = userStore.getAPIKey();
        let data = userStore.getSpotifyTokens();
        await newSetToken(data)

        try {
            let { body: me } = await spotifyApi.getMe()
            let { body: savedTracks } = await spotifyApi.getMySavedTracks({ limit: 5 })
            let { body: recentTracks } = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 20 })
            let response = await fetch(`https://api.darrellvs.nl/musicplayer/get/playlists?api_key=${api_key}`)
            let playlist_data = await response.json()
            let spotify_tokens = JSON.stringify(userStore.getSpotifyTokens());

            // Construct playlist array
            let playlists = [];
            if (playlist_data.code === 200) playlists = playlist_data.playlists
            if (playlist_data.code !== 200) console.error(playlist_data.error)

            event.reply('user-data', {
                code: 200,
                product: me?.product,
                avatar: {
                    url: me?.images[0]?.url
                },
                username: userStore.getUsername(),
                savedTracks: savedTracks?.items,
                recentTracks: recentTracks?.items,
                playlists,
                spotify_tokens
            })
        } catch (error) {
            console.error(error)
            event.reply('avatar', { code: 500, error })
        }
    })

    ipcMain.on('search', (event, query) => {
        spotifyApi.searchTracks(query)
            .then(function (data) {
                event.reply('search-results', { tracks: data?.body?.tracks?.items?.splice(0, 5) })
            }, function (err) {
                console.error(err);
            });
    })

    ipcMain.on('start-playback', async (event, { id, cover, artist, title, autoPlay }) => {
        // Construct filename
        let filename = `${new Date().getTime()}.mp3`;

        // Construct download directory
        const dlDir = path.join(__dirname, `${isDist ? '../../' : '/'}audio`)

        // Create dir if it does not yet exist, empty it afterwards
        if (!fs.existsSync(dlDir)) fs.mkdirSync(dlDir);
        await clearAudioDir(dlDir);

        // Construct download path
        const dlPath = path.join(dlDir, `${filename}`)

        // Search for song on youtube
        const options = {
            limit: 1,
        }
        const searchResults = await ytsr(`${artist} - ${title}`, options);

        // Download song from youtube
        let dlStream = ytdl(searchResults.items[0].url, { quality: 'highestaudio' });
        dlStream.pipe(fs.createWriteStream(dlPath));

        // Upon stream end, send response to render process
        dlStream.on('end', () => {
            let data = {
                url: path.join('file://', dlPath)
            }

            event.reply('start-playback', { code: 200, url: data.url, cover, artist, title, autoPlay })
            event.reply('ready')

            if (isDist) updateRichPresence(artist, title, youtube_url);
            // updateRichPresence(artist, title, searchResults.items[0].url);
        })
    })

    ipcMain.on('new-playlist', async (event, name) => {
        let api_key = userStore.getAPIKey();
        let res = await fetch('https://api.darrellvs.nl/musicplayer/new/playlist', {
            method: 'post',
            body: JSON.stringify({ api_key, name }),
            headers: { 'Content-Type': 'application/json' },
        })
        let data = await res.json()
        if (data.code !== 200) console.error(data.error)

        globalEvent.reply('insert-new-playlist', { id: data.id, name })
    })
}

// Send the index page
app.get('/', function (req, res) {
    res.send(req.query.code)

    registerUser(req.query.code)
})

function newSetToken(data) {
    return new Promise(async (resolve, reject) => {
        if (data.expiration_time) data['expires_in'] = Math.floor(data['expiration_time'] - new Date().getTime() / 1000);

        try {
            const access_token = data.access_token;
            const refresh_token = data.refresh_token;
            const expires_in = data.expires_in;

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            if (expires_in <= 1800) refreshAccessToken();

            await saveTokenData(data)

            console.log(`Sucessfully retreived access token. ${expires_in < 0 ? `Expired ${expires_in} seconds ago` : `Expires in ${expires_in} seconds`}`);

            refreshInterval = setInterval(refreshAccessToken, (expires_in <= 0 ? 1 : expires_in) / 2 * 1000);

            resolve();

            async function refreshAccessToken() {
                clearInterval(refreshInterval)
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];

                console.log('The access token has been refreshed!');
                spotifyApi.setAccessToken(access_token);

                await saveTokenData({ access_token, refresh_token, expires_in: 3600 })
                refreshInterval = setInterval(refreshAccessToken, 1800 * 1000)
                console.log('Refreshing access token in 1800 seconds')
            }
        } catch (error) {
            console.error('Error getting Tokens:', error);
            throw new Error('Error getting Spotify tokens.')
        }

        function saveTokenData(data) {
            return new Promise(async (resolve, reject) => {
                data['expiration_time'] = Math.round(new Date().getTime() / 1000 + data['expires_in']);
                let body = {
                    access_token: data['access_token'],
                    refresh_token: data['refresh_token'],
                    expiration_time: data['expiration_time']
                }
                userStore.setSpotifyTokens(body)
                globalEvent.reply('tokens', body)
                resolve();
            })
        }
    })
}

async function registerUser(code) {
    const data = await spotifyApi.authorizationCodeGrant(code)
    await newSetToken(data.body);
    windowManager.destroy('spotifyLogin')
    windowManager.create.main()
}

async function clearAudioDir(directory) {
    try {
        let files = await readDir(directory);
        for (const file of files) await removeFile(file, directory)
        return 1
    } catch (err) {
        console.log(err);
        return 0
    }

    function readDir(directory) {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, async (err, files) => {
                if (err) return reject(err);
                resolve(files)
            });
        })
    }

    function removeFile(file, directory) {
        return new Promise((resolve, reject) => {
            fs.unlink(path.join(directory, file), err => {
                if (err) return reject(err)
                resolve();
            });
        })
    }
}

// Open the server on the port var
app.listen(port, () => {
    console.log('listening on port ' + port)
});