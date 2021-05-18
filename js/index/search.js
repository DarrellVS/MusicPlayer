const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('result-container');
const searchResultsParent = document.querySelector('search-results');

let typingTimer;
let doneTypingInterval = 250;

// Request a search query trhough the ipcRenderer
let executeSearch = () => {
    let query = searchInput.value.trim();
    if (query.length == 0) return displayNotification('Type something before searching')
    ipcRenderer.send('search', query)
}

// Populate the search results container
let populateSearchResults = ({ tracks }) => {
    searchResultsContainer.innerHTML = '';
    searchResultsParent.style.display = 'block';
    tracks.forEach(t => {
        searchResultsContainer.insertAdjacentHTML('beforeend', `
        <div class="item" onclick="requestDownload('${t.id}', '${t.album.images[0]?.url}', '${t.artists[0].name.replace(`'`, '')}', '${t.name.replace(`'`, '')}'); hideSearch()">
            <img src="${t.album?.images[0]?.url}" width="50px" height="50px" alt="" class="cover">
            <div class="info">
                <p class="title">${t.name}</p>
                <p class="artists">${t.artists.map(a => a.name).join(', ')}</p>
            </div>
        </div>`)
    });
}

// hide the search results
let hideSearch = () => searchResultsParent.style.display = 'none';

// Listen for search icon clicks
document.getElementById('search-icon').addEventListener("click", executeSearch);

// Listen for clicks and close search overlay if click is outside its DOM element
window.addEventListener('click', function (e) {
    if (!searchResultsParent.contains(e.target)) hideSearch();
});

//On kety up, check if user stopped typing or if key is enter
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') return executeSearch()

    clearTimeout(typingTimer);
    if (searchInput.value.trim()) typingTimer = setTimeout(executeSearch, doneTypingInterval);
});