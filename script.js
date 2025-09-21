document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const channels = document.querySelectorAll('.channel');

    // UI elements
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const sideMenu = document.getElementById('sideMenu');
    const backdrop = document.getElementById('backdrop');
    const loginModal = document.getElementById('loginModal');
    const paymentModal = document.getElementById('paymentModal');
    const paymentClose = document.getElementById('paymentClose');
    const planButtons = document.querySelectorAll('.plan-btn');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const authAction = document.getElementById('authAction');
    const packageStatus = document.getElementById('packageStatus');

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

    function showPayment(show) {
        if (!paymentModal || !backdrop) return;
        if (show) {
            paymentModal.hidden = false;
            paymentModal.style.display = 'grid';
            backdrop.hidden = false;
            backdrop.style.display = 'block';
            paymentModal.setAttribute('aria-hidden', 'false');
        } else {
            paymentModal.hidden = true;
            paymentModal.style.display = 'none';
            backdrop.hidden = true;
            backdrop.style.display = 'none';
            paymentModal.setAttribute('aria-hidden', 'true');
        }
    }

    // Package storage
    function setCookie(name, value, days) {
        const d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        const expires = "expires="+ d.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    }

    function getCookie(name) {
        const cname = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(cname) === 0) return c.substring(cname.length, c.length);
        }
        return "";
    }

    function getPackage() {
        try {
            const p = localStorage.getItem('tw_package');
            return p ? JSON.parse(p) : null;
        } catch { return null; }
    }

    function setPackage(pkg) {
        localStorage.setItem('tw_package', JSON.stringify(pkg));
        setCookie('tw_package', JSON.stringify(pkg), 400);
    }

    function hasActivePackage() {
        const pkg = getPackage();
        if (!pkg) return false;
        return Date.now() < pkg.expiresAt;
    }

    // Check package status (localStorage only)
    function checkPackageStatus() {
        return hasActivePackage();
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
        showPayment(false);
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
            // Gate Movies and Adult by package
            if ((target === 'movies' || target === 'adult') && !hasActivePackage()) {
                showPayment(true);
                return;
            }
            setCategoryVisible(target);
            const section = document.getElementById(target);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showMenu(false);
        });
    });

    // Handle selecting a plan (simplified payment verification)
    planButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-plan');
            const days = parseInt(btn.getAttribute('data-days'), 10) || 1;
            const price = btn.getAttribute('data-price');
            
            // Show payment form
            const paymentMethod = prompt(`Chagua njia ya malipo:\n1. M-Pesa\n2. Tigo Pesa\n3. Airtel Money\n\nKifurushi: ${name} - Tsh ${price}\n\nAndika namba 1, 2, au 3:`);
            
            if (!paymentMethod || !['1', '2', '3'].includes(paymentMethod.trim())) {
                alert('Malipo yamekataliwa. Tafadhali chagua njia ya malipo sahihi.');
                return;
            }
            
            const phoneNumber = prompt(`Ingiza namba ya simu yako (${paymentMethod === '1' ? 'M-Pesa' : paymentMethod === '2' ? 'Tigo Pesa' : 'Airtel Money'}):`);
            
            if (!phoneNumber || phoneNumber.trim().length < 10) {
                alert('Namba ya simu si sahihi. Tafadhali ingiza namba sahihi.');
                return;
            }
            
            // Get current user info
            const user = getStoredUser();
            if (!user) {
                alert('Tafadhali ingia kwanza.');
                return;
            }
            
            // Simulate payment processing with realistic success rate
            const success = Math.random() < 0.85; // 85% success rate
            
            if (success) {
                // Process successful payment
                const now = Date.now();
                const expiresAt = now + days * 24 * 60 * 60 * 1000;
                const transactionId = 'TWEVE_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                
                setPackage({ 
                    name: name, 
                    price: parseInt(price), 
                    startedAt: now, 
                    expiresAt: expiresAt,
                    phone: phoneNumber.trim(),
                    paymentMethod: paymentMethod === '1' ? 'M-Pesa' : paymentMethod === '2' ? 'Tigo Pesa' : 'Airtel Money',
                    transaction_id: transactionId
                });
                
                alert(`Malipo yamefanikiwa!\nKifurushi: ${name}\nNamba ya simu: ${phoneNumber.trim()}\nThamani: Tsh ${price}\nMuda: ${days} siku\nTransaction ID: ${transactionId}\n\nTaarifa zimehifadhiwa kwenye kifaa chako (localStorage & cookies).`);
                showPayment(false);
                updatePackageUI();
            } else {
                alert('Malipo yamekataliwa. Tafadhali jaribu tena au uwasiliane na huduma ya wateja.');
            }
        });
    });

    if (paymentClose) paymentClose.addEventListener('click', () => showPayment(false));

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

    function formatDate(ts) {
        const d = new Date(ts);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function updatePackageUI() {
        if (!packageStatus) return;
        const pkg = getPackage();
        if (pkg && Date.now() < pkg.expiresAt) {
            packageStatus.textContent = `${pkg.name} · until ${formatDate(pkg.expiresAt)}`;
        } else {
            packageStatus.textContent = 'No package';
        }
    }

    // Initialize on page load
    updateAuthUI();
    updatePackageUI();
    
    // Only show login if not already logged in
    if (!isLoggedIn()) {
        showLogin(true);
    } else {
        // Check package status and update UI
        checkPackageStatus();
        updatePackageUI();
        
        // Play first channel by default if logged in
        if (channels.length > 0) {
            playStream(channels[0].getAttribute('data-src'));
        }
    }
});