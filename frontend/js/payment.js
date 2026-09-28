/* ==========================================================
   Museum Booking System - UPI-Only Verified Payment Script
   ========================================================== */

let checkoutData = null;
let upiConfig = {
    upi_id: 'museums.tickets@icici',
    qr_image: '/images/scanner.png',
    merchant_name: 'Museum Explorer Tickets'
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadPaymentConfig();
    loadCheckoutData();
    setupPaymentVerification();
});

async function loadPaymentConfig() {
    try {
        const res = await fetch('/api/payments/config');
        const data = await res.json();
        if (data.success && data.data) {
            upiConfig = data.data;
            const upiIdEl = document.getElementById('configuredUpiId');
            if (upiIdEl && upiConfig.upi_id) {
                upiIdEl.textContent = upiConfig.upi_id;
            }
            const qrImg = document.getElementById('paymentQrImg');
            if (qrImg && upiConfig.qr_image) {
                qrImg.src = upiConfig.qr_image;
            }
        }
    } catch (err) {
        console.warn('Could not load UPI config, using defaults:', err);
    }
}

function loadCheckoutData() {
    const raw = sessionStorage.getItem('pending_checkout');
    if (!raw) {
        if (typeof showToast === 'function') showToast('No active booking in progress', 'info');
        window.location.href = '/pages/museums.html';
        return;
    }

    try {
        checkoutData = JSON.parse(raw);

        const user = (typeof API !== 'undefined' && API.getUser && API.getUser()) ||
                     JSON.parse(localStorage.getItem('museum_user') || localStorage.getItem('user') || '{}');

        const custName = checkoutData.visitor_name || user.username || user.name || 'Visitor';
        const custEmail = checkoutData.visitor_email || user.email || 'visitor@example.com';

        document.getElementById('summaryMuseumName').textContent = checkoutData.museum_name;
        document.getElementById('summaryCustomerName').textContent = custName;
        document.getElementById('summaryCustomerEmail').textContent = custEmail;

        const dateStr = typeof formatDate === 'function' ? formatDate(checkoutData.visit_date) : checkoutData.visit_date;
        document.getElementById('summaryDate').textContent = dateStr;

        const totalFormatted = typeof formatCurrency === 'function'
            ? formatCurrency(checkoutData.total_price)
            : '₹' + checkoutData.total_price;
        document.getElementById('summaryTotal').textContent = totalFormatted;

        const breakdown = [];
        if (checkoutData.adult_count > 0) breakdown.push(`${checkoutData.adult_count} Adult(s)`);
        if (checkoutData.child_count > 0) breakdown.push(`${checkoutData.child_count} Child(ren)`);
        if (checkoutData.senior_count > 0) breakdown.push(`${checkoutData.senior_count} Senior(s)`);
        document.getElementById('summaryVisitors').textContent = breakdown.join(', ');

        const titleEl = document.getElementById('paymentHeaderTitle');
        if (titleEl) {
            titleEl.textContent = `${checkoutData.museum_name} - Booking & Payment`;
        }

        setPaymentBadge('PENDING');
    } catch (e) {
        sessionStorage.removeItem('pending_checkout');
        window.location.href = '/pages/museums.html';
    }
}

function setupPaymentVerification() {
    const btn = document.getElementById('confirmPayBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        if (!checkoutData) return;

        const txnInput = document.getElementById('upiTxnId');
        const txnId = txnInput ? txnInput.value.trim() : '';
        const alertEl = document.getElementById('paymentAlert');

        // Requirement 3 & 4 (TEST 1): User clicks confirm without payment
        if (!txnId) {
            setPaymentBadge('PENDING');
            if (alertEl) {
                alertEl.style.color = '#dc2626';
                alertEl.textContent = 'Payment has not been verified. Please complete the UPI payment before confirming your booking.';
            }
            if (typeof showToast === 'function') {
                showToast('Payment has not been verified. Please complete payment.', 'error');
            }
            if (txnInput) txnInput.focus();
            return;
        }

        try {
            setPaymentBadge('PAYMENT PROCESSING');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Payment with Banking Network...';
            if (alertEl) {
                alertEl.style.color = '#2563eb';
                alertEl.textContent = 'Verifying UPI transaction with authoritative backend...';
            }

            const user = (typeof API !== 'undefined' && API.getUser && API.getUser()) ||
                         JSON.parse(localStorage.getItem('museum_user') || localStorage.getItem('user') || '{}');

            const payload = {
                payment_intent_id: checkoutData.payment_intent_id || null,
                transaction_id: txnId,
                museum_id: checkoutData.museum_id,
                visit_date: checkoutData.visit_date,
                adult_count: checkoutData.adult_count,
                child_count: checkoutData.child_count,
                senior_count: checkoutData.senior_count,
                visitor_name: checkoutData.visitor_name || user.username || user.name || 'Visitor',
                visitor_email: checkoutData.visitor_email || user.email || 'visitor@example.com',
                visitor_phone: checkoutData.visitor_phone || ''
            };

            const token = (typeof API !== 'undefined' && API.getToken && API.getToken()) ||
                          localStorage.getItem('museum_token') || localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }

            const res = await fetch('/api/payments/verify', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success && data.data) {
                setPaymentBadge('PAYMENT VERIFIED');
                if (alertEl) {
                    alertEl.style.color = '#16a34a';
                    alertEl.textContent = 'Payment verified successfully! Confirming booking...';
                }

                sessionStorage.removeItem('pending_checkout');
                if (typeof showToast === 'function') {
                    showToast('Payment verified successfully! Booking confirmed.', 'success');
                }

                setTimeout(() => {
                    window.location.href = `/pages/booking-confirmation.html?ref=${encodeURIComponent(data.data.booking_reference)}`;
                }, 700);

            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-shield-alt"></i> Verify Payment & Confirm Booking';

                if (data.payment_status === 'PENDING' || (data.message && data.message.includes('pending'))) {
                    setPaymentBadge('PENDING');
                    if (alertEl) {
                        alertEl.style.color = '#d97706';
                        alertEl.textContent = data.message || 'Payment is still pending. Please complete the payment and try again.';
                    }
                } else {
                    setPaymentBadge('PAYMENT FAILED');
                    if (alertEl) {
                        alertEl.style.color = '#dc2626';
                        alertEl.textContent = data.message || 'Payment could not be verified. Your booking has not been confirmed.';
                    }
                }
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-shield-alt"></i> Verify Payment & Confirm Booking';
            setPaymentBadge('PAYMENT FAILED');
            if (alertEl) {
                alertEl.style.color = '#dc2626';
                alertEl.textContent = 'Payment could not be verified. Your booking has not been confirmed.';
            }
        }
    });
}

function setPaymentBadge(state) {
    const badge = document.getElementById('paymentStatusBadge');
    if (!badge) return;

    badge.className = 'status-badge-custom';
    if (state === 'PENDING') {
        badge.classList.add('status-pending');
        badge.textContent = 'Pending Payment';
    } else if (state === 'PAYMENT PROCESSING') {
        badge.classList.add('status-processing');
        badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else if (state === 'PAYMENT VERIFIED') {
        badge.classList.add('status-verified');
        badge.innerHTML = '<i class="fas fa-check-circle"></i> Payment Verified';
    } else if (state === 'PAYMENT FAILED') {
        badge.classList.add('status-failed');
        badge.innerHTML = '<i class="fas fa-times-circle"></i> Payment Failed';
    }
}

function copyUpiId() {
    const upiId = document.getElementById('configuredUpiId')?.textContent || upiConfig.upi_id;
    navigator.clipboard.writeText(upiId).then(() => {
        if (typeof showToast === 'function') {
            showToast('UPI ID copied to clipboard: ' + upiId, 'success');
        } else {
            alert('UPI ID copied to clipboard: ' + upiId);
        }
    }).catch(() => {
        prompt('Copy this UPI ID:', upiId);
    });
}
