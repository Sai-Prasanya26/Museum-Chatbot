/* ==========================================================
   Museum Booking System - My Bookings Script
   ========================================================== */

let myBookings = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    await loadBookings();
});

async function loadBookings() {
    const listContainer = document.getElementById('bookingsList');
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
            <p style="margin-top: 1rem; color: var(--text-muted);">Retrieving your bookings...</p>
        </div>
    `;

    try {
        const res = await API.bookings.getMyBookings();
        myBookings = res.data || [];
        renderBookings(myBookings);
    } catch (err) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                <h3>Unable to load bookings</h3>
                <p>${escapeHTML(err.message || 'Error communicating with server')}</p>
                <button class="btn btn-outline" onclick="loadBookings()">Retry</button>
            </div>
        `;
    }
}

function renderBookings(bookings) {
    const listContainer = document.getElementById('bookingsList');
    if (!listContainer) return;

    if (!bookings || bookings.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <h3>No Bookings Found</h3>
                <p>You haven't made any museum bookings yet. Discover India's rich cultural heritage and book your first visit today!</p>
                <a href="/pages/museums.html" class="btn btn-primary btn-sm">Explore Museums</a>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = bookings.map(b => {
        const isConfirmed = b.booking_status === 'CONFIRMED';
        const dateStr = formatDate(b.visit_date);
        const bookedOn = new Date(b.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        const visitors = [];
        if (b.adult_count > 0) visitors.push(`${b.adult_count} Adult(s)`);
        if (b.child_count > 0) visitors.push(`${b.child_count} Child(ren)`);
        if (b.senior_count > 0) visitors.push(`${b.senior_count} Senior(s)`);

        return `
            <div class="booking-card">
                <div class="booking-ref-block">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Booking Ref</span>
                    <div class="ref-num">${escapeHTML(b.booking_reference)}</div>
                    <div class="booking-date">Booked on ${bookedOn}</div>
                </div>

                <div class="booking-info-block">
                    <h3>${escapeHTML(b.museum_name)}</h3>
                    <div class="visit-info">
                        <i class="fas fa-calendar-check" style="color: var(--primary);"></i>
                        <strong>Date of Visit:</strong> ${dateStr}
                    </div>
                    <div class="visitors-breakdown">
                        <i class="fas fa-users" style="color: var(--text-muted); margin-right: 4px;"></i>
                        ${visitors.join(', ')}
                    </div>
                </div>

                <div class="booking-status-block">
                    <span class="status-badge status-${b.booking_status}">
                        ${isConfirmed ? '<i class="fas fa-check"></i> Confirmed' : '<i class="fas fa-ban"></i> Cancelled'}
                    </span>
                    <div class="booking-total-price">${formatCurrency(b.total_price)}</div>
                    <div style="display: flex; gap: 0.4rem; margin-top: 0.4rem;">
                        <a href="/pages/booking-confirmation.html?ref=${encodeURIComponent(b.booking_reference)}" class="btn btn-outline btn-sm">
                            <i class="fas fa-ticket-alt"></i> View Ticket
                        </a>
                        ${isConfirmed ? `
                            <button onclick="handleCancelClick(${b.id}, '${escapeHTML(b.booking_reference)}')" class="btn btn-danger btn-sm">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function handleCancelClick(bookingId, reference) {
    const confirmCancel = confirm(`Are you sure you want to cancel booking ${reference}?\n\nThis will mark the ticket as cancelled and refund the transaction.`);
    if (!confirmCancel) return;

    try {
        await API.bookings.cancel(bookingId);
        showToast(`Booking ${reference} has been cancelled successfully.`, 'success');
        await loadBookings();
    } catch (err) {
        showToast(err.message || 'Failed to cancel booking', 'error');
    }
}
