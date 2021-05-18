// Discord JS Rich Presence
const RPC = require('discord-rpc');
const client = new RPC.Client({
    transport: 'ipc'
});
let startTimestamp = new Date();
let lastStatusUpdate = 0;

function updateRichPresence(artist, title, youtube_url) {
    let now = new Date().getTime();
    if (!client) return;
    if (now - lastStatusUpdate < 15000) return setTimeout(() => { updateRichPresence(artist, title, youtube_url) }, now - lastStatusUpdate);
    startTimestamp = new Date();
    setActivity(artist, title, youtube_url)
}

function setActivity(artist, title, youtube_url) {
    client.request('SET_ACTIVITY', {
        pid: process.pid,
        activity: {
            details: "Listening to music",
            state: artist && title ? `${artist} | ${title}` : `Idle`,
            timestamps: {
                start: Date.now()
            },
            assets: {
                large_image: "icon",
                large_text: "Music Player"
            },
            buttons: [
                { label: "Open in YouTube", url: youtube_url }
            ]
        }
    });
}

client.login({ clientId: '824340716616286300' }).catch(console.error);

client.on('ready', () => {
    setActivity();
})

module.exports = updateRichPresence;