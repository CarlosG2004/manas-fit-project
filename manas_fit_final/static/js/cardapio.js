// ════════════════════════════════════════════════════════════════════════════
// ESTADO DO CARRINHO
// ════════════════════════════════════════════════════════════════════════════
let cart          = [];
let chosenMethod  = null;
let chosenPayment = null;
let needsChange   = false;
let customerInfo  = null;
let pixProofFile  = null;

// Estado da marmita
let marmitaSelections = { proteina: null, carbo: null, extra: null, acomp: [] };
let marmitaSize       = null;   // '450g' | '750g'
let marmitaCombo      = null;   // { qty, price }

// Estado da massa ao molho branco
let mbSelections = { mbsabor: [] };
let mbSize       = null;
let mbCombo      = null;

// ════════════════════════════════════════════════════════════════════════════
// NAVEGAÇÃO
// ════════════════════════════════════════════════════════════════════════════
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ════════════════════════════════════════════════════════════════════════════
// ABAS
// ════════════════════════════════════════════════════════════════════════════
function showTab(evt, name) {
  document.querySelectorAll('.menu-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  evt.currentTarget.classList.add('active');
}

// ════════════════════════════════════════════════════════════════════════════
// CARRINHO — ABRIR / FECHAR / VIEWS
// ════════════════════════════════════════════════════════════════════════════
function openCart() {
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  if (!IS_LOGGED) {
    showView('viewBlocked');
  } else {
    showView('viewItems');
    renderCart();
  }
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}

function showView(id) {
  ['viewBlocked','viewItems','viewMethod','viewForm','viewPayment'].forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === id) ? 'flex' : 'none';
  });
}

function backToForm()  { showView('viewForm'); }
function backToCart()  { showView('viewItems'); renderCart(); }

function goToCheckout() {
  if (cart.length === 0) { showToast('⚠️ Adicione itens ao carrinho primeiro!'); return; }
  showView('viewMethod');
}

function chooseMethod(method) {
  chosenMethod = method;
  const isEntrega = method === 'entrega';
  document.getElementById('formTitle').textContent   = isEntrega ? 'Dados para entrega' : 'Dados para retirada';
  document.getElementById('addrField').style.display = isEntrega ? 'flex' : 'none';
  document.getElementById('fAddress').required       = isEntrega;
  document.getElementById('ubermotoNote').style.display = isEntrega ? 'block' : 'none';
  showView('viewForm');
}

function submitOrder(e) {
  e.preventDefault();
  const name    = document.getElementById('fName').value.trim();
  const phone   = document.getElementById('fPhone').value.trim();
  const address = document.getElementById('fAddress').value.trim();

  if (!name)  { showToast('⚠️ Informe seu nome completo!'); return; }
  if (!phone || phone.replace(/\D/g,'').length < 10) { showToast('⚠️ Informe um celular válido!'); return; }
  if (chosenMethod === 'entrega' && !address) { showToast('⚠️ Informe o endereço de entrega!'); return; }

  customerInfo  = { name, phone, address, method: chosenMethod };
  chosenPayment = null;
  needsChange   = false;
  resetPaymentUI();
  showView('viewPayment');
}

function resetPaymentUI() {
  ['payPixBtn','payCashBtn'].forEach(id => document.getElementById(id)?.classList.remove('active'));
  ['pixBox','cashBox'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  const ca  = document.getElementById('cashAmount');      if (ca)  ca.value = '';
  const caf = document.getElementById('cashAmountField'); if (caf) caf.style.display = 'none';
  const ci  = document.getElementById('changeInfo');      if (ci)  ci.style.display  = 'none';
  const cyb = document.getElementById('changeYesBtn');    if (cyb) cyb.classList.remove('active');
  const cnb = document.getElementById('changeNoBtn');     if (cnb) cnb.classList.add('active');
  pixProofFile = null;
  const pp  = document.getElementById('pixProof');        if (pp)  pp.value = '';
  const pft = document.getElementById('pixFileText');     if (pft) pft.textContent = '📎 Escolher arquivo';
  const pfl = document.getElementById('pixFileLabel');    if (pfl) pfl.classList.remove('has-file');
}

function onPixProofChange(input) {
  const file  = input.files?.[0];
  const label = document.getElementById('pixFileLabel');
  const text  = document.getElementById('pixFileText');
  if (file) {
    pixProofFile = file;
    text.textContent = '✅ ' + file.name;
    label.classList.add('has-file');
  }
}

function choosePayment(type) {
  chosenPayment = type;
  document.getElementById('payPixBtn').classList.toggle('active',  type === 'pix');
  document.getElementById('payCashBtn').classList.toggle('active', type === 'dinheiro');
  document.getElementById('pixBox').style.display  = type === 'pix'      ? 'block' : 'none';
  document.getElementById('cashBox').style.display = type === 'dinheiro' ? 'block' : 'none';
}

function setNeedsChange(val) {
  needsChange = val;
  document.getElementById('changeYesBtn').classList.toggle('active',  val);
  document.getElementById('changeNoBtn').classList.toggle('active',  !val);
  document.getElementById('cashAmountField').style.display = val ? 'flex' : 'none';
  if (!val) document.getElementById('changeInfo').style.display = 'none';
}

function updateChange() {
  const total  = calcTotal();
  const amount = parseFloat(document.getElementById('cashAmount')?.value) || 0;
  const infoEl = document.getElementById('changeInfo');
  if (!infoEl) return;
  if (amount <= 0) { infoEl.style.display = 'none'; return; }
  infoEl.style.display = 'block';
  if (amount < total) {
    infoEl.className   = 'change-info warn';
    infoEl.textContent = `⚠️ Valor insuficiente! Faltam R$ ${(total - amount).toFixed(2).replace('.',',')}`;
  } else {
    infoEl.className   = 'change-info ok';
    infoEl.textContent = `✅ Troco: R$ ${(amount - total).toFixed(2).replace('.',',')}`;
  }
}

function copyPix() {
  navigator.clipboard.writeText('51984475041').then(() => showToast('✅ Chave PIX copiada!'));
}

function confirmPayment() {
  if (!chosenPayment) { showToast('⚠️ Escolha uma forma de pagamento!'); return; }
  if (chosenPayment === 'pix' && !pixProofFile) { showToast('⚠️ Anexe o comprovante do PIX!'); return; }
  if (chosenPayment === 'dinheiro' && needsChange) {
    const total  = calcTotal();
    const amount = parseFloat(document.getElementById('cashAmount')?.value) || 0;
    if (!amount || amount < total) { showToast('⚠️ Informe o valor correto para troco!'); return; }
  }
  sendWhatsapp();
}

function sendWhatsapp() {
  const total  = calcTotal();
  const method = chosenMethod === 'entrega' ? 'Entrega (Uber-moto)' : 'Retirada no local';
  const troco  = needsChange
    ? `Dinheiro (troco de R$ ${(parseFloat(document.getElementById('cashAmount')?.value||0)).toFixed(2).replace('.',',')})`
    : 'Dinheiro (sem troco)';
  const pay    = chosenPayment === 'pix' ? 'PIX' : troco;

  let msg = `🌿 *Pedido Manas Fit Marmitas* 🌿\n\n`;
  msg += `👤 *Nome:* ${customerInfo.name}\n`;
  msg += `📱 *Celular:* ${customerInfo.phone}\n`;
  if (chosenMethod === 'entrega') msg += `📍 *Endereço:* ${customerInfo.address}\n`;
  msg += `🚗 *Envio:* ${method}\n`;
  msg += `💳 *Pagamento:* ${pay}\n\n`;
  msg += `🛒 *Itens do pedido:*\n`;
  cart.forEach(item => {
    msg += `  • ${item.qty}x ${item.name} — R$ ${(item.price * item.qty).toFixed(2).replace('.',',')}\n`;
    if (item.details) msg += `    (${item.details})\n`;
  });
  msg += `\n💰 *Total: R$ ${total.toFixed(2).replace('.',',')}*`;
  if (chosenPayment === 'pix') msg += `\n\n📎 *(Comprovante de PIX será anexado em seguida)*`;

  window.open(`https://wa.me/5551984475048?text=${encodeURIComponent(msg)}`, '_blank');
  cart = [];
  updateBadge();
  closeCart();
  showToast('✅ Pedido enviado! Obrigada 💚');
}

// ════════════════════════════════════════════════════════════════════════════
// RENDERIZAR CARRINHO
// ════════════════════════════════════════════════════════════════════════════
function renderCart() {
  const el    = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');
  if (cart.length === 0) {
    el.innerHTML = `<div class="cart-empty"><span class="emoji">🍽️</span><p>Seu carrinho está vazio.<br>Adicione delícias do nosso cardápio!</p></div>`;
    if (total) total.textContent = 'R$ 0,00';
    return;
  }
  el.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        ${item.details ? `<p>${item.details}</p>` : ''}
      </div>
      <div class="cart-item-right">
        <div class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.',',')}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem(${i})">Remover</button>
      </div>
    </div>
  `).join('');
  if (total) total.textContent = 'R$ ' + calcTotal().toFixed(2).replace('.',',');
}

function calcTotal()       { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function changeQty(i, d)   { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i,1); updateBadge(); renderCart(); }
function removeItem(i)     { cart.splice(i,1); updateBadge(); renderCart(); }
function clearCart()       { cart = []; updateBadge(); renderCart(); }
function updateBadge()     { const b = document.getElementById('cartBadge'); if(b) b.textContent = cart.reduce((s,i)=>s+i.qty,0); }

function addToCart(name, price) {
  if (!IS_LOGGED) { openCart(); return; }
  const existing = cart.find(i => i.name === name && !i.details);
  if (existing) existing.qty++;
  else cart.push({ name, price, qty: 1, details: '' });
  updateBadge();
  showToast(`✅ ${name} adicionado!`);
}

// ════════════════════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ════════════════════════════════════════════════════════════════════════════
// SELEÇÃO DE INGREDIENTES — SINGLE (com toggle de desmarcação)
// ════════════════════════════════════════════════════════════════════════════
function selectSingle(btn, group) {
  const alreadySelected = btn.classList.contains('selected');

  // Remove seleção de todos do grupo
  document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.classList.remove('selected'));

  if (alreadySelected) {
    // Toggle: desmarcar se já estava selecionado
    marmitaSelections[group] = null;
  } else {
    // Selecionar
    btn.classList.add('selected');
    marmitaSelections[group] = btn.dataset.name;
  }
  updateBuilderSummary();
}

// ════════════════════════════════════════════════════════════════════════════
// SELEÇÃO MÚLTIPLA (com toggle de desmarcação individual)
// ════════════════════════════════════════════════════════════════════════════
function selectMulti(btn, group, max) {
  const stateObj = group.startsWith('mb') ? mbSelections : marmitaSelections;

  if (btn.classList.contains('selected')) {
    // Toggle: desmarcar
    btn.classList.remove('selected');
    stateObj[group] = (stateObj[group] || []).filter(n => n !== btn.dataset.name);
  } else {
    if ((stateObj[group]?.length || 0) >= max) {
      showToast(`⚠️ Máximo de ${max} opção(ões) para este campo! Clique em uma opção selecionada para desmarcá-la.`);
      return;
    }
    btn.classList.add('selected');
    if (!stateObj[group]) stateObj[group] = [];
    stateObj[group].push(btn.dataset.name);
  }

  if (group.startsWith('mb')) updateMbSummary();
  else updateBuilderSummary();
}

// ════════════════════════════════════════════════════════════════════════════
// TAMANHO DA MARMITA — com toggle de desmarcação
// ════════════════════════════════════════════════════════════════════════════
function selectMarmitaSize(btn, size) {
  const alreadySelected = btn.classList.contains('selected');

  // Limpa seleção anterior
  document.querySelectorAll('#marmitaSizeGrid .size-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('combos450').style.display = 'none';
  document.getElementById('combos750').style.display = 'none';
  document.querySelectorAll('#combos450 .combo-card, #combos750 .combo-card').forEach(c => c.classList.remove('selected'));
  marmitaCombo = null;

  if (alreadySelected) {
    // Toggle: desmarcar tamanho
    marmitaSize = null;
  } else {
    // Selecionar novo tamanho
    btn.classList.add('selected');
    marmitaSize = size;
    document.getElementById(size === '450g' ? 'combos450' : 'combos750').style.display = 'block';
  }

  updateBuilderSummary();
  updateMarmitaPrice();
}

// ════════════════════════════════════════════════════════════════════════════
// TAMANHO DA MASSA — com toggle de desmarcação
// ════════════════════════════════════════════════════════════════════════════
function selectMassaSize(btn, size) {
  const alreadySelected = btn.classList.contains('selected');

  // Limpa seleção anterior
  document.querySelectorAll('#massaSizeGrid .size-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('combosMB450').style.display = 'none';
  document.getElementById('combosMB750').style.display = 'none';
  document.querySelectorAll('#combosMB450 .combo-card, #combosMB750 .combo-card').forEach(c => c.classList.remove('selected'));
  mbCombo = null;

  if (alreadySelected) {
    // Toggle: desmarcar tamanho
    mbSize = null;
  } else {
    // Selecionar novo tamanho
    btn.classList.add('selected');
    mbSize = size;
    document.getElementById(size === '450g' ? 'combosMB450' : 'combosMB750').style.display = 'block';
  }

  updateMbSummary();
  updateMbPrice();
}

// ════════════════════════════════════════════════════════════════════════════
// COMBOS — com toggle de desmarcação
// ════════════════════════════════════════════════════════════════════════════
function selectCombo(product, size, qty, price) {
  const clickedCard = event.currentTarget;

  if (product === 'marmita') {
    const alreadySelected = clickedCard.classList.contains('selected');
    document.querySelectorAll('#combos450 .combo-card, #combos750 .combo-card').forEach(c => c.classList.remove('selected'));
    if (alreadySelected) {
      marmitaCombo = null;  // Toggle: desmarcar
    } else {
      clickedCard.classList.add('selected');
      marmitaCombo = { qty, price };
    }
    updateBuilderSummary();
    updateMarmitaPrice();
  } else {
    const alreadySelected = clickedCard.classList.contains('selected');
    document.querySelectorAll('#combosMB450 .combo-card, #combosMB750 .combo-card').forEach(c => c.classList.remove('selected'));
    if (alreadySelected) {
      mbCombo = null;  // Toggle: desmarcar
    } else {
      clickedCard.classList.add('selected');
      mbCombo = { qty, price };
    }
    updateMbSummary();
    updateMbPrice();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// RESUMO MARMITA
// ════════════════════════════════════════════════════════════════════════════
function updateBuilderSummary() {
  const list  = document.getElementById('builderSummary');
  const sel   = marmitaSelections;
  const items = [];
  if (sel.proteina)     items.push(`<li><span class="cat">Proteína:</span> ${sel.proteina}</li>`);
  if (sel.carbo)        items.push(`<li><span class="cat">Carboidrato:</span> ${sel.carbo}</li>`);
  if (sel.extra)        items.push(`<li><span class="cat">Extra:</span> ${sel.extra}</li>`);
  if (sel.acomp?.length) items.push(`<li><span class="cat">Acompanhamentos:</span> ${sel.acomp.join(', ')}</li>`);
  if (marmitaSize)      items.push(`<li><span class="cat">Tamanho:</span> ${marmitaSize}</li>`);
  if (marmitaCombo)     items.push(`<li><span class="cat">Combo:</span> ${marmitaCombo.qty}x — R$ ${marmitaCombo.price.toFixed(2).replace('.',',')}</li>`);
  list.innerHTML = items.length
    ? items.join('')
    : '<li style="color:var(--muted); font-style:italic;">Nenhum ingrediente selecionado ainda...</li>';
}

function updateMarmitaPrice() {
  const priceEl = document.getElementById('marmitaPrice');
  const labelEl = document.getElementById('marmitaPriceLabel');
  if (!marmitaCombo) {
    priceEl.firstChild.textContent = 'R$ — ';
    labelEl.textContent = marmitaSize ? 'Selecione um combo acima' : 'Selecione um tamanho e combo';
    return;
  }
  priceEl.firstChild.textContent = `R$ ${marmitaCombo.price.toFixed(2).replace('.',',')} `;
  labelEl.textContent = `${marmitaCombo.qty}x marmita ${marmitaSize}`;
}

function addMarmitaToCart() {
  if (!IS_LOGGED) { openCart(); return; }
  const sel    = marmitaSelections;
  const errEl  = document.getElementById('builderError');
  const errors = [];
  if (!sel.proteina)        errors.push('Escolha uma proteína.');
  if (!sel.carbo)           errors.push('Escolha um carboidrato.');
  if (!sel.acomp?.length)   errors.push('Escolha ao menos 1 acompanhamento.');
  if (!marmitaSize)         errors.push('Escolha o tamanho (450g ou 750g).');
  if (!marmitaCombo)        errors.push('Escolha um combo.');
  if (errors.length) { errEl.innerHTML = errors.map(e => `• ${e}`).join('<br>'); errEl.classList.add('show'); return; }
  errEl.classList.remove('show');

  const details = [
    `Proteína: ${sel.proteina}`,
    `Carbo: ${sel.carbo}`,
    sel.extra ? `Extra: ${sel.extra}` : null,
    `Acomp: ${sel.acomp.join(', ')}`,
    `Tamanho: ${marmitaSize}`
  ].filter(Boolean).join(' | ');

  cart.push({ name: `Marmita ${marmitaSize} (${marmitaCombo.qty}x)`, price: marmitaCombo.price, qty: 1, details });
  updateBadge();
  showToast(`✅ ${marmitaCombo.qty}x Marmita ${marmitaSize} adicionada ao carrinho!`);
  clearMarmita();
}

function clearMarmita() {
  marmitaSelections = { proteina: null, carbo: null, extra: null, acomp: [] };
  marmitaSize  = null;
  marmitaCombo = null;
  // Desmarcar todos botões de ingredientes da marmita (exceto mbsabor)
  document.querySelectorAll('[data-group="proteina"],[data-group="carbo"],[data-group="extra"],[data-group="acomp"]')
    .forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('#marmitaSizeGrid .size-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('#combos450 .combo-card, #combos750 .combo-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('combos450').style.display = 'none';
  document.getElementById('combos750').style.display = 'none';
  document.getElementById('builderError')?.classList.remove('show');
  updateBuilderSummary();
  updateMarmitaPrice();
}

// ════════════════════════════════════════════════════════════════════════════
// MASSA AO MOLHO BRANCO
// ════════════════════════════════════════════════════════════════════════════
function updateMbSummary() {
  const list  = document.getElementById('mbSummary');
  const items = [];
  if (mbSelections.mbsabor?.length) items.push(`<li><span class="cat">Sabores:</span> ${mbSelections.mbsabor.join(' + ')}</li>`);
  if (mbSize)  items.push(`<li><span class="cat">Tamanho:</span> ${mbSize}</li>`);
  if (mbCombo) items.push(`<li><span class="cat">Combo:</span> ${mbCombo.qty}x — R$ ${mbCombo.price.toFixed(2).replace('.',',')}</li>`);
  list.innerHTML = items.length
    ? items.join('')
    : '<li style="color:var(--muted); font-style:italic;">Nenhuma opção selecionada ainda...</li>';
}

function updateMbPrice() {
  const priceEl = document.getElementById('mbPrice');
  const labelEl = document.getElementById('mbPriceLabel');
  if (!mbCombo) {
    priceEl.firstChild.textContent = 'R$ — ';
    labelEl.textContent = mbSize ? 'Selecione um combo acima' : 'Selecione tamanho e combo';
    return;
  }
  priceEl.firstChild.textContent = `R$ ${mbCombo.price.toFixed(2).replace('.',',')} `;
  labelEl.textContent = `${mbCombo.qty}x massa ${mbSize}`;
}

function addMassaToCart() {
  if (!IS_LOGGED) { openCart(); return; }
  const errEl  = document.getElementById('mbError');
  const errors = [];
  if (!mbSelections.mbsabor?.length) errors.push('Escolha ao menos 1 sabor.');
  if (!mbSize)  errors.push('Escolha o tamanho (450g ou 750g).');
  if (!mbCombo) errors.push('Escolha um combo.');
  if (errors.length) { errEl.innerHTML = errors.map(e => `• ${e}`).join('<br>'); errEl.classList.add('show'); return; }
  errEl.classList.remove('show');

  const details = `Sabores: ${mbSelections.mbsabor.join(' + ')} | Tamanho: ${mbSize}`;
  cart.push({ name: `Massa ao Molho Branco ${mbSize} (${mbCombo.qty}x)`, price: mbCombo.price, qty: 1, details });
  updateBadge();
  showToast(`✅ ${mbCombo.qty}x Massa ao Molho Branco adicionada!`);
  clearMassa();
}

function clearMassa() {
  mbSelections = { mbsabor: [] };
  mbSize  = null;
  mbCombo = null;
  document.querySelectorAll('[data-group="mbsabor"]').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('#massaSizeGrid .size-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('#combosMB450 .combo-card, #combosMB750 .combo-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('combosMB450').style.display = 'none';
  document.getElementById('combosMB750').style.display = 'none';
  document.getElementById('mbError')?.classList.remove('show');
  updateMbSummary();
  updateMbPrice();
}
