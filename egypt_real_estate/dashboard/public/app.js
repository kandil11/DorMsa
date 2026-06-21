/* ──────────────────────────────────────────────────────────────
   Egypt Real Estate Dashboard  —  app.js
   ────────────────────────────────────────────────────────────── */

const API = '';   // same origin

// ── State ─────────────────────────────────────────────────────
let state = {
  page: 1, limit: 24,
  area: 'all', category: 'all', source: 'all', beds: 'all',
  minPrice: '', maxPrice: '',
  search: '', sort: 'scraped_at', order: 'desc',
  totalPages: 1, totalListings: 0,
};

// ── DOM refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const grid         = $('listingsGrid');
const pagination   = $('pagination');
const resultsCount = $('resultsCount');

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadListings();
  bindFilters();
  bindViewToggle();
  bindModal();
});

// ── Stats ─────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch(`${API}/api/stats`);
    const data = await res.json();

    $('st-total').textContent   = data.total?.toLocaleString() ?? '—';
    $('totalBadge').textContent = `${data.total?.toLocaleString() ?? '?'} listings`;
    $('st-areas').textContent   = Object.keys(data.byArea || {}).length;
    $('st-sources').textContent = Object.keys(data.bySource || {}).length;

    const avg = data.priceStats?.avgPrice;
    $('st-avg').textContent = avg
      ? Math.round(avg).toLocaleString()
      : '—';

    $('dbStatus').innerHTML = '<span class="dot dot-pulse"></span> Live';

    // Source pills
    const pills = $('sourcePills');
    const cls   = { 'bayut.eg': 'bayut', 'dubizzle.com.eg': 'dubizzle', 'propertyfinder.eg': 'pf' };
    for (const [src, cnt] of Object.entries(data.bySource || {})) {
      const el = document.createElement('span');
      el.className = `src-pill ${cls[src] || ''}`;
      el.textContent = `${src}  ·  ${cnt.toLocaleString()}`;
      pills.appendChild(el);
    }

    // Mini charts
    renderMiniChart('catChart', data.byCategory || {}, data.total);
    renderMiniChart('srcChart', data.bySource   || {}, data.total);

  } catch (e) {
    $('dbStatus').innerHTML = '<span class="dot dot-error"></span> Offline';
    showToast('⚠ Could not connect to backend', 'error');
  }
}

function renderMiniChart(containerId, obj, total) {
  const el  = $(containerId);
  const max = Math.max(...Object.values(obj), 1);
  el.innerHTML = Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `
      <div class="mini-bar-row">
        <span class="mini-bar-label" title="${k}">${k || 'unknown'}</span>
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width:${(v / max * 100).toFixed(1)}%"></div>
        </div>
        <span class="mini-bar-count">${v}</span>
      </div>`)
    .join('');
}

// ── Listings ──────────────────────────────────────────────────
async function loadListings() {
  grid.innerHTML = skeletons(12);
  pagination.innerHTML = '';

  const params = new URLSearchParams({
    page:     state.page,
    limit:    state.limit,
    area:     state.area,
    category: state.category,
    source:   state.source,
    beds:     state.beds,
    sort:     state.sort.replace(/^-/, ''),
    order:    state.sort.startsWith('-') ? 'asc' : state.order,
  });
  if (state.minPrice) params.set('minPrice', state.minPrice);
  if (state.maxPrice) params.set('maxPrice', state.maxPrice);
  if (state.search)   params.set('search',   state.search);

  try {
    const res  = await fetch(`${API}/api/listings?${params}`);
    const data = await res.json();

    state.totalPages    = data.pages    || 1;
    state.totalListings = data.total    || 0;
    state.page          = data.page     || 1;

    resultsCount.innerHTML = `Showing <strong>${data.listings?.length ?? 0}</strong> of <strong>${data.total?.toLocaleString()}</strong> listings`;

    if (!data.listings?.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No listings matched your filters. Try adjusting them.</p>
        </div>`;
    } else {
      grid.innerHTML = data.listings.map(cardHTML).join('');
      // Attach click handlers
      grid.querySelectorAll('.card').forEach(el => {
        el.addEventListener('click', e => {
          if (e.target.classList.contains('card-link')) return;
          openModal(el.dataset.id);
        });
      });
    }

    renderPagination();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Failed to load listings. Is the server running?</p></div>`;
  }
}

// ── Card HTML ─────────────────────────────────────────────────
function cardHTML(l) {
  const srcKey = l.source?.includes('bayut') ? 'bayut'
               : l.source?.includes('dubizzle') ? 'dubizzle' : 'pf';
  const srcBadge = `<span class="card-source-badge badge-${srcKey}">${l.source?.split('.')[0] ?? 'n/a'}</span>`;

  const typeIcon = l.prop_category === 'villa'  ? '🏡'
                 : l.prop_category === 'studio' ? '🛏'
                 : '🏢';

  const areaClass = l.area === '6th_of_october' ? 'area-6th' : 'area-szyd';
  const areaLabel = l.area === '6th_of_october' ? '6th Oct' : 'Sheikh Zayed';

  const price = l.price?.amount_egp
    ? `<span class="price-amount">EGP ${l.price.amount_egp.toLocaleString()}</span>
       <span class="price-period">/ ${l.price.period ?? ''}</span>`
    : `<span class="price-amount" style="color:var(--muted)">Price N/A</span>`;

  const chips = [
    l.bedrooms  != null ? `🛏 ${l.bedrooms} Bed${l.bedrooms !== 1 ? 's' : ''}` : null,
    l.bathrooms != null ? `🚿 ${l.bathrooms} Bath` : null,
    l.area_sqm  != null ? `📐 ${l.area_sqm} m²` : null,
    l.furnished === true ? '✨ Furnished' : null,
  ].filter(Boolean).map(c => `<span class="meta-chip">${c}</span>`).join('');

  const title = l.title
    ? `<div class="card-title">${esc(l.title)}</div>`
    : `<div class="card-title no-title">No title available</div>`;

  const loc = l.compound || l.location || '';

  const date = l.scraped_at
    ? new Date(l.scraped_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' })
    : '';

  const extLink = l.url
    ? `<a class="card-link" href="${l.url}" target="_blank" rel="noopener">View ↗</a>`
    : '';

  return `
    <div class="card" data-id="${l._id}">
      ${srcBadge}
      <div style="display:flex;gap:.6rem;align-items:center">
        <span class="card-type-icon">${typeIcon}</span>
        <span class="card-area-badge ${areaClass}">${areaLabel}</span>
      </div>
      ${title}
      <div class="card-price">${price}</div>
      <div class="card-meta">${chips || '<span class="meta-chip">No details</span>'}</div>
      ${loc ? `<div class="card-location">📍 ${esc(loc)}</div>` : ''}
      <div class="card-footer">
        <span class="scraped-at">${date}</span>
        ${extLink}
      </div>
    </div>`;
}

// ── Modal ─────────────────────────────────────────────────────
function bindModal() {
  $('modalClose').addEventListener('click', closeModal);
  $('modalOverlay').addEventListener('click', e => {
    if (e.target === $('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

async function openModal(id) {
  if (!id) return;
  $('modalOverlay').classList.add('open');
  $('modalContent').innerHTML = `<div class="skeleton" style="height:200px;border-radius:8px"></div>`;

  try {
    const res  = await fetch(`${API}/api/listings/${id}`);
    const l    = await res.json();
    renderModal(l);
  } catch {
    $('modalContent').innerHTML = `<p style="color:var(--red)">Failed to load listing details.</p>`;
  }
}

function renderModal(l) {
  const srcKey = l.source?.includes('bayut') ? 'bayut'
               : l.source?.includes('dubizzle') ? 'dubizzle' : 'pf';
  const typeIcon = l.prop_category === 'villa'  ? '🏡'
                 : l.prop_category === 'studio' ? '🛏' : '🏢';

  const fields = [
    ['Source',        l.source],
    ['Area',          l.area?.replace(/_/g,' ')],
    ['Category',      l.prop_category],
    ['Property Type', l.property_type],
    ['Bedrooms',      l.bedrooms],
    ['Bathrooms',     l.bathrooms],
    ['Size',          l.area_sqm ? `${l.area_sqm} m²` : null],
    ['Furnished',     l.furnished != null ? (l.furnished ? 'Yes' : 'No') : null],
    ['Compound',      l.compound],
    ['Location',      l.location],
    ['Posted',        l.posted_ago || l.listed_date],
    ['Scraped At',    l.scraped_at],
  ].filter(([,v]) => v != null);

  $('modalContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem">
      <span style="font-size:2rem">${typeIcon}</span>
      <span class="card-source-badge badge-${srcKey}" style="position:static">${l.source?.split('.')[0]}</span>
    </div>
    <div class="modal-title">${esc(l.title || 'No title available')}</div>
    <div class="modal-section">
      <div class="modal-price">EGP ${l.price?.amount_egp?.toLocaleString() ?? '—'}</div>
      <div class="modal-period">${l.price?.period ?? ''} ${l.price?.raw ? `· ${l.price.raw}` : ''}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Details</div>
      <div class="modal-grid">
        ${fields.map(([k,v]) => `
          <div class="modal-field">
            <div class="modal-field-label">${k}</div>
            <div class="modal-field-value">${esc(String(v))}</div>
          </div>`).join('')}
      </div>
    </div>
    ${l.url ? `<a class="modal-link" href="${l.url}" target="_blank" rel="noopener">Open Listing ↗</a>` : ''}
  `;
}

function closeModal() {
  $('modalOverlay').classList.remove('open');
}

// ── Pagination ────────────────────────────────────────────────
function renderPagination() {
  const { page, totalPages } = state;
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  const range = paginationRange(page, totalPages);
  pagination.innerHTML = [
    `<button class="page-btn" ${page===1?'disabled':''} onclick="goPage(${page-1})">‹ Prev</button>`,
    ...range.map(p =>
      p === '…'
        ? `<span class="page-btn" style="cursor:default">…</span>`
        : `<button class="page-btn ${p===page?'active':''}" onclick="goPage(${p})">${p}</button>`
    ),
    `<button class="page-btn" ${page===totalPages?'disabled':''} onclick="goPage(${page+1})">Next ›</button>`,
  ].join('');
}

function paginationRange(cur, total) {
  if (total <= 7) return Array.from({length:total},(_,i)=>i+1);
  const pages = [1];
  if (cur > 3)           pages.push('…');
  for (let p = Math.max(2,cur-1); p <= Math.min(total-1,cur+1); p++) pages.push(p);
  if (cur < total-2)     pages.push('…');
  pages.push(total);
  return pages;
}

function goPage(p) {
  state.page = p;
  loadListings();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Filters ───────────────────────────────────────────────────
function bindFilters() {
  let searchTimer;
  $('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page   = 1;
      loadListings();
    }, 400);
  });

  $('applyFilters').addEventListener('click', applyFilters);

  $('resetFilters').addEventListener('click', () => {
    ['areaFilter','categoryFilter','sourceFilter','bedsFilter','sortFilter'].forEach(id => $(id).value = $(id).options[0].value);
    $('searchInput').value = $('minPrice').value = $('maxPrice').value = '';
    Object.assign(state, {
      page:1, area:'all', category:'all', source:'all', beds:'all',
      minPrice:'', maxPrice:'', search:'', sort:'scraped_at', order:'desc',
    });
    loadListings();
  });
}

function applyFilters() {
  const sortVal = $('sortFilter').value;
  state.area     = $('areaFilter').value;
  state.category = $('categoryFilter').value;
  state.source   = $('sourceFilter').value;
  state.beds     = $('bedsFilter').value;
  state.minPrice = $('minPrice').value;
  state.maxPrice = $('maxPrice').value;
  state.sort     = sortVal.replace(/^-/, '');
  state.order    = sortVal.startsWith('-') ? 'asc' : 'desc';
  state.page     = 1;
  loadListings();
}

// ── View toggle ───────────────────────────────────────────────
function bindViewToggle() {
  $('gridView').addEventListener('click', () => {
    grid.classList.remove('list-mode');
    $('gridView').classList.add('active');
    $('listView').classList.remove('active');
  });
  $('listView').addEventListener('click', () => {
    grid.classList.add('list-mode');
    $('listView').classList.add('active');
    $('gridView').classList.remove('active');
  });
}

// ── Helpers ───────────────────────────────────────────────────
function skeletons(n) {
  return Array.from({length:n}).map(() =>
    `<div class="skel-card">
       <div class="skeleton" style="height:18px;width:60%"></div>
       <div class="skeleton" style="height:14px;width:85%"></div>
       <div class="skeleton" style="height:14px;width:40%"></div>
       <div class="skeleton" style="height:24px;width:50%;margin-top:auto"></div>
     </div>`
  ).join('');
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, type='') {
  const t = $('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}
