/* ==========================================================
   Museum Booking System - Booking Confirmation Script
   ========================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (!ref) {
        showToast('No booking reference provided', 'error');
        setTimeout(() => {
            window.location.href = '/pages/mybookings.html';
        }, 1500);
        return;
    }

    await loadBookingDetails(ref);
});

async function loadBookingDetails(ref) {
    const card = document.getElementById('ticketCard');
    const loadingElem = document.getElementById('loadingState');

    try {
        const res = await API.bookings.getByReference(ref);
        const b = res.data;

        if (loadingElem) loadingElem.style.display = 'none';
        if (card) card.style.display = 'block';

        // Populate elements
        document.getElementById('ticketRef').textContent = b.booking_reference;
        document.getElementById('ticketMuseum').textContent = b.museum_name;
        document.getElementById('ticketLocation').textContent = `${b.museum_city ? b.museum_city + ', ' : ''}${b.museum_state}`;
        document.getElementById('ticketDate').textContent = formatDate(b.visit_date);
        document.getElementById('ticketBookedOn').textContent = new Date(b.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const visitors = [];
        if (b.adult_count > 0) visitors.push(`${b.adult_count} Adult(s)`);
        if (b.child_count > 0) visitors.push(`${b.child_count} Child(ren)`);
        if (b.senior_count > 0) visitors.push(`${b.senior_count} Senior(s)`);
        document.getElementById('ticketVisitors').textContent = visitors.join(', ');

        document.getElementById('ticketTotal').textContent = formatCurrency(b.total_price);
        document.getElementById('ticketPaymentMethod').textContent = b.payment_method || 'UPI';
        document.getElementById('ticketStatus').textContent = b.booking_status;

        if (b.transaction_reference) {
            document.getElementById('ticketTxnRef').textContent = b.transaction_reference;
        } else {
            document.getElementById('ticketTxnRow').style.display = 'none';
        }

        // PDF Download & Print listeners
        const pdfBtn = document.getElementById('downloadPdfBtn');
        if (pdfBtn) {
            pdfBtn.href = `/api/bookings/reference/${encodeURIComponent(b.booking_reference)}/pdf`;
        }

        const printBtn = document.getElementById('printTicketBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    } catch (err) {
        if (loadingElem) {
            loadingElem.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: var(--danger); font-size: 2.5rem;"></i>
                    <h3 style="margin-top: 1rem;">Booking Not Found</h3>
                    <p>${escapeHTML(err.message || 'Unable to retrieve ticket details')}</p>
                    <a href="/pages/mybookings.html" class="btn btn-primary btn-sm" style="margin-top: 1rem;">View My Bookings</a>
                </div>
            `;
        }
    }
}
