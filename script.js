document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const channels = document.querySelectorAll('.channel');

    function playStream(url) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error('HLS Error:', data);
                    alert('Error loading stream. Please try another channel.');
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
        }
        video.play().catch(error => {
            console.error('Playback error:', error);
        });
    }

    channels.forEach(channel => {
        channel.addEventListener('click', function () {
            playStream(this.getAttribute('data-src'));
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // Play first channel by default
    if (channels.length > 0) {
        playStream(channels[0].getAttribute('data-src'));
    }
});