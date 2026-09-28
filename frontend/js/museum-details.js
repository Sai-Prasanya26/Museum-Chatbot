/* ==========================================================
   Museum Booking System - Professional Museum Details Script
   ========================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        window.location.href = '/museumpage.html';
        return;
    }

    await loadMuseumDetails(id);
});

async function loadMuseumDetails(id) {
    const container = document.getElementById('museumDetailContainer');
    if (!container) return;

    try {
        const res = await API.museums.getById(id);
        const m = res.data;

        // Set document title and update breadcrumb with exact museum name
        document.title = `${m.name} - Travel Explorer`;
        const breadcrumbTitle = document.getElementById('breadcrumbTitle');
        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = m.name;
        }

        // Format Image Path
        let imgPath = m.image || '';
        if (!imgPath.startsWith('http://') && !imgPath.startsWith('https://')) {
            imgPath = '/' + imgPath.replace(/^\/+/, '');
        }

        // Format Location
        const locationText = m.city ? `${m.city}, ${m.state}` : m.state;

        // Format Timings
        const openingTime = m.opening_time || '10:00 AM';
        const closingTime = m.closing_time || '05:00 PM';
        const hoursText = `${openingTime} – ${closingTime}`;

        // Authoritative Category Classification
        const catId = (typeof window.MUSEUM_CATEGORIES !== 'undefined' && window.MUSEUM_CATEGORIES[m.id]) || '';
        const catDef = (typeof window.CATEGORY_DEFINITIONS !== 'undefined' && window.CATEGORY_DEFINITIONS.find(c => c.id === catId));
        const categoryName = catDef ? catDef.name : 'Heritage Museum';

        container.innerHTML = `
            <!-- 1. Hero Image: Fixed, Consistent Aspect Ratio Landscape Presentation -->
            <div class="museum-hero-wrapper">
                <img src="${escapeHTML(imgPath)}" 
                     alt="${escapeHTML(m.name)}" 
                     class="museum-hero-img"
                     onerror="this.onerror=null;this.src='/assets/images/telangana.jpg';">
            </div>

            <!-- 2. Identity Section: Museum Title + Compact Metadata Bar -->
            <div class="museum-identity-section">
                <h1 class="museum-title">${escapeHTML(m.name)}</h1>
                <div class="museum-meta-bar">
                    <div class="meta-item">
                        <i class="fa-solid fa-location-dot meta-icon" aria-hidden="true"></i>
                        <span>${escapeHTML(locationText)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fa-solid fa-clock meta-icon" aria-hidden="true"></i>
                        <span>${escapeHTML(hoursText)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fa-solid fa-building-columns meta-icon" aria-hidden="true"></i>
                        <span>${escapeHTML(categoryName)}</span>
                    </div>
                </div>
            </div>

            <!-- 3. About the Museum Section (Preserves Exact Description) -->
            <section class="museum-section about-section">
                <h2 class="section-title">
                    <i class="fa-solid fa-book-open section-icon" aria-hidden="true"></i>
                    About the Museum
                </h2>
                <div class="museum-description">
                    <p>${escapeHTML(m.description || 'This iconic museum houses extensive collections of Indian heritage, archaeological discoveries, and fine arts.')}</p>
                </div>
            </section>

            <!-- 4. Visit Information Section (3 Responsive Cards Grid) -->
            <section class="museum-section visit-info-section">
                <h2 class="section-title">
                    <i class="fa-solid fa-circle-info section-icon" aria-hidden="true"></i>
                    Visit Information
                </h2>
                <div class="visit-cards-grid">
                    <!-- Card 1: Operating Hours -->
                    <div class="visit-card">
                        <div class="visit-card-header">
                            <i class="fa-solid fa-calendar-days card-header-icon" aria-hidden="true"></i>
                            <h3>Operating Hours</h3>
                        </div>
                        <div class="visit-card-body">
                            <div class="hours-highlight">
                                <span class="hours-time">${escapeHTML(openingTime)} – ${escapeHTML(closingTime)}</span>
                            </div>
                            <div class="schedule-rows">
                                <div class="schedule-row">
                                    <span class="schedule-label">Open:</span>
                                    <span class="schedule-value">Tuesday – Sunday</span>
                                </div>
                                <div class="schedule-row closed-day">
                                    <span class="schedule-label">Closed:</span>
                                    <span class="schedule-value">Monday and National Holidays</span>
                                </div>
                            </div>
                            <p class="card-footer-note">
                                <i class="fa-solid fa-circle-exclamation note-icon" aria-hidden="true"></i>
                                Ticket counter closes 30 minutes before closing time.
                            </p>
                        </div>
                    </div>

                    <!-- Card 2: Ticket Prices -->
                    <div class="visit-card">
                        <div class="visit-card-header">
                            <i class="fa-solid fa-ticket card-header-icon" aria-hidden="true"></i>
                            <h3>Ticket Prices</h3>
                        </div>
                        <div class="visit-card-body">
                            <div class="ticket-price-list">
                                <div class="ticket-price-row">
                                    <span class="ticket-category">Adult <small>(13–59 yrs)</small></span>
                                    <span class="ticket-rate">${formatCurrency(m.adult_price)}</span>
                                </div>
                                <div class="ticket-price-row">
                                    <span class="ticket-category">Child <small>(5–12 yrs)</small></span>
                                    <span class="ticket-rate">${formatCurrency(m.child_price)}</span>
                                </div>
                                <div class="ticket-price-row">
                                    <span class="ticket-category">Senior <small>(60+ yrs)</small></span>
                                    <span class="ticket-rate">${formatCurrency(m.senior_price)}</span>
                                </div>
                            </div>
                            <p class="card-footer-note">
                                <i class="fa-solid fa-circle-info note-icon" aria-hidden="true"></i>
                                Children under 5 enter free of charge. Valid ID required for seniors.
                            </p>
                        </div>
                    </div>

                    <!-- Card 3: Visitor Amenities -->
                    <div class="visit-card">
                        <div class="visit-card-header">
                            <i class="fa-solid fa-bell-concierge card-header-icon" aria-hidden="true"></i>
                            <h3>Visitor Amenities</h3>
                        </div>
                        <div class="visit-card-body">
                            <ul class="amenities-list">
                                <li>
                                    <i class="fa-solid fa-wheelchair amenity-icon" aria-hidden="true"></i>
                                    <span>Wheelchair Ramp & Elevator</span>
                                </li>
                                <li>
                                    <i class="fa-solid fa-headphones amenity-icon" aria-hidden="true"></i>
                                    <span>Audio Guides Available</span>
                                </li>
                                <li>
                                    <i class="fa-solid fa-mug-hot amenity-icon" aria-hidden="true"></i>
                                    <span>Cafeteria & Snacks</span>
                                </li>
                                <li>
                                    <i class="fa-solid fa-square-parking amenity-icon" aria-hidden="true"></i>
                                    <span>Visitor Parking</span>
                                </li>
                            </ul>
                            <p class="card-footer-note">
                                <i class="fa-solid fa-circle-info note-icon" aria-hidden="true"></i>
                                Facilities subject to daily operational availability.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 5. Book Tickets CTA Section (Dedicated Prominent Banner) -->
            <section class="booking-cta-banner">
                <div class="booking-cta-content">
                    <div class="booking-cta-text">
                        <h3>Ready to plan your visit?</h3>
                        <p>Book confirmed entry tickets online to skip the counter queue.</p>
                    </div>
                    <div class="booking-cta-action">
                        <a href="/pages/booking.html?museum_id=${m.id}" class="btn-book-now">
                            <i class="fa-solid fa-ticket" aria-hidden="true"></i>
                            <span>Book Tickets Now</span>
                        </a>
                    </div>
                </div>
            </section>

            <!-- 6. Virtual Reality Tour Section (Unobtrusive & Preserved) -->
            <section class="museum-section vr-tour-section">
                <div class="vr-card">
                    <div class="vr-card-icon">
                        <i class="fa-solid fa-vr-cardboard" aria-hidden="true"></i>
                    </div>
                    <div class="vr-card-info">
                        <h4>Explore Virtual Reality Tour</h4>
                        <p>Experience an immersive 360-degree virtual tour of this historic site on Google Earth.</p>
                    </div>
                    <div class="vr-card-btn">
                        <a href="https://earth.google.com/web/search/${encodeURIComponent(m.name + ' ' + (m.city || m.state))}" target="_blank" rel="noopener noreferrer" class="btn-vr-launch">
                            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                            <span>Launch 360° VR</span>
                        </a>
                    </div>
                </div>
            </section>
        `;
    } catch (err) {
        console.error('Failed to load museum details:', err);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation fa-3x" style="color: #ef4444; margin-bottom: 1rem;"></i>
                <h3 style="font-size: 1.3rem; margin-bottom: 0.5rem; color: #0f172a;">Museum Not Found</h3>
                <p style="color: #64748b; margin-bottom: 1.5rem;">The requested museum could not be loaded from the database.</p>
                <a href="/museumpage.html" class="btn-book-now" style="display: inline-flex; text-decoration: none;">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Return to Catalog</span>
                </a>
            </div>
        `;
    }
}
