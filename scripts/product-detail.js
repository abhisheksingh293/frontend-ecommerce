// Product Detail Page Logic

// --- Cart Logic (shared with main app.js) ---
let cart = JSON.parse(localStorage.getItem('cart') || '{}');
const cartBadge = document.getElementById('cartBadge');
const cartIcon = document.querySelector('.cart-icon');
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
  if (cartBadge) cartBadge.textContent = qty;
}
function openCartModal() {
  console.log('openCartModal called', cartModal, cartModalOverlay);

  if (!cartModal || !cartModalOverlay) return;
  cartModal.style.display = 'block';
  cartModal.classList.remove('slide-in'); // Reset in case
  cartModalOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
  renderCart();
  // Force reflow, then add slide-in for animation
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
  if (!cartItemsList || !cartTotal || !cartEmpty || !cartTotalRow || !cartCheckoutBtn) return;
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
        <span class="cart-item-variation">${item.size ? ' ('+item.size+', '+item.color+')' : ''}</span>
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
if (cartIcon) cartIcon.addEventListener('click', function() {
  console.log('Cart icon clicked');
  openCartModal();
});
if (cartModalOverlay) cartModalOverlay.addEventListener('click', closeCartModal);
if (cartModalClose) cartModalClose.addEventListener('click', closeCartModal);
if (cartCheckoutBtn) cartCheckoutBtn.addEventListener('click', () => {
  alert('Checkout not implemented in demo.');
});
updateCartBadge();
function addToCart(product) {
  // Defensive: ensure image is present
  if (!product.image && window._allProducts) {
    const found = window._allProducts.find(p => p.id == product.id);
    if (found && found.image) product.image = found.image;
  }
  console.log('Add to cart product:', product);
  const id = product.id;
  const size = selectSize ? selectSize.value : 'M';
  const color = selectColor ? selectColor.value : 'Blue';
  const qty = currentQty;
  const cartKey = `${id}_${size}_${color}`;
  const cartItem = {
    id: product.id,
    name: product.title,
    price: currentPrice,
    qty,
    size,
    color,
    image: product.image
  };
  if (cart[cartKey]) {
    cart[cartKey].qty += qty;
  } else {
    cart[cartKey] = cartItem;
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
  // Feedback animation
  if (addCartFeedback) {
    addCartFeedback.textContent = `Added to cart! (${qty} × ${size}, ${color})`;
    addCartFeedback.classList.add('active');
    setTimeout(() => {
      addCartFeedback.classList.remove('active');
    }, 1200);
  }
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
}

// --- Main Detail Logic ---
const detailLoading = document.getElementById('detailLoading');
const detailError = document.getElementById('detailError');
const detailContainer = document.getElementById('detailContainer');
const detailImage = document.getElementById('detailImage');
const detailTitle = document.getElementById('detailTitle');
const detailRating = document.getElementById('detailRating');
const detailPrice = document.getElementById('detailPrice');
const detailDesc = document.getElementById('detailDesc');
const detailAddCartBtn = document.getElementById('detailAddCartBtn');
const breadcrumbs = document.getElementById('breadcrumbs');
const selectSize = document.getElementById('selectSize');
const selectColor = document.getElementById('selectColor');
const imageCarousel = document.getElementById('imageCarousel');
const carouselThumbnails = document.getElementById('carouselThumbnails');
const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const quantityInput = document.getElementById('quantityInput');
const totalPrice = document.getElementById('totalPrice');
const addCartFeedback = document.getElementById('addCartFeedback');
let currentPrice = 0;
let currentQty = 1;

function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadProductDetail() {
  const id = getProductIdFromURL();
  if (!id) {
    detailLoading.style.display = 'none';
    detailError.style.display = 'block';
    detailError.textContent = 'No product selected.';
    return;
  }
  try {
    const res = await fetch(`https://fakestoreapi.com/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    const product = await res.json();
    detailLoading.style.display = 'none';
    detailContainer.style.display = 'flex';

    // --- Breadcrumbs ---
    if (breadcrumbs && product.category && product.title) {
      breadcrumbs.innerHTML = `<a href="index.html">Home</a> <span class="crumb-sep">/</span> <a href="index.html#${encodeURIComponent(product.category)}">${product.category.replace(/\b\w/g, c => c.toUpperCase())}</a> <span class="crumb-sep">/</span> <span>${product.title.length > 30 ? product.title.slice(0,27)+'...' : product.title}</span>`;
    }

    // --- Carousel (simulate 3 images) ---
    let images = [product.image, product.image, product.image];
    // Optionally, generate fake variants (e.g., grayscale, flipped) for demo
    carouselThumbnails.innerHTML = '';
    images.forEach((img, idx) => {
      const thumb = document.createElement('img');
      thumb.src = img;
      thumb.alt = `Thumbnail ${idx+1}`;
      thumb.className = idx === 0 ? 'active' : '';
      thumb.onclick = () => setCarouselImage(idx);
      carouselThumbnails.appendChild(thumb);
    });
    function setCarouselImage(idx) {
      detailImage.src = images[idx];
      carouselThumbnails.querySelectorAll('img').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });
    }
    setCarouselImage(0);

    // Image zoom logic
    detailImage.style.cursor = 'zoom-in';
    detailImage.onclick = function() {
      openZoomModal(detailImage.src, product.title);
    };
    detailTitle.textContent = product.title;
    detailDesc.textContent = product.description;
    currentPrice = Math.round(product.price * 85);
    detailPrice.textContent = `₹${currentPrice.toLocaleString()}`;
    // --- Total Price (live update) ---
    function updateTotalPrice() {
      totalPrice.textContent = `₹${(currentPrice * currentQty).toLocaleString()}`;
    }
    updateTotalPrice();
    // Quantity selector logic
    function setQty(qty) {
      currentQty = Math.max(1, Math.min(10, qty));
      quantityInput.value = currentQty;
      updateTotalPrice();
    }
    if (qtyMinus) qtyMinus.onclick = () => setQty(currentQty - 1);
    if (qtyPlus) qtyPlus.onclick = () => setQty(currentQty + 1);
    if (quantityInput) quantityInput.oninput = () => {
      let val = parseInt(quantityInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 10) val = 10;
      setQty(val);
    };
    setQty(1);
    // Update price on variation change (if price varies)
    if (selectSize) selectSize.onchange = updateTotalPrice;
    if (selectColor) selectColor.onchange = updateTotalPrice;
    if (product.rating && product.rating.rate) {
      const stars = Math.round(product.rating.rate);
      detailRating.innerHTML = '★'.repeat(stars) + '<span style="color:#ddd">' + '★'.repeat(5 - stars) + '</span>' + ` (${product.rating.count})`;
    } else {
      detailRating.textContent = '';
    }
    detailAddCartBtn.onclick = () => addToCart(product);
    // --- Related Products ---
    if (product.category) {
      const relatedSection = document.getElementById('relatedSection');
      const relatedProductsDiv = document.getElementById('relatedProducts');
      const relatedRes = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(product.category)}`);
      if (relatedRes.ok) {
        let related = await relatedRes.json();
        related = related.filter(p => p.id != product.id).slice(0, 4);
        if (related.length > 0) {
          relatedSection.style.display = 'block';
          relatedProductsDiv.innerHTML = '';
          related.forEach(rp => {
            const card = document.createElement('div');
            card.className = 'related-card';
            card.innerHTML = `
              <img src="${rp.image}" alt="${rp.title}" />
              <div class="related-title">${rp.title.length > 38 ? rp.title.slice(0,35)+'...' : rp.title}</div>
              <div class="related-price">₹${Math.round(rp.price * 85).toLocaleString()}</div>
            `;
            card.addEventListener('click', () => {
              window.location.href = `product.html?id=${rp.id}`;
            });
            relatedProductsDiv.appendChild(card);
          });
        }
      }
    }
  } catch (err) {
    detailLoading.style.display = 'none';
    detailError.style.display = 'block';
    detailError.textContent = 'Failed to load product. Please try again later.';
  }
}


// --- Magnifier Zoom (desktop only) ---
let magnifierLens;
function enableMagnifier(imgEl) {
  if (!imgEl) return;
  const detailImgBox = imgEl.parentElement;
  if (!detailImgBox) return;
  if (window.innerWidth < 700) return; // Only for desktop
  if (!magnifierLens) {
    magnifierLens = document.createElement('div');
    magnifierLens.className = 'magnifier-lens';
    detailImgBox.appendChild(magnifierLens);
  }
  detailImgBox.classList.add('magnifier-active');
  let rect = imgEl.getBoundingClientRect();
  magnifierLens.style.backgroundImage = `url('${imgEl.src}')`;
  magnifierLens.style.backgroundSize = '200% 200%';
  function moveLens(e) {
    e.preventDefault();
    let x = e.offsetX, y = e.offsetY;
    let lensSize = magnifierLens.offsetWidth / 2;
    let left = x - lensSize;
    let top = y - lensSize;
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left > imgEl.width - lensSize*2) left = imgEl.width - lensSize*2;
    if (top > imgEl.height - lensSize*2) top = imgEl.height - lensSize*2;
    magnifierLens.style.left = `${left}px`;
    magnifierLens.style.top = `${top}px`;
    let percentX = x / imgEl.width * 100;
    let percentY = y / imgEl.height * 100;
    magnifierLens.style.backgroundPosition = `${percentX}% ${percentY}%`;
  }
  imgEl.addEventListener('mousemove', moveLens);
  imgEl.addEventListener('mouseleave', () => {
    detailImgBox.classList.remove('magnifier-active');
    if (magnifierLens) magnifierLens.remove();
    magnifierLens = null;
    imgEl.removeEventListener('mousemove', moveLens);
  }, { once: true });
}
detailImage.addEventListener('mouseenter', () => enableMagnifier(detailImage));
// --- Image Zoom Modal Logic ---
const zoomModal = document.getElementById('zoomModal');
const zoomModalOverlay = document.getElementById('zoomModalOverlay');
const zoomModalImg = document.getElementById('zoomModalImg');
const zoomModalClose = document.getElementById('zoomModalClose');
function openZoomModal(imgUrl, altText) {
  if (!zoomModal || !zoomModalImg) return;
  zoomModalImg.src = imgUrl;
  zoomModalImg.alt = altText || '';
  zoomModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeZoomModal() {
  if (!zoomModal) return;
  zoomModal.classList.remove('active');
  document.body.style.overflow = '';
}
if (zoomModalOverlay) zoomModalOverlay.addEventListener('click', closeZoomModal);
if (zoomModalClose) zoomModalClose.addEventListener('click', closeZoomModal);
zoomModalImg && zoomModalImg.addEventListener('click', function(e) {
  e.stopPropagation(); // Prevent closing when clicking image
});
window.addEventListener('DOMContentLoaded', loadProductDetail);
