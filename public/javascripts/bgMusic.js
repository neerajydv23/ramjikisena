document.addEventListener('DOMContentLoaded', function () {
    const musicSelect = document.getElementById('musicSelect');
    const bgMusic = document.getElementById('bgMusic');

    musicSelect.addEventListener('change', function () {
        const selectedMusic = musicSelect.value;
        if (selectedMusic === 'none') {
            bgMusic.pause(); // Pause the music if "No Music" is selected
        } else {
            bgMusic.src = selectedMusic;
            bgMusic.play(); // Play the selected music
        }
    });
});