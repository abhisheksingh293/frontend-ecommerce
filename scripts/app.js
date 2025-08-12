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
  if (!cartModal || !cartModalOverlay) return;
  cartModal.style.display = 'block';
  cartModal.classList.remove('slide-in'); // Reset in case
  cartModalOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
  renderCart();
  requestAnimationFrame(() => {
    cartModal.classList.add('slide-in');
  });
}
function closeCartModal() {
  if (!cartModal || !cartModalOverlay) return;
  cartModal.classList.remove('slide-in');
  setTimeout(() => {
    cartModal.style.display = 'none';
  }, 320); // match CSS transition
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
    const cartKey = Object.keys(cart).find(key => cart[key] === item);
    li.innerHTML = `
      <img src="${item.image || 'assets/placeholder.png'}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-details">
          <span class="cart-item-qty-badge">${item.qty}</span>
          <span class="cart-item-price">₹${(item.price * item.qty).toLocaleString()}</span>
        </span>
      </div>
      <button class="cart-item-remove" data-id="${cartKey}">Delete</button>
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

// --- Enhanced Search Feature ---
const searchInput = document.getElementById('mainSearchInput');
const searchDropdown = document.getElementById('searchDropdown');
let lastSearchResults = [];

function showSearchDropdown(results) {
  if (!searchDropdown) return;
  if (!results.length) {
    searchDropdown.style.display = 'none';
    searchDropdown.innerHTML = '';
    return;
  }
  searchDropdown.innerHTML = results.map(prod => `<div class="search-result" data-id="${prod.id}">${prod.title}</div>`).join('');
  searchDropdown.style.display = 'block';
}

if (searchInput && searchDropdown) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (!val || !window._allProducts) {
      showSearchDropdown([]);
      return;
    }
    lastSearchResults = window._allProducts.filter(p => p.title.toLowerCase().startsWith(val));
    showSearchDropdown(lastSearchResults.slice(0, 8));
  });
  searchInput.addEventListener('blur', () => {
    setTimeout(() => { searchDropdown.style.display = 'none'; }, 150);
  });
  searchDropdown.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('search-result')) {
      const id = e.target.getAttribute('data-id');
      const card = document.querySelector(`.product-card .product-btn[data-id="${id}"]`);
      if (card) {
        card.closest('.product-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.closest('.product-card').classList.add('search-highlight');
        setTimeout(() => card.closest('.product-card').classList.remove('search-highlight'), 1600);
      }
      searchDropdown.style.display = 'none';
      searchInput.value = e.target.textContent;
    }
  });
}

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
            // Navigate to product.html on card click (not Add to Cart)
            card.addEventListener('click', e => {
              if (e.target.classList.contains('product-btn')) return;
              window.location.href = `product.html?id=${product.id}`;
            });
            grid.appendChild(card);
        });
        // Attach event listeners for Add to Cart
        grid.querySelectorAll('.product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const product = products.find(p => p.id == id);
                const cardProduct = btn.closest('.product-card');
                const cardProductImage = cardProduct.querySelector('.product-image').src;
                const cartItem = {
                  id: product.id,
                  name: product.title,
                  price: Math.round(product.price * 85),
                  qty: 1,
                  image: cardProductImage
                };
                if (cart[id]) {
                  cart[id].qty += 1;
                } else {
                  cart[id] = cartItem;
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartBadge();
                renderCart();
                // Show confirmation popup
                const popup = document.getElementById('cartConfirmPopup');
                if (popup) {
                  popup.style.display = 'flex';
                  popup.classList.add('active');
                  setTimeout(() => {
                    popup.classList.remove('active');
                    setTimeout(() => { popup.style.display = 'none'; }, 230);
                  }, 1200);
                }
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
  let product = window._allProducts.find(p => p.id == modalProductId);
  if (!product) return;
  // Defensive: ensure image is present
  if (!product.image) {
    const found = window._allProducts.find(p => p.id == product.id);
    if (found && found.image) product.image = found.image;
  }
  console.log('Add to cart product:', product);
  const id = product.id;
  const cartItem = {
    id: product.id,
    name: product.title,
    price: Math.round(product.price * 85),
    qty: cart[id] ? cart[id].qty + 1 : 1,
    image: product.image
  };
  cart[id] = cartItem;
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
  closeProductModal();
});

window.addEventListener('DOMContentLoaded', loadProducts);

