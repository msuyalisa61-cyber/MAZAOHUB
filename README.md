const regions = [
    'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara', 'Mbeya', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga', 'North Unguja', 'South Unguja', 'West Unguja', 'North Pemba', 'South Pemba'
];

const fallbackPrices = regions.flatMap((region, regionIndex) => {
    const cropCatalog = [
        { crop: 'Maize', base: 86000, icon: '◈' }, { crop: 'Rice', base: 178000, icon: '▦' },
        { crop: 'Beans', base: 245000, icon: '●' }, { crop: 'Wheat', base: 215000, icon: '▥' },
        { crop: 'Sorghum', base: 119000, icon: '▤' }, { crop: 'Millet', base: 132000, icon: '▤' },
        { crop: 'Cowpeas', base: 188000, icon: '●' }, { crop: 'Pigeon peas', base: 205000, icon: '●' },
        { crop: 'Groundnuts', base: 190000, icon: '●' }, { crop: 'Cassava', base: 76000, icon: '◆' },
        { crop: 'Sweet potatoes', base: 92000, icon: '◆' }, { crop: 'Potatoes', base: 126000, icon: '●' },
        { crop: 'Bananas', base: 110000, icon: '◒' }, { crop: 'Sugarcane', base: 108000, icon: '▥' },
        { crop: 'Cotton', base: 310000, icon: '✦' }, { crop: 'Coffee', base: 685000, icon: '●' },
        { crop: 'Tea', base: 420000, icon: '✦' }, { crop: 'Tobacco', base: 355000, icon: '◇' },
        { crop: 'Cashew nuts', base: 485000, icon: '✺' }, { crop: 'Sunflower', base: 142000, icon: '✺' },
        { crop: 'Sesame', base: 270000, icon: '●' }, { crop: 'Coconut', base: 102000, icon: '◉' },
        { crop: 'Cloves', base: 920000, icon: '✦' }, { crop: 'Horticultural produce', base: 98000, icon: '✿' }
    ];

    return cropCatalog.map((item, cropIndex) => {
        const price = Math.round((item.base * (0.88 + (regionIndex % 8) * 0.035)) / 1000) * 1000;
        const changeValue = ((regionIndex * 3 + cropIndex * 2) % 17 - 5) / 10;
        return {
            crop: item.crop,
            region,
            price,
            change: `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(1)}%`,
            trend: changeValue >= 0 ? 'up' : 'down',
            icon: item.icon,
            updatedAt: new Date().toISOString(),
            source: 'fallback'
        };
    });
});

const grid = document.querySelector('#price-grid');
const regionFilter = document.querySelector('#region-filter');
const submissionRegion = document.querySelector('#submission-region');
const modal = document.querySelector('#payment-modal');

regions.forEach(region => {
    regionFilter.insertAdjacentHTML('beforeend', `<option value="${region}">${region}</option>`);
    submissionRegion.insertAdjacentHTML('beforeend', `<option>${region}</option>`);
});

function renderPrices(prices) {
    const filtered = prices || [];
    grid.innerHTML = filtered.map(item => `
        <article class="price-card">
            <div class="crop-line">
                <div class="crop-icon">${item.icon || '✦'}</div>
                <span class="trend ${item.trend || 'up'}">${item.change || '+0.0%'}</span>
            </div>
            <h3 class="crop-name">${item.crop}</h3>
            <div class="location">${item.region} market</div>
            <div class="price">TZS ${Number(item.price).toLocaleString('en-TZ')} <small>/ 100 kg</small></div>
            <div class="updated">Updated today · 06:00 EAT</div>
        </article>
    `).join('');

    if (!filtered.length) {
        grid.innerHTML = '<p class="panel-intro">No price updates are available for this region yet.</p>';
    }
}

async function loadPrices(region = 'all') {
    try {
        const response = await fetch(`/api/prices?region=${encodeURIComponent(region)}`);
        if (!response.ok) throw new Error('Request failed');
        const { prices } = await response.json();
        renderPrices(prices);
    } catch (error) {
        renderPrices(region === 'all' ? fallbackPrices : fallbackPrices.filter(item => item.region === region));
    }
}

regionFilter.addEventListener('change', event => {
    loadPrices(event.target.value);
});

async function bootstrap() {
    await loadPrices('all');
    try {
        const response = await fetch('/api/regions');
        if (!response.ok) return;
        const { regions: apiRegions } = await response.json();
        if (Array.isArray(apiRegions) && apiRegions.length) {
            regionFilter.innerHTML = '<option value="all">All Tanzania</option>';
            submissionRegion.innerHTML = '<option value="">Choose region</option>';
            apiRegions.forEach(region => {
                regionFilter.insertAdjacentHTML('beforeend', `<option value="${region}">${region}</option>`);
                submissionRegion.insertAdjacentHTML('beforeend', `<option>${region}</option>`);
            });
        }
    } catch (error) {
        // silently fall back
    }
}

bootstrap();

document.querySelector('#price-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
        const response = await fetch('/api/prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        const message = document.querySelector('#form-message');
        message.textContent = result.message || 'Thank you. Your price update has been received for review.';
        message.classList.add('show');
        if (response.ok) {
            form.reset();
            await loadPrices(regionFilter.value);
        }
    } catch (error) {
        const message = document.querySelector('#form-message');
        message.textContent = 'Unable to send price update right now. Please try again.';
        message.classList.add('show');
    }
});

document.querySelector('#open-payment').addEventListener('click', () => modal.classList.add('open'));
document.querySelector('#close-payment').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', event => {
    if (event.target === modal) modal.classList.remove('open');
});

document.querySelector('#payment-form').addEventListener('submit', event => {
    event.preventDefault();
    const message = document.querySelector('#payment-message');
    message.textContent = 'Prototype payment accepted. Daily alert subscription is ready.';
    message.classList.add('show');
    setTimeout(() => modal.classList.remove('open'), 900);
});

