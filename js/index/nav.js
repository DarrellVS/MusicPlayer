const { ipcRenderer } = require('electron')

// Close Button Functionality
document.getElementById("close-btn").addEventListener("click", () => {
    var window = BrowserWindow.getFocusedWindow();
    window.close();
});

// Fullscreen Button Functionality
document.getElementById("fullscreen-btn").addEventListener("click", () => {
    var window = BrowserWindow.getFocusedWindow();
    window.maximize();
});

// Fullscreen Button Functionality
document.getElementById("minimize-btn").addEventListener("click", () => {
    var window = BrowserWindow.getFocusedWindow();
    window.minimize();
});

document.getElementById('sign-out').addEventListener('click', () => {
    localStorage.removeItem('user')
    localStorage.removeItem('spotify_tokens')
    ipcRenderer.send('sign-out')
});

let setPage = page => {
    // Display correct page
    document.querySelectorAll('.page-switchable').forEach(p => p.style.display = p.id === page ? 'block' : 'none');

    // Highlight correct label
    document.querySelectorAll('.nav-label').forEach(l => l.classList.remove('active'))
    document.querySelector(`.nav-label#side-nav-${page}`).classList.add('active')
}