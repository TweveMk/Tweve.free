document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const channels = document.querySelectorAll('.channel');

    // UI elements
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const sideMenu = document.getElementById('sideMenu');
    const backdrop = document.getElementById('backdrop');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const authAction = document.getElementById('authAction');
    // rememberMe removed: we now always persist once in localStorage

    function getStoredUser() {
        const persisted = localStorage.getItem('tw_user');
        try {
            return persisted ? JSON.parse(persisted) : null;
        } catch (e) {
            return null;
        }
    }

    function setStoredUser(user) {
        const data = JSON.stringify(user);
        localStorage.setItem('tw_user', data);
    }

    function clearStoredUser() {
        localStorage.removeItem('tw_user');
        sessionStorage.removeItem('tw_user');
    }

    function isLoggedIn() {
        return !!getStoredUser();
    }

    function updateAuthUI() {
        const user = getStoredUser();
        if (user) {
            authAction.textContent = user.username ? `Logout (${user.username})` : 'Logout';
            authAction.setAttribute('data-mode', 'logout');
        } else {
            authAction.textContent = 'Login';
            authAction.setAttribute('data-mode', 'login');
        }
    }

    function showMenu(show) {
        if (!sideMenu || !backdrop) return;
        if (show) {
            sideMenu.classList.add('open');
            backdrop.hidden = false;
            backdrop.style.display = 'block';
            sideMenu.setAttribute('aria-hidden', 'false');
        } else {
            sideMenu.classList.remove('open');
            backdrop.hidden = true;
            backdrop.style.display = 'none';
            sideMenu.setAttribute('aria-hidden', 'true');
        }
    }

    function showLogin(show) {
        if (!loginModal || !backdrop) return;
        loginError.textContent = '';
        if (show) {
            loginModal.hidden = false;
            loginModal.style.display = 'grid';
            backdrop.hidden = false;
            backdrop.style.display = 'block';
            loginModal.setAttribute('aria-hidden', 'false');
        } else {
            loginModal.hidden = true;
            loginModal.style.display = 'none';
            backdrop.hidden = true;
            backdrop.style.display = 'none';
            loginModal.setAttribute('aria-hidden', 'true');
        }
    }

    function validatePhone(value) {
        // Basic international format or local digits (7-15 digits)
        const cleaned = value.trim();
        return /^\+?[0-9\s\-()]{7,20}$/.test(cleaned);
    }

    function playStream(url) {
        if (!isLoggedIn()) {
            showLogin(true);
            return;
        }
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

    // Channel click handling with 18+ confirm
    channels.forEach(channel => {
        channel.addEventListener('click', function () {
            const isAdult = this.classList.contains('adult');
            if (isAdult) {
                const ok = confirm('This section is intended for adults (18+). Continue?');
                if (!ok) return;
            }
            playStream(this.getAttribute('data-src'));
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // Menu interactions
    if (menuToggle) menuToggle.addEventListener('click', () => showMenu(true));
    if (menuClose) menuClose.addEventListener('click', () => showMenu(false));
    if (backdrop) backdrop.addEventListener('click', () => {
        showMenu(false);
        showLogin(false);
    });

    // Menu link scroll and category toggling
    const menuLinks = document.querySelectorAll('#sideMenu a[data-target]');
    const liveSections = document.querySelectorAll('.category-live');
    const movieSections = document.querySelectorAll('.category-movies');
    const adultSections = document.querySelectorAll('.category-adult');

    function setCategoryVisible(category) {
        const hideAll = (nodes) => nodes.forEach(n => n.style.display = 'none');
        const showAll = (nodes) => nodes.forEach(n => n.style.display = '');
        hideAll(liveSections);
        hideAll(movieSections);
        hideAll(adultSections);
        if (category === 'live-tv') showAll(liveSections);
        if (category === 'movies') showAll(movieSections);
        if (category === 'adult') showAll(adultSections);
    }

    // Default to Live TV on load
    setCategoryVisible('live-tv');

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            setCategoryVisible(target);
            const section = document.getElementById(target);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showMenu(false);
        });
    });

    // Auth button
    if (authAction) {
        authAction.addEventListener('click', () => {
            const mode = authAction.getAttribute('data-mode');
            if (mode === 'logout') {
                clearStoredUser();
                updateAuthUI();
                showLogin(true);
            } else {
                showLogin(true);
            }
        });
    }

    // Login submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = (document.getElementById('username') || {}).value || '';
            const phone = (document.getElementById('phone') || {}).value || '';
            if (!username.trim()) {
                loginError.textContent = 'Please enter a username.';
                return;
            }
            if (!validatePhone(phone)) {
                loginError.textContent = 'Please enter a valid phone number.';
                return;
            }
            setStoredUser({ username: username.trim(), phone: phone.trim() });
            updateAuthUI();
            showLogin(false);
            // Autoplay first channel after login
            const first = document.querySelector('.channel');
            if (first) {
                playStream(first.getAttribute('data-src'));
            }
        });
    }

    // Movie action buttons
    const moviePlays = document.querySelectorAll('.movie-card .movie-play');
    moviePlays.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const card = btn.closest('.movie-card');
            if (card) playStream(card.getAttribute('data-src'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    const movieDownloads = document.querySelectorAll('.movie-card .movie-download');
    movieDownloads.forEach(a => {
        a.addEventListener('click', (e) => {
            // allow navigation but prevent bubbling to parent play
            e.stopPropagation();
        });
    });

    // Initialize auth state
    updateAuthUI();

    // Play first channel by default only if logged in
    if (channels.length > 0 && isLoggedIn()) {
        playStream(channels[0].getAttribute('data-src'));
    } else if (!isLoggedIn()) {
        showLogin(true);
    }
});