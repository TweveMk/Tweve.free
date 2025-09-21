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

    // Check package status from server
    async function checkPackageFromServer() {
        const user = getStoredUser();
        if (!user) return false;
        
        try {
            const response = await fetch('check_package.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: user.phone
                })
            });
            
            const result = await response.json();
            
            if (result.has_package && result.package) {
                // Update local storage with server data
                const expiresAt = new Date(result.package.expires_at).getTime();
                setPackage({
                    name: result.package.package_name,
                    price: result.package.amount_paid,
                    startedAt: new Date(result.package.started_at).getTime(),
                    expiresAt: expiresAt,
                    server_verified: true
                });
                return true;
            } else {
                // Clear local package if server says no active package
                localStorage.removeItem('tw_package');
                return false;
            }
        } catch (error) {
            console.error('Package check error:', error);
            // Fall back to local check
            return hasActivePackage();
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

    // Handle selecting a plan (requires payment verification)
    planButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
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
            
            // Show processing message
            const processingMsg = document.createElement('div');
            processingMsg.innerHTML = `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                           background: #111; color: #fff; padding: 20px; border-radius: 10px; 
                           z-index: 9999; text-align: center;">
                    <div>Inachakata malipo...</div>
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #ccc;">Tafadhali subiri</div>
                </div>
            `;
            document.body.appendChild(processingMsg);
            
            try {
                // Process payment with PHP backend
                const response = await fetch('process_payment.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: user.username,
                        phone: user.phone,
                        package: name,
                        payment_method: paymentMethod === '1' ? 'M-Pesa' : paymentMethod === '2' ? 'Tigo Pesa' : 'Airtel Money',
                        phone_number: phoneNumber.trim()
                    })
                });
                
                const result = await response.json();
                document.body.removeChild(processingMsg);
                
                if (result.success) {
                    // Store package info locally
                    const now = Date.now();
                    const expiresAt = new Date(result.expires_at).getTime();
                    setPackage({ 
                        name: result.package, 
                        price: result.amount, 
                        startedAt: now, 
                        expiresAt: expiresAt,
                        transaction_id: result.transaction_id
                    });
                    
                    alert(`Malipo yamefanikiwa!\nKifurushi: ${result.package}\nNamba ya simu: ${phoneNumber.trim()}\nThamani: Tsh ${result.amount}\nMuda: ${days} siku\n\nTaarifa zimehifadhiwa kwenye kifaa chako.`);
                    showPayment(false);
                    updatePackageUI();
                } else {
                    alert(`Malipo yamekataliwa: ${result.message}`);
                }
            } catch (error) {
                document.body.removeChild(processingMsg);
                alert('Hitilafu ya mtandao. Tafadhali jaribu tena.');
                console.error('Payment error:', error);
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

    // Initialize on page load
    updateAuthUI();
    updatePackageUI();
    
    // Only show login if not already logged in
    if (!isLoggedIn()) {
        showLogin(true);
    } else {
        // Check package status from server and update UI
        checkPackageFromServer().then(() => {
            updatePackageUI();
        });
        
        // Play first channel by default if logged in
        if (channels.length > 0) {
            playStream(channels[0].getAttribute('data-src'));
        }
    }
});