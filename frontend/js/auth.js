/* ==========================================================
   Travel Explorer - Authentication Script
   Connects original Login/Register UI with Node.js/MySQL Backend
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session_expired')) {
        showMessage('Your session has expired. Please log in again.', 'error');
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
});

async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const submitBtn = document.getElementById('submitSignIn') || document.getElementById('submitBtn');

    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        }

        const res = await API.auth.login({ email, password });

        API.setToken(res.token);
        API.setUser(res.user);

        showMessage('Login successful! Redirecting...', 'success');

        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || (res.user && res.user.role === 'admin' ? '/pages/admin.html' : '/homepage.html');

        setTimeout(() => {
            window.location.href = redirect;
        }, 500);
    } catch (err) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Login';
        }
        showMessage(err.message || 'Login failed. Please check your credentials.', 'error');
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('username')?.value.trim();
    const email = (document.getElementById('email') || document.getElementById('rEmail'))?.value.trim();
    const password = (document.getElementById('password') || document.getElementById('rPassword'))?.value;
    const submitBtn = document.getElementById('submitSignUp') || document.getElementById('submitBtn');

    if (!username || !email || !password) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        }

        const res = await API.auth.register({ username, email, password });

        API.setToken(res.token);
        API.setUser(res.user);

        showMessage('Account created successfully! Please log in.', 'success');

        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 600);
    } catch (err) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign Up';
        }
        showMessage(err.message || 'Registration failed. Please try a different email.', 'error');
    }
}

function showMessage(message, type = 'info') {
    const msgDiv = document.getElementById('signInMessage') || 
                   document.getElementById('signUpMessage') || 
                   document.getElementById('authAlert');

    if (!msgDiv) {
        alert(message);
        return;
    }

    msgDiv.className = `messageDiv ${type}`;
    msgDiv.textContent = message;
    msgDiv.style.display = 'block';
}
