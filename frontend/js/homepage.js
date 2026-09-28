/* ==========================================================
   Museum Booking System - Homepage Script
   Authentic Original UI with Dynamic MySQL Integration
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    initHeroSearch();
    loadFeaturedMuseums();
});

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator, .slide-dot');
    if (!slides.length) return;

    let currentSlide = 0;
    let slideInterval = null;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        indicators.forEach((ind, i) => {
            ind.classList.toggle('active', i === index);
        });
        currentSlide = index;
    }

    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function startTimer() {
        stopTimer();
        slideInterval = setInterval(nextSlide, 4500);
    }

    function stopTimer() {
        if (slideInterval) clearInterval(slideInterval);
    }

    indicators.forEach((ind, idx) => {
        ind.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            stopTimer();
            showSlide(idx);
            startTimer();
        });
    });

    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('mouseenter', stopTimer);
        hero.addEventListener('mouseleave', startTimer);
    }

    // Expose goToSlide globally for inline onclick handlers if present
    window.goToSlide = function(idx) {
        stopTimer();
        showSlide(idx);
        startTimer();
    };

    startTimer();
}

function initHeroSearch() {
    const form = document.getElementById('heroSearchForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('heroSearchInput');
        const query = input ? input.value.trim() : '';
        if (query) {
            window.location.href = `/museumpage.html?search=${encodeURIComponent(query)}`;
        } else {
            window.location.href = '/museumpage.html';
        }
    });
}

async function loadFeaturedMuseums() {
    const grid = document.getElementById('featuredMuseumsGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary-color, #FF9933);"></i>
            <p style="margin-top: 12px; font-size: 0.95rem;">Loading featured museums from database...</p>
        </div>
    `;

    try {
        let res;
        if (typeof API !== 'undefined' && API.museums && API.museums.getAll) {
            res = await API.museums.getAll({ limit: 6 });
        } else {
            const raw = await fetch('/api/museums?limit=6');
            res = await raw.json();
        }

        const museums = res.data || [];

        if (!museums || museums.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #64748b;">
                    <p>No featured museums available at this moment.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = museums.map(m => {
            let img = m.image || '/images/telangana.jpg';
            if (!img.startsWith('http') && !img.startsWith('/')) {
                img = '/' + img;
            }
            const locationStr = m.city ? `${m.city}, ${m.state}` : m.state;
            const bAdult = parseFloat(m.adult_price || 150);
            const startPrice = (m.starting_price !== undefined && m.starting_price !== null)
                ? m.starting_price
                : bAdult;
            const priceLabel = `Adult ₹${startPrice}`;
            const desc = m.description || 'Famous museum showcasing historical collections, art, and cultural antiquities.';

            const escapeFn = typeof escapeHTML === 'function' ? escapeHTML : (s => s || '');

            return `
                <div class="featured-card" onclick="window.location.href='/pages/museum-details.html?id=${m.id}'" style="cursor: pointer;">
                    <div class="card-thumb-wrap">
                        <img src="${escapeFn(img)}" alt="${escapeFn(m.name)}" class="card-thumb" onerror="this.onerror=null;this.src='/images/telangana.jpg';">
                        <span class="card-state-badge">${escapeFn(m.state)}</span>
                    </div>
                    <div class="card-body">
                        <h3><a href="/pages/museum-details.html?id=${m.id}" style="color: inherit; text-decoration: none;" onclick="event.stopPropagation();">${escapeFn(m.name)}</a></h3>
                        <div class="card-location"><i class="fas fa-map-marker-alt"></i> ${escapeFn(locationStr)}</div>
                        <p class="card-desc">${escapeFn(desc)}</p>
                        <div class="card-footer">
                            <div class="card-price">${priceLabel}</div>
                            <a href="/booking.html?museum_id=${m.id}" class="card-btn" onclick="event.stopPropagation();">
                                <i class="fas fa-ticket-alt"></i> Book Tickets
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Failed to load featured museums:', err);
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #ef4444;">
                <p>Failed to load featured museums from database.</p>
                <button onclick="loadFeaturedMuseums()" class="card-btn" style="margin-top: 10px; cursor: pointer; border: none;">Retry</button>
            </div>
        `;
    }
}
