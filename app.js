let cart = [];
let currentCategory = 'all';

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryFilter();
  renderFeaturedProducts();
  renderAllProducts();
  loadCartFromStorage();
  updateCartUI();
});

// ===================== NAVIGATION =====================
function showSection(name) {
  document.querySelectorAll('main > section').forEach(s => s.style.display = 'none');
  document.getElementById('section-' + name).style.display = 'block';
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const active = document.querySelector(`.nav-link[data-section="${name}"]`);
  if (active) active.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'checkout') renderCheckoutSummary();
}

function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('show');
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('show');
}

// ===================== FORMAT PRICE =====================
function formatPrice(n) {
  return n.toLocaleString('vi-VN') + 'đ';
}

// ===================== RENDER CATEGORIES =====================
function renderCategoryFilter() {
  const el = document.getElementById('categoryFilter');
  el.innerHTML = CATEGORIES.map(c =>
    `<button class="cat-btn ${c.id === currentCategory ? 'active' : ''}"
            onclick="filterCategory('${c.id}')">${c.icon} ${c.name}</button>`
  ).join('');
}

function filterCategory(id) {
  currentCategory = id;
  renderCategoryFilter();
  renderAllProducts();
}

// ===================== RENDER PRODUCTS =====================
function createProductCard(product) {
  const badgeHtml = product.badge
    ? `<span class="product-badge">${product.badge}</span>`
    : '';
  return `
    <div class="product-card" data-id="${product.id}" onclick="showProductDetail(${product.id})" style="cursor:pointer;">
      <div class="product-img-wrap">
        <img class="product-img" src="${product.image}" alt="${product.name}"
             onerror="this.style.display='none'; this.parentElement.innerHTML += '<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem;background:#fff0f5\\'>🐾</div>'">
        ${badgeHtml}
      </div>
      <div class="product-body">
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.description}</div>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.id})">+ Thêm</button>
        </div>
      </div>
    </div>
  `;
}

function renderFeaturedProducts() {
  const featured = PRODUCTS.filter(p => p.badge);
  document.getElementById('featuredProducts').innerHTML = featured.map(createProductCard).join('');
}

function renderAllProducts() {
  const filtered = currentCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === currentCategory);

  const grid = document.getElementById('allProducts');
  const empty = document.getElementById('noProducts');

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = filtered.map(createProductCard).join('');
  }
}

// ===================== CART =====================
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCartToStorage();
  updateCartUI();
  showToast(`Đã thêm "${product.name}" vào giỏ hàng 🛒`);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartUI();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCartToStorage();
  updateCartUI();
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartUI() {
  const count = getCartCount();
  document.getElementById('cartCount').textContent = count;

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Giỏ hàng trống 🛒</p>';
    footerEl.style.display = 'none';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}"
           onerror="this.style.display='none'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">🗑️</button>
    </div>
  `).join('');

  footerEl.style.display = 'block';
  document.getElementById('cartTotal').textContent = formatPrice(getCartTotal());
}

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('show');
  document.getElementById('cartOverlay').classList.toggle('show');
}

// ===================== LOCAL STORAGE =====================
function saveCartToStorage() {
  localStorage.setItem('gonhacung_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  try {
    const data = localStorage.getItem('gonhacung_cart');
    if (data) cart = JSON.parse(data);
  } catch (e) {
    cart = [];
  }
}

// ===================== CHECKOUT =====================
function showCheckout() {
  toggleCart();
  setTimeout(() => showSection('checkout'), 350);
}

function renderCheckoutSummary() {
  const el = document.getElementById('checkoutSummary');
  if (cart.length === 0) {
    el.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px;">Giỏ hàng trống</p>';
    return;
  }

  const itemsHtml = cart.map(item => `
    <div class="summary-item">
      <span>${item.name} x${item.qty}</span>
      <span>${formatPrice(item.price * item.qty)}</span>
    </div>
  `).join('');

  el.innerHTML = `
    <h3>Đơn hàng của bạn</h3>
    ${itemsHtml}
    <div class="summary-total">
      <span>Tổng cộng:</span>
      <span>${formatPrice(getCartTotal())}</span>
    </div>
  `;
}

function handleOrder(e) {
  e.preventDefault();

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const note = document.getElementById('custNote').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked').value;

  if (!name || !phone || !address) {
    showToast('Vui lòng nhập đầy đủ thông tin!');
    return false;
  }

  const orderId = 'GN' + Date.now().toString(36).toUpperCase();
  const paymentLabel = payment === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';

  const orderHtml = `
    <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
    <p><strong>Khách hàng:</strong> ${name}</p>
    <p><strong>Số điện thoại:</strong> ${phone}</p>
    <p><strong>Địa chỉ:</strong> ${address}</p>
    <p><strong>Ghi chú:</strong> ${note || 'Không có'}</p>
    <p><strong>Thanh toán:</strong> ${paymentLabel}</p>
    <p><strong>Tổng tiền:</strong> <span style="color:var(--pink-dark);font-weight:800;">${formatPrice(getCartTotal())}</span></p>
    <hr style="margin:12px 0;border-color:var(--pink-light);">
    <p style="font-size:0.85rem;color:var(--text-light);">Đơn hàng đã được ghi nhận. Shop sẽ liên hệ xác nhận trong thời gian sớm nhất!</p>
  `;

  document.getElementById('successOrder').innerHTML = orderHtml;

  cart = [];
  saveCartToStorage();
  updateCartUI();
  document.getElementById('checkoutForm').reset();

  showSection('success');
  return false;
}

// ===================== CONTACT =====================
function handleContact(e) {
  e.preventDefault();
  showToast('Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất 💬');
  e.target.reset();
  return false;
}

// ===================== PRODUCT DETAIL =====================
function showProductDetail(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const related = PRODUCTS.filter(p => p.id !== productId && p.category === product.category).slice(0, 3);
  const relatedHtml = related.length > 0 ? `
    <div class="detail-related">
      <h3>Sản phẩm liên quan</h3>
      <div class="detail-related-grid">
        ${related.map(p => `
          <div class="detail-related-card" onclick="showProductDetail(${p.id})">
            <img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">
            <div>
              <div class="detail-related-name">${p.name}</div>
              <div class="detail-related-price">${formatPrice(p.price)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  document.getElementById('detailPage').innerHTML = `
    <div class="detail-back">
      <button class="btn-back" onclick="showSection('products')">← Quay lại sản phẩm</button>
    </div>
    <div class="detail-grid">
      <div class="detail-img-col">
        <div class="detail-img-wrap">
          <img class="detail-img" src="${product.image}" alt="${product.name}"
               onerror="this.style.display='none'; this.parentElement.innerHTML += '<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:5rem;background:#fff0f5;border-radius:18px\\'>🐾</div>'">
          ${product.badge ? `<span class="detail-badge">${product.badge}</span>` : ''}
        </div>
      </div>
      <div class="detail-info-col">
        <span class="detail-category">${CATEGORIES.find(c => c.id === product.category)?.icon || ''} ${CATEGORIES.find(c => c.id === product.category)?.name || ''}</span>
        <h1 class="detail-name">${product.name}</h1>
        <div class="detail-price">${formatPrice(product.price)}</div>
        <p class="detail-desc">${product.description}</p>
        <div class="detail-features">
          <div class="detail-feature"><span>✅</span> Hàng chính hãng, chất lượng</div>
          <div class="detail-feature"><span>🚚</span> Giao hàng toàn quốc</div>
          <div class="detail-feature"><span>🔄</span> Đổi trả trong 7 ngày</div>
          <div class="detail-feature"><span>📞</span> Hỗ trợ tư vấn 24/7</div>
        </div>
        <div class="detail-qty-row">
          <span>Số lượng:</span>
          <div class="detail-qty">
            <button class="qty-btn" onclick="detailChangeQty(-1)">−</button>
            <span id="detailQty">1</span>
            <button class="qty-btn" onclick="detailChangeQty(1)">+</button>
          </div>
        </div>
        <div class="detail-total" id="detailTotal">${formatPrice(product.price)}</div>
        <div class="detail-actions">
          <button class="btn-add-cart-lg" onclick="addToCart(${product.id})">🛒 Thêm vào giỏ</button>
          <button class="btn-buy-now" onclick="openDirectOrder(${product.id})">⚡ Mua ngay</button>
        </div>
      </div>
    </div>

    <!-- FORM ĐẶT HÀNG TRỰC TIẾP -->
    <div class="direct-order" id="directOrder" style="display:none;">
      <h2>📝 Đặt hàng nhanh</h2>
      <div class="direct-order-grid">
        <form class="checkout-form" id="directOrderForm" onsubmit="return handleDirectOrder(event, ${product.id})">
          <h3>Thông tin giao hàng</h3>
          <input type="text" id="directName" placeholder="Họ và tên *" required>
          <input type="tel" id="directPhone" placeholder="Số điện thoại *" required>
          <input type="text" id="directAddress" placeholder="Địa chỉ giao hàng *" required>
          <textarea id="directNote" placeholder="Ghi chú (tùy chọn)" rows="3"></textarea>

          <h3>Phương thức thanh toán</h3>
          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" name="directPayment" value="cod" checked>
              <span class="payment-label">💵 Thanh toán khi nhận hàng (COD)</span>
            </label>
            <label class="payment-option">
              <input type="radio" name="directPayment" value="transfer">
              <span class="payment-label">🏦 Chuyển khoản ngân hàng</span>
            </label>
          </div>
          <button type="submit" class="btn-primary btn-full">Xác nhận đặt hàng ✅</button>
        </form>
        <div class="checkout-summary">
          <h3>Đơn hàng của bạn</h3>
          <div class="summary-item">
            <span>${product.name} x<span id="summaryQty">1</span></span>
            <span id="summaryPrice">${formatPrice(product.price)}</span>
          </div>
          <div class="summary-total">
            <span>Tổng cộng:</span>
            <span id="summaryTotal">${formatPrice(product.price)}</span>
          </div>
        </div>
      </div>
    </div>

    ${relatedHtml}
  `;

  showSection('detail');
}

let detailQty = 1;

function detailChangeQty(delta) {
  detailQty = Math.max(1, detailQty + delta);
  document.getElementById('detailQty').textContent = detailQty;
  const product = getCurrentDetailProduct();
  if (product) {
    const total = product.price * detailQty;
    document.getElementById('detailTotal').textContent = formatPrice(total);
    document.getElementById('summaryQty').textContent = detailQty;
    document.getElementById('summaryPrice').textContent = formatPrice(total);
    document.getElementById('summaryTotal').textContent = formatPrice(total);
  }
}

function getCurrentDetailProduct() {
  const nameEl = document.getElementById('detailName');
  if (!nameEl) return null;
  return PRODUCTS.find(p => p.name === nameEl.textContent);
}

function openDirectOrder(productId) {
  const el = document.getElementById('directOrder');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
  if (el.style.display === 'block') {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  detailQty = 1;
  const qtyEl = document.getElementById('detailQty');
  if (qtyEl) qtyEl.textContent = 1;
}

function handleDirectOrder(e, productId) {
  e.preventDefault();

  const product = PRODUCTS.find(p => p.id === productId);
  const name = document.getElementById('directName').value.trim();
  const phone = document.getElementById('directPhone').value.trim();
  const address = document.getElementById('directAddress').value.trim();
  const note = document.getElementById('directNote').value.trim();
  const payment = document.querySelector('input[name="directPayment"]:checked').value;

  if (!name || !phone || !address) {
    showToast('Vui lòng nhập đầy đủ thông tin!');
    return false;
  }

  const qty = detailQty;
  const total = product.price * qty;
  const orderId = 'GN' + Date.now().toString(36).toUpperCase();
  const paymentLabel = payment === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';

  const orderHtml = `
    <p><strong>Mã đơn hàng:</strong> ${orderId}</p>
    <p><strong>Sản phẩm:</strong> ${product.name} x${qty}</p>
    <p><strong>Khách hàng:</strong> ${name}</p>
    <p><strong>Số điện thoại:</strong> ${phone}</p>
    <p><strong>Địa chỉ:</strong> ${address}</p>
    <p><strong>Ghi chú:</strong> ${note || 'Không có'}</p>
    <p><strong>Thanh toán:</strong> ${paymentLabel}</p>
    <p><strong>Tổng tiền:</strong> <span style="color:var(--pink-dark);font-weight:800;">${formatPrice(total)}</span></p>
    <hr style="margin:12px 0;border-color:var(--pink-light);">
    <p style="font-size:0.85rem;color:var(--text-light);">Đơn hàng đã được ghi nhận. Shop sẽ liên hệ xác nhận trong thời gian sớm nhất!</p>
  `;

  document.getElementById('successOrder').innerHTML = orderHtml;
  document.getElementById('directOrderForm').reset();
  showSection('success');
  return false;
}

// ===================== TOAST =====================
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}
