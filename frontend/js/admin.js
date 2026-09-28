/* ==========================================================
   Museum Project - Admin Portal JavaScript
   Client-side controller for Admin Dashboard & Management
   ========================================================== */

let currentUser = null;
let cachedMuseums = [];
let cachedBookings = [];
let cachedUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAuth();
    loadDashboardStats();
    loadMuseums();
    loadBookings();
    loadUsers();
});

/**
 * 1. Security Check & Authorization Verification
 */
async function checkAdminAuth() {
    const token = API.getToken();
    if (!token) {
        window.location.href = '/pages/login.html?redirect=/pages/admin.html';
        return;
    }

    try {
        const res = await API.auth.getMe();
        currentUser = res.user;

        if (!currentUser || currentUser.role !== 'admin') {
            document.body.innerHTML = `
                <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: white; text-align: center; font-family: sans-serif; padding: 2rem;">
                    <div style="background: rgba(255,255,255,0.05); padding: 3rem; border-radius: 16px; max-width: 480px; border: 1px solid rgba(239, 68, 68, 0.4);">
                        <i class="fas fa-ban" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 1.5rem;"></i>
                        <h2 style="font-size: 1.8rem; margin-bottom: 0.75rem;">403 - Access Denied</h2>
                        <p style="color: #94a3b8; margin-bottom: 2rem;">Administrator privileges are required to access this portal.</p>
                        <a href="/homepage.html" style="display: inline-block; padding: 0.75rem 1.5rem; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Return to Homepage</a>
                    </div>
                </div>
            `;
            setTimeout(() => {
                window.location.href = '/homepage.html';
            }, 3000);
            return;
        }

        // Display user details
        const adminNameEl = document.getElementById('adminName');
        const adminAvatarEl = document.getElementById('adminAvatar');
        if (adminNameEl) adminNameEl.textContent = currentUser.username || 'Admin';
        if (adminAvatarEl) adminAvatarEl.textContent = (currentUser.username || 'A')[0].toUpperCase();

    } catch (err) {
        console.error('Failed to verify admin status:', err);
        API.removeToken();
        window.location.href = '/pages/login.html?redirect=/pages/admin.html';
    }
}

/**
 * 2. Section Navigation
 */
function switchSection(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));

    const targetNav = Array.from(document.querySelectorAll('.nav-item')).find(el => 
        el.getAttribute('onclick')?.includes(sectionId)
    );
    if (targetNav) targetNav.classList.add('active');

    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) targetSection.classList.add('active');

    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        overview: 'Overview',
        museums: 'Manage Museums',
        bookings: 'Customer Bookings',
        users: 'User Management'
    };
    if (pageTitle) pageTitle.textContent = titles[sectionId] || 'Admin Dashboard';

    // Close mobile sidebar if open
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.remove('open');
}

function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

/**
 * 3. Overview & Statistics
 */
async function loadDashboardStats() {
    try {
        const res = await API.admin.getStats();
        if (res.success && res.stats) {
            document.getElementById('statUsers').textContent = res.stats.totalUsers.toLocaleString();
            document.getElementById('statMuseums').textContent = res.stats.totalMuseums.toLocaleString();
            document.getElementById('statBookings').textContent = res.stats.totalBookings.toLocaleString();
            document.getElementById('statRevenue').textContent = '₹' + Number(res.stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        }

        const tbody = document.getElementById('recentBookingsTbody');
        if (!tbody) return;

        if (!res.recentBookings || res.recentBookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i><br>No recent bookings recorded.</td></tr>`;
            return;
        }

        tbody.innerHTML = res.recentBookings.map(b => {
            const statusClass = b.booking_status === 'CONFIRMED' ? 'badge-confirmed' :
                               (b.booking_status === 'CANCELLED' ? 'badge-cancelled' : 'badge-pending');
            const visitDate = b.visit_date ? new Date(b.visit_date).toLocaleDateString() : 'N/A';
            return `
                <tr>
                    <td><strong>${escapeHTML(b.booking_reference)}</strong></td>
                    <td>${escapeHTML(b.username || 'Visitor')}</td>
                    <td>${escapeHTML(b.museum_name || 'Museum')}</td>
                    <td>${visitDate}</td>
                    <td><strong>₹${parseFloat(b.total_price).toFixed(2)}</strong></td>
                    <td><span class="badge ${statusClass}">${escapeHTML(b.booking_status)}</span></td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

/**
 * 4. Museums Management
 */
async function loadMuseums() {
    try {
        const res = await API.admin.getMuseums();
        cachedMuseums = res.data || [];
        renderMuseumsTable(cachedMuseums);
    } catch (err) {
        console.error('Failed to load museums:', err);
        const tbody = document.getElementById('museumsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i><br>Failed to load museums.</td></tr>`;
        }
    }
}

function renderMuseumsTable(museums) {
    const tbody = document.getElementById('museumsTableBody');
    if (!tbody) return;

    if (!museums || museums.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-landmark"></i><br>No museums found.</td></tr>`;
        return;
    }

    tbody.innerHTML = museums.map(m => `
        <tr>
            <td>#${m.id}</td>
            <td>
                <strong>${escapeHTML(m.name)}</strong>
            </td>
            <td>${escapeHTML(m.city ? m.city + ', ' : '')}${escapeHTML(m.state)}</td>
            <td><small>${escapeHTML(m.opening_time || '09:00 AM')} - ${escapeHTML(m.closing_time || '05:30 PM')}</small></td>
            <td>₹${parseFloat(m.adult_price || 0).toFixed(2)}</td>
            <td>₹${parseFloat(m.child_price || 0).toFixed(2)}</td>
            <td>
                <div style="display: flex; gap: 0.4rem;">
                    <button class="btn-edit-sm" onclick="openEditMuseumModal(${m.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger-sm" onclick="handleDeleteMuseum(${m.id}, '${escapeHTML(m.name).replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function handleMuseumSearch() {
    const query = document.getElementById('museumSearchInput')?.value.toLowerCase().trim() || '';
    if (!query) {
        renderMuseumsTable(cachedMuseums);
        return;
    }
    const filtered = cachedMuseums.filter(m => 
        (m.name && m.name.toLowerCase().includes(query)) ||
        (m.city && m.city.toLowerCase().includes(query)) ||
        (m.state && m.state.toLowerCase().includes(query))
    );
    renderMuseumsTable(filtered);
}

function openAddMuseumModal() {
    document.getElementById('museumModalTitle').textContent = 'Add New Museum';
    document.getElementById('museumId').value = '';
    document.getElementById('museumForm').reset();
    document.getElementById('mOpen').value = '09:00 AM';
    document.getElementById('mClose').value = '05:30 PM';
    document.getElementById('mAdult').value = '150.00';
    document.getElementById('mChild').value = '75.00';
    document.getElementById('mSenior').value = '100.00';
    document.getElementById('mImage').value = 'assets/images/default.jpg';
    document.getElementById('museumModal').classList.add('active');
}

function openEditMuseumModal(id) {
    const museum = cachedMuseums.find(m => m.id === id);
    if (!museum) return;

    document.getElementById('museumModalTitle').textContent = 'Edit Museum';
    document.getElementById('museumId').value = museum.id;
    document.getElementById('mName').value = museum.name || '';
    document.getElementById('mState').value = museum.state || '';
    document.getElementById('mCity').value = museum.city || '';
    document.getElementById('mDesc').value = museum.description || '';
    document.getElementById('mOpen').value = museum.opening_time || '09:00 AM';
    document.getElementById('mClose').value = museum.closing_time || '05:30 PM';
    document.getElementById('mAdult').value = museum.adult_price || 150;
    document.getElementById('mChild').value = museum.child_price || 75;
    document.getElementById('mSenior').value = museum.senior_price || 100;
    document.getElementById('mImage').value = museum.image || 'assets/images/default.jpg';

    document.getElementById('museumModal').classList.add('active');
}

function closeMuseumModal() {
    document.getElementById('museumModal').classList.remove('active');
}

async function handleMuseumFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('museumId').value;
    const saveBtn = document.getElementById('saveMuseumBtn');

    const data = {
        name: document.getElementById('mName').value.trim(),
        state: document.getElementById('mState').value.trim(),
        city: document.getElementById('mCity').value.trim(),
        description: document.getElementById('mDesc').value.trim(),
        opening_time: document.getElementById('mOpen').value.trim(),
        closing_time: document.getElementById('mClose').value.trim(),
        adult_price: parseFloat(document.getElementById('mAdult').value) || 0,
        child_price: parseFloat(document.getElementById('mChild').value) || 0,
        senior_price: parseFloat(document.getElementById('mSenior').value) || 0,
        image: document.getElementById('mImage').value.trim() || 'assets/images/default.jpg'
    };

    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        if (id) {
            await API.admin.updateMuseum(id, data);
            showToast('Museum updated successfully!', 'success');
        } else {
            await API.admin.addMuseum(data);
            showToast('Museum added successfully!', 'success');
        }

        closeMuseumModal();
        await loadMuseums();
        await loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Operation failed', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Museum';
    }
}

async function handleDeleteMuseum(id, name) {
    if (!confirm(`Are you sure you want to delete museum "${name}"? This action cannot be undone.`)) {
        return;
    }

    try {
        await API.admin.deleteMuseum(id);
        showToast('Museum deleted successfully', 'success');
        await loadMuseums();
        await loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Failed to delete museum', 'error');
    }
}

/**
 * 5. Bookings Management
 */
async function loadBookings() {
    try {
        const res = await API.admin.getBookings();
        cachedBookings = res.data || [];
        filterBookings();
    } catch (err) {
        console.error('Failed to load bookings:', err);
        const tbody = document.getElementById('bookingsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i><br>Failed to load bookings.</td></tr>`;
        }
    }
}

function filterBookings() {
    const query = document.getElementById('bookingSearchInput')?.value.toLowerCase().trim() || '';
    const status = document.getElementById('bookingStatusFilter')?.value || 'ALL';

    let filtered = cachedBookings;

    if (status !== 'ALL') {
        filtered = filtered.filter(b => b.booking_status === status);
    }

    if (query) {
        filtered = filtered.filter(b => 
            (b.booking_reference && b.booking_reference.toLowerCase().includes(query)) ||
            (b.username && b.username.toLowerCase().includes(query)) ||
            (b.email && b.email.toLowerCase().includes(query)) ||
            (b.museum_name && b.museum_name.toLowerCase().includes(query))
        );
    }

    renderBookingsTable(filtered);
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><i class="fas fa-ticket-alt"></i><br>No bookings found.</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => {
        const statusClass = b.booking_status === 'CONFIRMED' ? 'badge-confirmed' :
                           (b.booking_status === 'CANCELLED' ? 'badge-cancelled' : 'badge-pending');
        const visitDate = b.visit_date ? new Date(b.visit_date).toLocaleDateString() : 'N/A';
        const totalTickets = (b.adult_count || 0) + (b.child_count || 0) + (b.senior_count || 0);

        return `
            <tr>
                <td><strong>${escapeHTML(b.booking_reference)}</strong></td>
                <td>
                    <div>${escapeHTML(b.username || 'Visitor')}</div>
                    <small style="color: #64748b;">${escapeHTML(b.email || '')}</small>
                </td>
                <td>
                    <div>${escapeHTML(b.museum_name)}</div>
                    <small style="color: #64748b;">${escapeHTML(b.museum_city ? b.museum_city + ', ' : '')}${escapeHTML(b.museum_state)}</small>
                </td>
                <td>${visitDate}</td>
                <td>${totalTickets} <small style="color: #64748b;">(${b.adult_count}A, ${b.child_count}C, ${b.senior_count}S)</small></td>
                <td><strong>₹${parseFloat(b.total_price).toFixed(2)}</strong></td>
                <td><span class="badge ${statusClass}">${escapeHTML(b.booking_status)}</span></td>
                <td>
                    <div style="display: flex; gap: 0.35rem;">
                        ${b.booking_status !== 'CONFIRMED' ? `
                            <button class="btn-edit-sm" onclick="handleUpdateBookingStatus(${b.id}, 'CONFIRMED')" title="Mark Confirmed">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${b.booking_status !== 'CANCELLED' ? `
                            <button class="btn-danger-sm" onclick="handleUpdateBookingStatus(${b.id}, 'CANCELLED')" title="Cancel Booking">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleUpdateBookingStatus(id, newStatus) {
    if (!confirm(`Are you sure you want to change booking #${id} status to ${newStatus}?`)) {
        return;
    }

    try {
        await API.admin.updateBookingStatus(id, newStatus);
        showToast(`Booking status updated to ${newStatus}`, 'success');
        await loadBookings();
        await loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Failed to update booking status', 'error');
    }
}

/**
 * 6. Users Management
 */
async function loadUsers() {
    try {
        const res = await API.admin.getUsers();
        cachedUsers = res.data || [];
        filterUsers();
    } catch (err) {
        console.error('Failed to load users:', err);
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i><br>Failed to load users.</td></tr>`;
        }
    }
}

function filterUsers() {
    const query = document.getElementById('userSearchInput')?.value.toLowerCase().trim() || '';
    let filtered = cachedUsers;

    if (query) {
        filtered = filtered.filter(u => 
            (u.username && u.username.toLowerCase().includes(query)) ||
            (u.email && u.email.toLowerCase().includes(query))
        );
    }

    renderUsersTable(filtered);
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-users"></i><br>No users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => {
        const isSelf = currentUser && currentUser.id === u.id;
        const roleBadge = u.role === 'admin' ? 'badge-admin' : 'badge-user';
        const regDate = u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A';

        return `
            <tr>
                <td>#${u.id}</td>
                <td><strong>${escapeHTML(u.username)}</strong> ${isSelf ? '<small style="color: #2563eb;">(You)</small>' : ''}</td>
                <td>${escapeHTML(u.email)}</td>
                <td><span class="badge ${roleBadge}">${escapeHTML(u.role)}</span></td>
                <td>${regDate}</td>
                <td>
                    ${!isSelf ? `
                        <button class="${u.role === 'admin' ? 'btn-danger-sm' : 'btn-edit-sm'}" onclick="handleToggleUserRole(${u.id}, '${u.role === 'admin' ? 'user' : 'admin'}', '${escapeHTML(u.username).replace(/'/g, "\\'")}')">
                            ${u.role === 'admin' ? '<i class="fas fa-user-minus"></i> Demote to User' : '<i class="fas fa-user-shield"></i> Promote to Admin'}
                        </button>
                    ` : '<span style="color: #94a3b8; font-size: 0.8rem;">Current Account</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

async function handleToggleUserRole(userId, newRole, username) {
    if (!confirm(`Are you sure you want to change "${username}" role to "${newRole}"?`)) {
        return;
    }

    try {
        await API.admin.updateUserRole(userId, newRole);
        showToast(`User role updated to ${newRole}`, 'success');
        await loadUsers();
    } catch (err) {
        showToast(err.message || 'Failed to update user role', 'error');
    }
}

/**
 * 7. Logout
 */
function handleAdminLogout() {
    API.auth.logout();
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
        window.location.href = '/pages/login.html';
    }, 400);
}

// Utility: HTML escape
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
