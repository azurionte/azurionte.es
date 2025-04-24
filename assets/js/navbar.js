// assets/js/navbar.js
document.addEventListener('DOMContentLoaded', async () => {
  // 1) Load the navbar partial
  const resp = await fetch('/assets/partials/navbar.html');
  const html = await resp.text();
  document.getElementById('navbar-placeholder').innerHTML = html;

  // 2) Grab injected elements
  const btnMenu    = document.getElementById('menuBtn'),
        sidebar    = document.getElementById('sidebar'),
        overlay    = document.getElementById('overlay'),
        cartBtn    = document.getElementById('cart-btn'),
        cartBtnMob = document.getElementById('cart-btn-mobile'),
        cartPanel  = document.getElementById('cart-panel'),
        cartClose  = document.getElementById('cart-close'),
        cartOverlay= document.getElementById('cart-overlay'),
        checkoutBtn= document.getElementById('checkout-btn');

  // 3) Hamburger toggle
  function toggleMenu() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  }
  btnMenu.addEventListener('click', toggleMenu);
  btnMenu.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleMenu();
      e.preventDefault();
    }
  });
  overlay.addEventListener('click', toggleMenu);

  // 4) Cart state + helpers
  let cart = JSON.parse(localStorage.getItem('azCart') || '[]');
  const saveCart    = () => localStorage.setItem('azCart', JSON.stringify(cart));
  const formatPrice = cents => '$' + (cents/100).toFixed(2);

  // Badge updater
  function updateBadge() {
    const total = cart.reduce((sum,i) => sum + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
  }

  // Cart renderer
  const listEl    = () => document.querySelector('.cart-items'),
        subtotalEl= () => document.querySelector('.subtotal');
  function renderCart() {
    const list = listEl();
    list.innerHTML = '';
    if (!cart.length) {
      list.innerHTML = '<li class="empty">Your cart is empty.</li>';
      subtotalEl().textContent = 'Subtotal: $0.00';
    } else {
      let sub = 0;
      cart.forEach(item => {
        sub += item.price * item.qty;
        const li = document.createElement('li');
        li.className = 'item';
        li.innerHTML = `
          <span>${item.name} × ${item.qty}</span>
          <span>${formatPrice(item.price * item.qty)}</span>
        `;
        list.appendChild(li);
      });
      subtotalEl().textContent = 'Subtotal: ' + formatPrice(sub);
    }
  }

  // 5) Cart panel open/close
  function openCart() {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('show');
  }
  function closeCart() {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('show');
  }
  cartBtn.addEventListener('click', openCart);
  cartBtnMob.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // 6) Checkout button
  checkoutBtn.addEventListener('click', () => {
    window.location.href = '/checkout.html';
  });

  // 7) “Add to Cart” on store page
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card  = btn.closest('.product-card'),
            name  = card.querySelector('.product-name').textContent,
            price = Math.round(parseFloat(
                      card.querySelector('.product-price').textContent.replace('$','')
                    ) * 100);
      const exists = cart.find(i => i.name === name);
      if (exists) exists.qty++;
      else cart.push({ id: Date.now(), name, price, qty: 1 });
      saveCart();
      updateBadge();
      renderCart();
      openCart();
    });
  });

  // 8) CD mockup flip on home
  const mockup = document.querySelector('.cd-mockup');
  if (mockup) {
    const cdCase = mockup.querySelector('.cd-case');
    mockup.addEventListener('click', () => cdCase.classList.toggle('flipped'));
    mockup.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        cdCase.classList.toggle('flipped');
        e.preventDefault();
      }
    });
  }

  // 9) Initial draw
  updateBadge();
  renderCart();
});
