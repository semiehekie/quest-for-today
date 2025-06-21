
// Login System
const CURRENT_USER_KEY = 'currentUser';

let currentUser = null;

// Initialize login system
async function initLogin() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateLoginUI();
        } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem(CURRENT_USER_KEY);
        }
    }

    setupLoginEvents();
}

// Setup event listeners
function setupLoginEvents() {
    const loginBtn = document.getElementById('loginBtn');
    const modal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const naam = document.getElementById('loginNaam').value.trim();
    const wachtwoord = document.getElementById('loginWachtwoord').value;

    if (!naam || !wachtwoord) {
        alert('Vul alle velden in!');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ naam, wachtwoord })
        });

        const result = await response.json();

        if (response.ok) {
            currentUser = result.user;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
            updateLoginUI();
            document.getElementById('loginModal').style.display = 'none';
            alert('Succesvol ingelogd!');
            
            // Clear form
            document.getElementById('loginNaam').value = '';
            document.getElementById('loginWachtwoord').value = '';
            
            // Update points display
            updatePointsDisplay();
        } else {
            alert(result.error || 'Login mislukt');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Er is een fout opgetreden bij het inloggen');
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    const naam = document.getElementById('registerNaam').value.trim();
    const wachtwoord = document.getElementById('registerWachtwoord').value;

    if (!naam || !wachtwoord) {
        alert('Vul alle velden in!');
        return;
    }

    if (naam.length < 3) {
        alert('Gebruikersnaam moet minimaal 3 karakters lang zijn');
        return;
    }

    if (wachtwoord.length < 4) {
        alert('Wachtwoord moet minimaal 4 karakters lang zijn');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                naam: naam,
                wachtwoord: wachtwoord,
                punten: 0
            })
        });

        const result = await response.json();

        if (response.ok) {
            currentUser = {
                naam: naam,
                punten: 0
            };

            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
            
            updateLoginUI();
            document.getElementById('loginModal').style.display = 'none';
            alert('Account succesvol aangemaakt en ingelogd!');
            
            // Clear form
            document.getElementById('registerNaam').value = '';
            document.getElementById('registerWachtwoord').value = '';
            
            // Update points display
            updatePointsDisplay();
        } else {
            alert(result.error || 'Registratie mislukt');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Er is een fout opgetreden bij het registreren');
    }
}

// Update UI based on login status
function updateLoginUI() {
    const loginBtn = document.getElementById('loginBtn');
    const gebruikerNaam = document.getElementById('gebruikerNaam');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUser && loginBtn && gebruikerNaam && logoutBtn) {
        loginBtn.style.display = 'none';
        gebruikerNaam.style.display = 'inline';
        gebruikerNaam.textContent = `Welkom, ${currentUser.naam}!`;
        logoutBtn.style.display = 'inline';
    } else if (loginBtn && gebruikerNaam && logoutBtn) {
        loginBtn.style.display = 'inline';
        gebruikerNaam.style.display = 'none';
        logoutBtn.style.display = 'none';
    }

    updatePointsDisplay();
}

// Update points display
function updatePointsDisplay() {
    const puntenTeller = document.getElementById('puntenTeller');
    if (puntenTeller) {
        if (currentUser) {
            puntenTeller.textContent = currentUser.punten.toLocaleString();
        } else {
            puntenTeller.textContent = '0';
        }
    }
}

// Logout function
function uitloggen() {
    currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
    updateLoginUI();
    alert('Je bent uitgelogd!');
    
    // Refresh page to reset everything
    window.location.reload();
}

// Show tab function
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabs.forEach(tab => tab.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));

    const targetForm = document.getElementById(tabName + 'Form');
    const targetBtn = event.target;

    if (targetForm) targetForm.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');

    // Clear form fields
    const loginNaam = document.getElementById('loginNaam');
    const loginWachtwoord = document.getElementById('loginWachtwoord');
    const registerNaam = document.getElementById('registerNaam');
    const registerWachtwoord = document.getElementById('registerWachtwoord');

    if (loginNaam) loginNaam.value = '';
    if (loginWachtwoord) loginWachtwoord.value = '';
    if (registerNaam) registerNaam.value = '';
    if (registerWachtwoord) registerWachtwoord.value = '';
}

// Get current user points (can be used by other scripts)
function getCurrentUserPoints() {
    return currentUser ? currentUser.punten : 0;
}

// Update current user points (can be used by other scripts)
async function updateCurrentUserPoints(newPoints) {
    if (currentUser) {
        try {
            const response = await fetch('/api/update-points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    naam: currentUser.naam,
                    punten: newPoints
                })
            });

            const result = await response.json();

            if (response.ok) {
                currentUser.punten = newPoints;
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
                updatePointsDisplay();
                return true;
            } else {
                console.error('Error updating points:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Error updating points:', error);
            return false;
        }
    }
    return false;
}

// Function to refresh user points from server
async function refreshUserPoints() {
    if (currentUser) {
        try {
            const response = await fetch(`/api/user/${currentUser.naam}`);

            if (response.ok) {
                const result = await response.json();
                if (result.user && result.user.punten !== currentUser.punten) {
                    currentUser.punten = result.user.punten;
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
                    updatePointsDisplay();
                }
            }
        } catch (error) {
            console.error('Error refreshing points:', error);
        }
    }
}

// Auto-refresh points every 5 seconds if user is logged in
setInterval(() => {
    if (currentUser) {
        refreshUserPoints();
    }
}, 5000);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initLogin);
