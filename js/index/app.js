const { BrowserWindow } = require('@electron/remote')

let notifications = [];

let displayNotification = text => {
    let id = new Date().getTime();
    document.querySelector('notification-container').insertAdjacentHTML('afterbegin', `
    <div class="notification" notification-id="${id}">
        <p>${text}</p>
    </div>
    `)

    let el = document.querySelector(`div[notification-id="${id}"]`)
    setTimeout(() => {
        el.remove()
    }, 3000)
}