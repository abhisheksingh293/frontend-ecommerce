console.log("E-Commerce Website Loaded");

// Hamburger menu toggle for mobile navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// --- Cart Functionality ---
let cart = JSON.parse(localStorage.getItem('cart') || '{}');
const cartIcon = document.querySelector('.cart-icon');
const cartBadge = document.querySelector('.cart-badge');
const cartModal = document.getElementById('cartModal');
const cartModalOverlay = document.getElementById('cartModalOverlay');
const cartModalClose = document.getElementById('cartModalClose');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');
const cartEmpty = document.querySelector('.cart-empty');
const cartTotalRow = document.getElementById('cartTotalRow');
const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

function updateCartBadge() {
  const qty = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = qty;
}
function openCartModal() {
  cartModal.style.display = 'block';
  cartModalOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
  renderCart();
}
function closeCartModal() {
  cartModal.style.display = 'none';
  cartModalOverlay.style.display = 'none';
  document.body.style.overflow = '';
}
function renderCart() {
  cartItemsList.innerHTML = '';
  const items = Object.values(cart);
  if (items.length === 0) {
    cartEmpty.style.display = 'block';
    cartTotalRow.style.display = 'none';
    cartCheckoutBtn.style.display = 'none';
    return;
  }
  cartEmpty.style.display = 'none';
  cartTotalRow.style.display = 'flex';
  cartCheckoutBtn.style.display = 'block';
  let total = 0;
  items.forEach(item => {
    total += item.price * item.qty;
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-qty">x${item.qty}</span>
      <button class="cart-item-remove" data-id="${item.id}">&times;</button>
    `;
    cartItemsList.appendChild(li);
  });
  cartTotal.textContent = `₹${total.toLocaleString()}`;
  // Remove item
  cartItemsList.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = btn.getAttribute('data-id');
      delete cart[id];
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartBadge();
      renderCart();
    });
  });
}
if (cartIcon) cartIcon.addEventListener('click', openCartModal);
if (cartModalOverlay) cartModalOverlay.addEventListener('click', closeCartModal);
if (cartModalClose) cartModalClose.addEventListener('click', closeCartModal);
if (cartCheckoutBtn) cartCheckoutBtn.addEventListener('click', () => {
  alert('Checkout not implemented in demo.');
});
updateCartBadge();

// --- Dynamic Product Grid ---
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    const loading = document.getElementById('productsLoading');
    try {
        const res = await fetch('https://fakestoreapi.com/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const products = await res.json();
        loading.style.display = 'none';
        grid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const desc = product.description.length > 80 ? product.description.slice(0, 77) + '...' : product.description;
            card.innerHTML = `
                <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy" />
                <h3 class="product-name">${product.title}</h3>
                <p class="product-desc">${desc}</p>
                <p class="product-price">₹${Math.round(product.price * 85).toLocaleString()}</p>
                <button class="product-btn" data-id="${product.id}">Add to Cart</button>
            `;
            // Open detail modal on card click (not on Add to Cart)
            card.addEventListener('click', e => {
              if (e.target.classList.contains('product-btn')) return;
              openProductModal(product);
            });
            grid.appendChild(card);
        });
        // Attach event listeners for Add to Cart
        grid.querySelectorAll('.product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const product = products.find(p => p.id == id);
                // Map API fields to cart fields
                const cartItem = {
                  id: product.id,
                  name: product.title,
                  price: Math.round(product.price * 85),
                  qty: 1
                };
                if (cart[id]) {
                  cart[id].qty += 1;
                } else {
                  cart[id] = cartItem;
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartBadge();
                renderCart();
            });
        });

        // Modal logic
        window._allProducts = products; // for modal Add to Cart
    
    } catch (err) {
        loading.style.display = 'none';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'products-error';
        errorDiv.textContent = 'Failed to load products. Please try again later.';
        grid.appendChild(errorDiv);
    }
}

// --- Product Modal Logic ---
const productModal = document.getElementById('productModal');
const productModalOverlay = document.getElementById('productModalOverlay');
const productModalClose = document.getElementById('productModalClose');
const modalProductTitle = document.getElementById('modalProductTitle');
const modalProductImage = document.getElementById('modalProductImage');
const modalProductDesc = document.getElementById('modalProductDesc');
const modalProductPrice = document.getElementById('modalProductPrice');
const modalAddCartBtn = document.getElementById('modalAddCartBtn');
const modalProductRating = document.getElementById('modalProductRating');
let modalProductId = null;

function openProductModal(product) {
  modalProductId = product.id;
  modalProductTitle.textContent = product.title;
  modalProductImage.src = product.image;
  modalProductImage.alt = product.title;
  modalProductDesc.textContent = product.description;
  modalProductPrice.textContent = `₹${Math.round(product.price * 85).toLocaleString()}`;
  // Show rating as stars
  if (product.rating && product.rating.rate) {
    const stars = Math.round(product.rating.rate);
    modalProductRating.innerHTML = '★'.repeat(stars) + '<span style="color:#ddd">' + '★'.repeat(5 - stars) + '</span>' + ` (${product.rating.count})`;
  } else {
    modalProductRating.textContent = '';
  }
  productModal.style.display = 'block';
  productModalOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeProductModal() {
  productModal.style.display = 'none';
  productModalOverlay.style.display = 'none';
  document.body.style.overflow = '';
}
if (productModalOverlay) productModalOverlay.addEventListener('click', closeProductModal);
if (productModalClose) productModalClose.addEventListener('click', closeProductModal);
if (modalAddCartBtn) modalAddCartBtn.addEventListener('click', () => {
  if (!window._allProducts || !modalProductId) return;
  const product = window._allProducts.find(p => p.id == modalProductId);
  if (!product) return;
  const id = product.id;
  const cartItem = {
    id: product.id,
    name: product.title,
    price: Math.round(product.price * 85),
    qty: 1
  };
  if (cart[id]) {
    cart[id].qty += 1;
  } else {
    cart[id] = cartItem;
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
  closeProductModal();
});

window.addEventListener('DOMContentLoaded', loadProducts);

