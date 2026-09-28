/* ==========================================================
   Museum Booking System - Ticket Booking Script
   ========================================================== */

let selectedMuseum = null;
let counts = {
    adult: 1,
    child: 0,
    senior: 0
};

document.addEventListener('DOMContentLoaded', async () => {
    // Require user login for booking
    if (!requireAuth()) return;

    const params = new URLSearchParams(window.location.search);
    const museumId = params.get('museum_id');

    if (!museumId) {
        showToast('Please select a museum to book tickets', 'info');
        window.location.href = '/pages/museums.html';
        return;
    }

    initDatePicker();
    await loadMuseumData(museumId);
    setupCounterHandlers();
    setupFormSubmission();
});

function initDatePicker() {
    const dateInput = document.getElementById('visitDate');
    if (!dateInput) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    dateInput.min = todayStr;
    dateInput.value = todayStr;

    // Optional: max date up to 90 days in future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    dateInput.max = maxDate.toISOString().split('T')[0];

    dateInput.addEventListener('change', updateSummary);
}

async function loadMuseumData(museumId) {
    try {
        const res = await API.museums.getById(museumId);
        selectedMuseum = res.data;

        // Populate banner
        document.getElementById('museumName').textContent = selectedMuseum.name;
        document.getElementById('museumLocation').textContent = `${selectedMuseum.city || ''}, ${selectedMuseum.state}`;
        document.getElementById('museumHours').textContent = `${selectedMuseum.opening_time} - ${selectedMuseum.closing_time}`;

        const img = document.getElementById('museumImage');
        if (img) {
            const imgPath = selectedMuseum.image.startsWith('http') ? selectedMuseum.image : `/${selectedMuseum.image}`;
            img.src = imgPath;
            img.onerror = () => { img.src = '/assets/images/telangana.jpg'; };
        }

        // Set ticket price badges
        document.getElementById('adultPriceBadge').textContent = formatCurrency(selectedMuseum.adult_price);
        document.getElementById('childPriceBadge').textContent = formatCurrency(selectedMuseum.child_price);
        document.getElementById('seniorPriceBadge').textContent = formatCurrency(selectedMuseum.senior_price);

        updateSummary();
    } catch (err) {
        showToast('Failed to load museum details for booking', 'error');
        setTimeout(() => {
            window.location.href = '/pages/museums.html';
        }, 1500);
    }
}

function setupCounterHandlers() {
    document.querySelectorAll('.counter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = btn.getAttribute('data-type');
            const delta = parseInt(btn.getAttribute('data-delta'), 10);
            updateCount(type, delta);
        });
    });
}

function updateCount(type, delta) {
    if (!counts.hasOwnProperty(type)) return;

    const newCount = counts[type] + delta;
    if (newCount < 0) return;

    // Ensure total visitors not exceeding 20 per booking
    const projectedTotal = (counts.adult + counts.child + counts.senior) - counts[type] + newCount;
    if (projectedTotal > 20) {
        showToast('Maximum 20 tickets allowed per online booking transaction', 'info');
        return;
    }

    counts[type] = newCount;

    const countElem = document.getElementById(`${type}Count`);
    if (countElem) {
        countElem.textContent = counts[type];
    }

    updateSummary();
}

function updateSummary() {
    if (!selectedMuseum) return;

    const adultTotal = counts.adult * parseFloat(selectedMuseum.adult_price);
    const childTotal = counts.child * parseFloat(selectedMuseum.child_price);
    const seniorTotal = counts.senior * parseFloat(selectedMuseum.senior_price);
    const grandTotal = adultTotal + childTotal + seniorTotal;

    // Update summary table lines
    const summaryAdult = document.getElementById('summaryAdult');
    const summaryChild = document.getElementById('summaryChild');
    const summarySenior = document.getElementById('summarySenior');
    const summaryTotal = document.getElementById('summaryTotal');
    const visitDate = document.getElementById('visitDate')?.value;
    const summaryDate = document.getElementById('summaryDate');

    if (summaryDate && visitDate) {
        summaryDate.textContent = formatDate(visitDate);
    }

    if (summaryAdult) {
        summaryAdult.innerHTML = `<span>Adults (${counts.adult} × ${formatCurrency(selectedMuseum.adult_price)})</span> <strong>${formatCurrency(adultTotal)}</strong>`;
        summaryAdult.style.display = counts.adult > 0 ? 'flex' : 'none';
    }

    if (summaryChild) {
        summaryChild.innerHTML = `<span>Children (${counts.child} × ${formatCurrency(selectedMuseum.child_price)})</span> <strong>${formatCurrency(childTotal)}</strong>`;
        summaryChild.style.display = counts.child > 0 ? 'flex' : 'none';
    }

    if (summarySenior) {
        summarySenior.innerHTML = `<span>Seniors (${counts.senior} × ${formatCurrency(selectedMuseum.senior_price)})</span> <strong>${formatCurrency(seniorTotal)}</strong>`;
        summarySenior.style.display = counts.senior > 0 ? 'flex' : 'none';
    }

    if (summaryTotal) {
        summaryTotal.textContent = formatCurrency(grandTotal);
    }

    const proceedBtn = document.getElementById('proceedToPaymentBtn');
    if (proceedBtn) {
        const totalVisitors = counts.adult + counts.child + counts.senior;
        proceedBtn.disabled = totalVisitors < 1;
        proceedBtn.innerHTML = totalVisitors < 1
            ? 'Select at least 1 ticket'
            : `<i class="fas fa-lock"></i> Proceed to Payment • ${formatCurrency(grandTotal)}`;
    }
}

function setupFormSubmission() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const totalVisitors = counts.adult + counts.child + counts.senior;
        if (totalVisitors < 1) {
            showToast('Please select at least one ticket', 'error');
            return;
        }

        const visitDate = document.getElementById('visitDate').value;
        if (!visitDate) {
            showToast('Please select a valid visit date', 'error');
            return;
        }

        // Store checkout state in sessionStorage for payment.html
        const checkoutData = {
            museum_id: selectedMuseum.id,
            museum_name: selectedMuseum.name,
            museum_city: selectedMuseum.city,
            museum_state: selectedMuseum.state,
            visit_date: visitDate,
            adult_count: counts.adult,
            child_count: counts.child,
            senior_count: counts.senior,
            adult_price: selectedMuseum.adult_price,
            child_price: selectedMuseum.child_price,
            senior_price: selectedMuseum.senior_price,
            total_price: (counts.adult * selectedMuseum.adult_price) + (counts.child * selectedMuseum.child_price) + (counts.senior * selectedMuseum.senior_price)
        };

        sessionStorage.setItem('pending_checkout', JSON.stringify(checkoutData));
        window.location.href = '/pages/payment.html';
    });
}
