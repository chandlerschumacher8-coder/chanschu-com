// DC Appliance E-Commerce — shared JS
// Connects to Redis backend via existing /api/admin-get endpoints
// Multi-tenant: uses store_id = 1 for DC Appliance

window.DC_STORE_ID = 1;
window.DC_CART_KEY = 'dc-cart';
window.DC_PRODUCTS = [];
window.DC_STORE = {
  store_name: 'DC Appliance',
  phone: '620-371-6417',
  address: '2610 Central Ave',
  city: 'Dodge City',
  state: 'KS',
  zip: '67801',
  logo_url: '/images/dc-appliance-logo-transparent.png'
};

// Department configuration — maps department names to icons and inventory categories
window.DC_DEPARTMENTS = [
  { slug: 'refrigerators', name: 'Refrigerators', icon: '🧊', cats: ['BOTTOM MOUNT FRIDGE','SIDE BY SIDE FRIDGE','FRENCH DOOR FRIDGE','TOP MOUNT','BEVERAGE CENTER'] },
  { slug: 'washers-dryers', name: 'Washers & Dryers', icon: '👕', cats: ['WASHERS','DRYERS','COMBO WASHER DRYER','PEDASTALS','LAUNDRY ACCESSORIES'] },
  { slug: 'dishwashers', name: 'Dishwashers', icon: '🍽️', cats: ['DISHWASHERS'] },
  { slug: 'ovens-ranges', name: 'Ovens & Ranges', icon: '🔥', cats: ['RANGES','COOK TOP','BUILT IN','HOODS'] },
  { slug: 'microwaves', name: 'Microwaves', icon: '📡', cats: ['COUNTERTOP MICRO','OTR','TRIM KITS'] },
  { slug: 'freezers', name: 'Freezers', icon: '❄️', cats: ['FREEZER','ICEMKR'] },
  { slug: 'mattresses', name: 'Mattresses', icon: '🛏️', cats: ['MATTRESSES','FOUNDATIONS','PILLOWS','SHEETS','MATTRESS ACCESSORIES','MATTRESS PROTECTORS'] },
  { slug: 'tvs', name: 'TVs & Audio', icon: '📺', cats: ['TV','TV MOUNTS','AUDIO'] },
  { slug: 'outdoor', name: 'Outdoor', icon: '🔥', cats: ['GRILL','GRILLING ACCESSORIES','PELLETS','OUTDOOR FURNITURE','FIREPLACES','SAUCES SPICES'] },
  { slug: 'furniture', name: 'Furniture', icon: '🛋️', cats: ['LIVING ROOM','BEDROOM','DINING ROOM','BED FRAMES','RUGS','WALL ART','FURNITURE ACCESSORIES','FURNITURE BATTERY'] },
  { slug: 'more', name: 'Accessories', icon: '🧰', cats: ['FILTER','KITCHEN ACCESSORIES','SMALL APPLIANCES','VENT','TRASH COMPACTOR','WARRANTIES'] }
];

// ─── DATA LOADING ───
async function dcLoadProducts() {
  if (window.DC_PRODUCTS.length) return window.DC_PRODUCTS;
  try {
    const res = await fetch('/api/admin-get?key=products');
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      window.DC_PRODUCTS = data.data.filter(p => p.active !== false);
    }
  } catch (e) { console.error('Load products failed:', e); }
  return window.DC_PRODUCTS;
}

async function dcLoadStore() {
  try {
    const res = await fetch('/api/admin-get?key=stores');
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      const store = data.data.find(s => s.store_id === window.DC_STORE_ID);
      if (store) window.DC_STORE = Object.assign(window.DC_STORE, store);
    }
  } catch (e) {}
  return window.DC_STORE;
}

// Helpers
function dcFmt(n) { return '$' + (parseFloat(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function dcGetStock(p) { return Math.max(0, (p.stock || 0) - (p.sold || 0)); }
function dcGetStockBadge(p) {
  const s = dcGetStock(p);
  if (s <= 0) return { cls: 'dc-stock-out', label: 'Out of Stock' };
  if (s <= (p.reorderPt || 2)) return { cls: 'dc-stock-low', label: 'Low Stock' };
  return { cls: 'dc-stock-in', label: 'In Stock' };
}
function dcProductDept(p) {
  const cat = (p.cat || '').toUpperCase();
  for (const d of window.DC_DEPARTMENTS) {
    if (d.cats.some(c => c.toUpperCase() === cat)) return d.slug;
  }
  return '';
}

// ─── CART ───
function dcGetCart() {
  try { return JSON.parse(localStorage.getItem(window.DC_CART_KEY) || '[]'); }
  catch (e) { return []; }
}
function dcSaveCart(cart) {
  localStorage.setItem(window.DC_CART_KEY, JSON.stringify(cart));
  dcUpdateCartBadge();
}
function dcCartAdd(productId, qty) {
  qty = qty || 1;
  const p = window.DC_PRODUCTS.find(x => x.id === productId);
  if (!p) { dcToast('Product not found'); return; }
  if (dcGetStock(p) <= 0) { dcToast('Out of stock'); return; }
  const cart = dcGetCart();
  const existing = cart.find(x => x.id === productId);
  if (existing) existing.qty = (existing.qty || 1) + qty;
  else cart.push({ id: productId, qty: qty });
  dcSaveCart(cart);
  dcToast(p.name + ' added to cart');
}
function dcCartRemove(productId) {
  const cart = dcGetCart().filter(x => x.id !== productId);
  dcSaveCart(cart);
}
function dcCartUpdateQty(productId, qty) {
  const cart = dcGetCart();
  const item = cart.find(x => x.id === productId);
  if (item) { item.qty = Math.max(1, parseInt(qty) || 1); dcSaveCart(cart); }
}
function dcCartCount() {
  return dcGetCart().reduce((s, x) => s + (x.qty || 0), 0);
}
function dcUpdateCartBadge() {
  const badges = document.querySelectorAll('[data-cart-badge]');
  const n = dcCartCount();
  badges.forEach(b => {
    b.textContent = n;
    b.classList.toggle('empty', n === 0);
  });
}

// ─── TOAST ───
function dcToast(msg) {
  let t = document.getElementById('dc-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'dc-toast';
    t.className = 'dc-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._dcToastTimer);
  window._dcToastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ─── LIVE SEARCH ───
function dcSetupSearch() {
  const input = document.querySelector('[data-search-input]');
  if (!input) return;
  const results = document.querySelector('[data-search-results]');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim().toLowerCase();
    if (!q || q.length < 2) { if (results) results.classList.remove('open'); return; }
    timer = setTimeout(() => {
      const matches = window.DC_PRODUCTS.filter(p => {
        return (p.name || '').toLowerCase().includes(q)
          || (p.model || '').toLowerCase().includes(q)
          || (p.brand || '').toLowerCase().includes(q)
          || (p.sku || '').toLowerCase().includes(q);
      }).slice(0, 8);
      if (!results) return;
      if (!matches.length) {
        results.innerHTML = '<div style="padding:16px;text-align:center;color:#9aa0ac;font-size:13px;">No matches found</div>';
      } else {
        results.innerHTML = matches.map(p => {
          return '<a href="product.html?id=' + p.id + '" class="dc-search-result">'
            + '<div>'
            + '<div class="dc-search-result-name">' + p.name + '</div>'
            + '<div class="dc-search-result-meta">' + (p.brand || '') + ' · ' + (p.model || p.sku || '') + '</div>'
            + '</div>'
            + '<div class="dc-search-result-price">' + dcFmt(p.price) + '</div>'
            + '</a>';
        }).join('');
      }
      results.classList.add('open');
    }, 150);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) window.location.href = 'shop.html?q=' + encodeURIComponent(q);
    }
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (results && !input.contains(e.target) && !results.contains(e.target)) results.classList.remove('open');
  });
}

// ─── HEADER RENDERING ───
function dcRenderHeader() {
  const host = document.querySelector('[data-dc-header]');
  if (!host) return;
  host.innerHTML = `
    <div class="dc-header-top">Free local delivery on orders over $499 &middot; Call <a href="tel:${window.DC_STORE.phone}">${window.DC_STORE.phone}</a></div>
    <div class="dc-header-main">
      <a href="index.html" class="dc-logo">
        <img src="${window.DC_STORE.logo_url}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" alt="DC Appliance"/>
        <span class="dc-logo-text" style="display:none;">${window.DC_STORE.store_name}</span>
      </a>
      <nav class="dc-nav">
        <a href="shop.html">Shop</a>
        <a href="shop.html#departments">Departments</a>
        <a href="shop.html?sort=deals">Deals</a>
        <a href="delivery.html">Delivery</a>
        <a href="about.html">About</a>
        <a href="contact.html">Contact</a>
      </nav>
      <div class="dc-search">
        <input type="text" placeholder="Search model #, brand, or appliance..." data-search-input autocomplete="off"/>
        <button onclick="const i=document.querySelector('[data-search-input]');if(i.value.trim())window.location.href='shop.html?q='+encodeURIComponent(i.value.trim())" aria-label="Search">🔍</button>
        <div class="dc-search-results" data-search-results></div>
      </div>
      <div class="dc-icons">
        <a href="account.html" class="dc-icon-btn" aria-label="Account">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          Account
        </a>
        <a href="cart.html" class="dc-icon-btn" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
          Cart<span class="dc-cart-badge empty" data-cart-badge>0</span>
        </a>
        <button class="dc-hamburger" onclick="document.querySelector('.dc-nav').style.display=document.querySelector('.dc-nav').style.display==='flex'?'none':'flex';">☰</button>
      </div>
    </div>
  `;
  dcSetupSearch();
  dcUpdateCartBadge();
}

// ─── FOOTER RENDERING ───
function dcRenderFooter() {
  const host = document.querySelector('[data-dc-footer]');
  if (!host) return;
  const s = window.DC_STORE;
  host.innerHTML = `
    <div class="dc-footer-inner">
      <div class="dc-footer-cols">
        <div class="dc-footer-col">
          <div class="dc-footer-brand">${s.store_name}</div>
          <div class="dc-footer-addr">
            ${s.address}<br/>
            ${s.city}, ${s.state} ${s.zip}<br/>
            <a href="tel:${s.phone}">${s.phone}</a>
          </div>
          <div class="dc-social">
            <a href="#" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/></svg></a>
            <a href="#" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
          </div>
        </div>
        <div class="dc-footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="shop.html">All Products</a></li>
            <li><a href="shop.html?dept=refrigerators">Refrigerators</a></li>
            <li><a href="shop.html?dept=washers-dryers">Washers & Dryers</a></li>
            <li><a href="shop.html?dept=mattresses">Mattresses</a></li>
            <li><a href="shop.html?sort=deals">Deals</a></li>
          </ul>
        </div>
        <div class="dc-footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li><a href="delivery.html">Delivery Info</a></li>
            <li><a href="contact.html">Contact Us</a></li>
            <li><a href="account.html">My Account</a></li>
            <li><a href="about.html">About</a></li>
          </ul>
        </div>
        <div class="dc-footer-col">
          <h4>Hours</h4>
          <div style="font-size:13px;line-height:1.7;">${s.store_hours || 'Mon-Fri 9am-6pm<br/>Sat 9am-5pm<br/>Sun Closed'}</div>
        </div>
      </div>
      <div class="dc-footer-bottom">
        <div>&copy; ${new Date().getFullYear()} ${s.store_name}. All rights reserved.</div>
        <div>Powered by Appliance OS</div>
      </div>
    </div>
  `;
}

// ─── PRODUCT CARD ───
function dcProductCardHtml(p) {
  const stock = dcGetStockBadge(p);
  const outOfStock = dcGetStock(p) <= 0;
  const imgSrc = p.imageUrl || p.image || '';
  return `<div class="dc-prod-card">
    <div class="dc-prod-img">${imgSrc ? `<img src="${imgSrc}" alt="${p.name}" onerror="this.parentElement.innerHTML='📦'"/>` : '📦'}</div>
    <div class="dc-prod-body">
      <div class="dc-prod-brand">${p.brand || ''}</div>
      <div class="dc-prod-name">${p.name || ''}</div>
      <div class="dc-prod-model">${p.model || p.sku || ''}</div>
      <div class="dc-prod-bottom">
        <div class="dc-prod-price">${dcFmt(p.price)}</div>
        <span class="dc-stock-badge ${stock.cls}">${stock.label}</span>
        <div class="dc-prod-actions">
          <button class="dc-prod-cart" onclick="dcCartAdd(${p.id})" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Sold Out' : 'Add to Cart'}</button>
          <button class="dc-prod-view" onclick="window.location.href='product.html?id=${p.id}'">Details</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ─── INIT ON LOAD ───
async function dcInit() {
  await Promise.all([dcLoadStore(), dcLoadProducts()]);
  dcRenderHeader();
  dcRenderFooter();
  dcUpdateCartBadge();
  if (typeof dcPageInit === 'function') dcPageInit();
}

document.addEventListener('DOMContentLoaded', dcInit);
