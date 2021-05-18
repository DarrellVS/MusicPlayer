document.addEventListener('keyup', e => {
    console.log(e);
    switch (e.key) {
        case 'ArrowUp':
            backward()
            break;

        case 'ArrowDown':
            forward()
            break;

        case 'ArrowLeft':
            backward()
            break;

        case 'ArrowRight':
            forward()
            break;

        case ' ':
            togglePlayback()
            break;

        default:
            break;
    }
});