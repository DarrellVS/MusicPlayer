const { ipcRenderer } = require('electron')

document.getElementById('submit').addEventListener('click', postData);

document.getElementById('username').addEventListener('keyup', e => {
    if (e.key === 'Enter') postData()
});

document.getElementById('password').addEventListener('keyup', e => {
    if (e.key === 'Enter') postData()
});

async function postData() {
    // Send data
    let body = {
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value.trim()
    }

    // POST
    let res = await fetch(`https://api.darrellvs.nl/musicplayer/login`, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })

    // Get JSON response
    let response = await res.json();

    // Validate
    if (response.code !== 200) console.error(response.error)

    // Construct user data scheme
    let data = {
        username: response.body.username,
        api_key: response.body.api_key
    }

    localStorage.setItem('user', JSON.stringify(data))
    ipcRenderer.send('login-success', data)
}