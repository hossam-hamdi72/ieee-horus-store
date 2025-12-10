
// Basic product & cart logic (client-side). Replace GOOGLE_SHEETS_URL with your Apps Script URL.
const PRODUCTS_URL = 'products.json';
const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'; // <-- replace with deployed script URL that accepts POST

function loadProducts() {
  return fetch(PRODUCTS_URL).then(r => r.json());
}

function saveCart(cart) {
  localStorage.setItem('ieee_cart', JSON.stringify(cart));
  updateCartCount();
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('ieee_cart')) || []; } catch(e){ return []; }
}

function updateCartCount(){
  const cnt = getCart().reduce((s,i)=>s+i.qty,0);
  document.querySelectorAll('#cart-count, #cart-count-2, #cart-count-3').forEach(el=>{ el.textContent = cnt; });
}

// render products on shop page
async function renderShop(){
  const el = document.getElementById('products-grid');
  if(!el) return;
  const products = await loadProducts();
  const catSet = new Set();
  products.forEach(p=>catSet.add(p.category));
  const catSelect = document.getElementById('category-filter');
  catSet.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; catSelect.appendChild(o); });

  function draw(list){
    el.innerHTML = '';
    list.forEach(p=>{
      const card = document.createElement('div');
      card.className='product-card';
      card.innerHTML = `<img src="${p.image}" alt="${p.name}"><h4>${p.name}</h4><p class="price">${p.price} EGP</p><div style="margin-top:auto"><button class="btn add-btn" data-id="${p.id}">أضف للسلة</button> <a class="btn" href="product.html?id=${p.id}">عرض</a></div>`;
      el.appendChild(card);
    });
    document.querySelectorAll('.add-btn').forEach(b=>b.addEventListener('click',e=>{
      const id = e.target.dataset.id;
      const prod = products.find(x=>x.id==id);
      const cart = getCart();
      const found = cart.find(x=>x.id==id);
      if(found) found.qty++;
      else cart.push({id:prod.id,name:prod.name,price:prod.price,qty:1});
      saveCart(cart);
      alert('تمت الإضافة إلى السلة');
    }));
  }

  draw(products);
  document.getElementById('search')?.addEventListener('input',(e)=>{
    const q = e.target.value.trim();
    const filtered = products.filter(p=>p.name.includes(q) || p.description.includes(q));
    draw(filtered);
  });
  document.getElementById('category-filter')?.addEventListener('change',(e)=>{
    const v = e.target.value;
    const filtered = v ? products.filter(p=>p.category==v) : products;
    draw(filtered);
  });
}

// product detail
async function renderProductDetail(){
  const el = document.getElementById('product-detail');
  if(!el) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const products = await loadProducts();
  const p = products.find(x=>x.id==id);
  if(!p){ el.innerHTML='<p>Product not found</p>'; return; }
  el.innerHTML = `
    <div class="product-card" style="display:flex;gap:12px;flex-direction:column;">
      <img src="${p.image}" alt="${p.name}" style="height:240px;object-fit:contain">
      <h2>${p.name}</h2>
      <p class="price">${p.price} EGP</p>
      <p>${p.description}</p>
      <div><button class="btn" id="add-to-cart-detail">أضف للسلة</button></div>
    </div>
  `;
  document.getElementById('add-to-cart-detail').addEventListener('click',()=>{
    const cart = getCart();
    const found = cart.find(x=>x.id==p.id);
    if(found) found.qty++;
    else cart.push({id:p.id,name:p.name,price:p.price,qty:1});
    saveCart(cart);
    alert('تمت الإضافة إلى السلة');
  });
}

// render cart
function renderCart(){
  const el = document.getElementById('cart-items');
  if(!el) return;
  const cart = getCart();
  if(cart.length===0){ el.innerHTML='<p>سلة المشتريات فارغة.</p>'; return; }
  el.innerHTML='';
  cart.forEach(item=>{
    const row = document.createElement('div');
    row.className='product-card';
    row.innerHTML = `<h4>${item.name}</h4><p>الكمية: <input type="number" min="1" value="${item.qty}" data-id="${item.id}" class="qty-input" style="width:80px"></p><p>السعر: ${item.price} EGP</p><button class="btn remove-btn" data-id="${item.id}">حذف</button>`;
    el.appendChild(row);
  });
  document.querySelectorAll('.remove-btn').forEach(b=>b.addEventListener('click',e=>{
    const id = e.target.dataset.id;
    let cart = getCart();
    cart = cart.filter(x=>x.id!==id);
    saveCart(cart);
    renderCart();
  }));
  document.querySelectorAll('.qty-input').forEach(i=>i.addEventListener('change',e=>{
    const id = e.target.dataset.id;
    const v = parseInt(e.target.value)||1;
    const cart = getCart();
    const it = cart.find(x=>x.id==id);
    if(it) it.qty = v;
    saveCart(cart);
    renderCart();
  }));
  const total = cart.reduce((s,i)=>s + (i.qty * Number(i.price)),0);
  document.getElementById('cart-total').textContent = total.toFixed(2);
}

// Checkout: submit order to Google Sheets (Apps Script)
function initCheckoutForm(){
  const form = document.getElementById('checkout-form');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const data = new FormData(form);
    const order = {
      name: data.get('name'),
      phone: data.get('phone'),
      address: data.get('address'),
      notes: data.get('notes'),
      payment_method: data.get('payment_method'),
      items: getCart()
    };
    // try to POST to Google Apps Script URL
    try{
      const res = await fetch(GOOGLE_SHEETS_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(order)
      });
      if(res.ok){
        document.getElementById('checkout-message').style.display='block';
        document.getElementById('checkout-message').textContent = 'تم إرسال الطلب بنجاح! سنتواصل معك قريباً.';
        localStorage.removeItem('ieee_cart');
        updateCartCount();
        setTimeout(()=>location.href='index.html',2500);
        return;
      } else {
        throw 'server';
      }
    }catch(err){
      // fallback: save locally as JSON file download
      const blob = new Blob([JSON.stringify(order,null,2)],{type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'order.json'; document.body.appendChild(a); a.click();
      document.getElementById('checkout-message').style.display='block';
      document.getElementById('checkout-message').textContent = 'حدث خطأ أثناء إرسال الطلب. تم تنزيل نسخة من الطلب (order.json).';
    }
  });
}

// contact form sends to same endpoint (if set)
function initContactForm(){
  const form = document.getElementById('contact-form');
  if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const data = new FormData(form);
    const message = {type:'contact', name: data.get('name'), email: data.get('email'), message: data.get('message')};
    try{
      await fetch(GOOGLE_SHEETS_URL,{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify(message)});
      alert('تم إرسال رسالتك. شكراً');
      form.reset();
    }catch(e){
      alert('تعذر إرسال الرسالة. يمكنك التواصل عبر الايميل');
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateCartCount();
  renderShop();
  renderProductDetail();
  renderCart();
  initCheckoutForm();
  initContactForm();

  // language toggle (simple)
  document.querySelectorAll('#lang-toggle, #lang-toggle-2').forEach(b=>b?.addEventListener('click', ()=>{
    const html = document.documentElement;
    if(html.lang === 'ar'){ html.lang='en'; html.dir='ltr'; alert('Switched to English (basic toggle).'); }
    else { html.lang='ar'; html.dir='rtl'; alert('تم التحويل للعربية'); }
  }));
});
