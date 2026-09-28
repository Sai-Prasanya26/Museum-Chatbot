/* ==========================================================
   Museum Booking System - Common Helper Functions
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initNavigationAuth();
    highlightActiveNavLink();
});

function isLoggedIn() {
    return !!API.getToken();
}

function getUser() {
    return API.getUser();
}

function requireAuth(redirectUrl = null) {
    if (!isLoggedIn()) {
        const dest = redirectUrl || window.location.pathname + window.location.search;
        window.location.href = `/pages/login.html?redirect=${encodeURIComponent(dest)}`;
        return false;
    }
    return true;
}

function initNavigationAuth() {
    const userNavSection = document.getElementById('userNavSection');
    if (!userNavSection) return;

    const user = getUser();
    const displayName = (user && (user.username || user.name)) ? (user.username || user.name) : 'Sai';
    const isAdmin = user && user.role === 'admin';

    userNavSection.innerHTML = `
        <div class="profile-dropdown" id="profileDropdown">
            <button class="profile-btn" id="profileDropdownBtn" onclick="toggleProfileDropdown(event)" aria-haspopup="true" aria-expanded="false" title="Account Menu">
                <i class="fas fa-user-circle"></i>
                <span class="user-name-text">${escapeHTML(displayName)}</span>
                <i class="fas fa-chevron-down dropdown-arrow" style="font-size: 0.75rem;"></i>
            </button>
            <div id="dropdownMenu" class="dropdown-menu">
                ${isAdmin ? '<a href="/pages/admin.html" class="dropdown-item admin-item" style="color: #4f46e5; font-weight: 600;"><i class="fas fa-shield-alt"></i> Admin Panel</a>' : ''}
                <a href="/mybookings.html" class="dropdown-item"><i class="fas fa-ticket-alt"></i> My Bookings</a>
                <hr class="dropdown-divider">
                <a href="#" onclick="handleLogout(event)" class="dropdown-item logout-item" style="color: #ef4444;"><i class="fas fa-sign-out-alt"></i> Logout</a>
            </div>
        </div>
    `;
}

function toggleMobileNav(e) {
    if (e) e.stopPropagation();
    const navMenu = document.getElementById('navLinks') || document.getElementById('navCenter') || document.querySelector('.nav-links') || document.querySelector('.nav-center');
    const toggleBtn = document.getElementById('mobileNavToggle');
    if (navMenu) {
        const isOpen = navMenu.classList.toggle('mobile-open');
        if (toggleBtn) {
            toggleBtn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
            toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
    }
}

function toggleProfileDropdown(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('dropdownMenu');
    const dropdown = document.getElementById('profileDropdown');
    const btn = document.getElementById('profileDropdownBtn');
    if (menu) {
        const isOpen = menu.classList.toggle('active');
        if (dropdown) dropdown.classList.toggle('open', isOpen);
        if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
}

window.addEventListener('click', (e) => {
    const menu = document.getElementById('dropdownMenu');
    const dropdown = document.getElementById('profileDropdown');
    const btn = document.getElementById('profileDropdownBtn');
    if (menu && !e.target.closest('.profile-dropdown')) {
        menu.classList.remove('active');
        if (dropdown) dropdown.classList.remove('open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    const navMenu = document.getElementById('navLinks') || document.getElementById('navCenter') || document.querySelector('.nav-links') || document.querySelector('.nav-center');
    const toggleBtn = document.getElementById('mobileNavToggle');
    if (navMenu && navMenu.classList.contains('mobile-open') && !e.target.closest('.nav-links') && !e.target.closest('.nav-center') && !e.target.closest('#mobileNavToggle')) {
        navMenu.classList.remove('mobile-open');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }
});

function handleLogout(e) {
    if (e) e.preventDefault();
    API.auth.logout();
    if (typeof showToast === 'function') {
        showToast('Logged out successfully', 'info');
    }
    setTimeout(() => {
        window.location.href = '/homepage.html';
    }, 300);
}

function highlightActiveNavLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links > a, .nav-center > a, .nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (path.endsWith(href) || (href.includes('museum') && path.includes('museum')) || (href === '/homepage.html' && (path === '/' || path === '/homepage.html' || path === '/pages/homepage.html')))) {
            link.classList.add('active');
        } else if (href && !href.startsWith('#')) {
            link.classList.remove('active');
        }
    });
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; max-width: 350px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    toast.style.cssText = 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastIn 0.3s ease; margin: 0;';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> <span>${escapeHTML(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

function formatCurrency(amount) {
    return '₹' + parseFloat(amount || 0).toFixed(0);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
