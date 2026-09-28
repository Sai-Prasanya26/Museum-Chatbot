/* ==========================================================
   Famous Museums in India - Museums Catalog Script
   Clean UI with Internal URL-Based Category Classification
   ========================================================== */

let allMuseums = [];
let activeCategory = 'all';
let debounceTimer = null;

const VALID_CATEGORIES = new Set([
    'art-culture',
    'history-heritage',
    'science-technology',
    'archaeology'
]);

document.addEventListener('DOMContentLoaded', async () => {
    initFiltersFromURL();
    await loadStatesDropdown();
    await loadMuseums();
    setupEventListeners();
});

function getElements() {
    return {
        grid: document.getElementById('museumGrid') || document.getElementById('museumsGrid'),
        searchInput: document.getElementById('museumSearchInput') || document.getElementById('searchInput'),
        stateSelect: document.getElementById('stateFilterSelect') || document.getElementById('stateSelect'),
        noResults: document.getElementById('noResultsBox')
    };
}

function initFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('q') || params.get('search');
    const stateParam = params.get('state');
    const categoryParam = params.get('category') || params.get('cat');

    const { searchInput, stateSelect } = getElements();

    if (searchInput && searchParam) {
        searchInput.value = searchParam;
    }
    if (stateSelect && stateParam) {
        stateSelect.value = stateParam;
    }
    if (categoryParam && VALID_CATEGORIES.has(categoryParam)) {
        activeCategory = categoryParam;
    } else {
        activeCategory = 'all';
    }
}

async function loadStatesDropdown() {
    const { stateSelect } = getElements();
    if (!stateSelect) return;

    try {
        const res = await API.museums.getStates();
        const states = res.data || [];

        states.forEach(st => {
            const opt = document.createElement('option');
            opt.value = st;
            opt.textContent = st;
            stateSelect.appendChild(opt);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const stParam = urlParams.get('state');
        if (stParam) stateSelect.value = stParam;
    } catch (err) {
        console.error('Failed to load states dropdown:', err);
    }
}

async function loadMuseums() {
    const { grid, searchInput, stateSelect, noResults } = getElements();
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: #2962ff;"></i>
            <p style="margin-top: 10px;">Loading museums from database...</p>
        </div>
    `;

    const search = searchInput ? searchInput.value.trim() : '';
    const state = stateSelect ? stateSelect.value : '';

    try {
        const res = await API.museums.getAll({ search, state });
        allMuseums = res.data || [];

        applyCategoryFilterAndRender();
    } catch (err) {
        console.error('Failed to load museums from server:', err);
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">
                <p>Failed to load museums from server. Please ensure the backend is running.</p>
                <button class="book-btn" onclick="loadMuseums()" style="margin-top: 10px;">Retry</button>
            </div>
        `;
    }
}

function applyCategoryFilterAndRender() {
    const { grid, noResults } = getElements();
    if (!grid) return;

    const categoriesMap = window.MUSEUM_CATEGORIES || {};

    let filtered = allMuseums;
    if (activeCategory && activeCategory !== 'all') {
        filtered = allMuseums.filter(m => categoriesMap[m.id] === activeCategory);
    }

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
    } else {
        if (noResults) noResults.style.display = 'none';
        renderMuseumCards(filtered);
    }
}

function renderMuseumCards(museums) {
    const { grid } = getElements();
    if (!grid) return;

    grid.innerHTML = museums.map(m => {
        let imgPath = m.image || 'images/telangana.jpg';
        if (!imgPath.startsWith('http') && !imgPath.startsWith('/')) {
            imgPath = '/' + imgPath;
        }

        const bAdult = parseFloat(m.adult_price || 150);
        const startPrice = (m.starting_price !== undefined && m.starting_price !== null)
            ? m.starting_price
            : bAdult;

        return `
            <div class="museum-card" onclick="window.location.href='/pages/museum-details.html?id=${m.id}'" style="cursor: pointer;">
                <div class="museum-image">
                    <img src="${escapeHTML(imgPath)}" alt="${escapeHTML(m.name)}" onerror="this.onerror=null;this.src='/images/telangana.jpg';">
                </div>
                <div class="museum-info">
                    <h2><a href="/pages/museum-details.html?id=${m.id}" style="color: inherit; text-decoration: none;" onclick="event.stopPropagation();">${escapeHTML(m.name)}</a></h2>
                    <p>${escapeHTML(m.description || 'Famous museum showcasing historical collections, art, and cultural antiquities.')}</p>
                    <div class="location">📍 ${escapeHTML(m.city ? m.city + ', ' + m.state : m.state)}</div>
                    <div class="card-footer-action">
                        <span class="price-tag">Adult ₹${startPrice}</span>
                        <a href="/booking.html?museum_id=${m.id}" class="book-btn" onclick="event.stopPropagation();">Book Tickets</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    const { searchInput, stateSelect } = getElements();

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadMuseums();
            }, 300);
        });
    }

    if (stateSelect) {
        stateSelect.addEventListener('change', () => {
            loadMuseums();
        });
    }
}
