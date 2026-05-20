// ════════════════════════════════════════════════════════════════════════════
// AUTH — 100% localStorage, sem backend, sem Google
// ════════════════════════════════════════════════════════════════════════════

// ─── HELPERS DE VALIDAÇÃO ────────────────────────────────────────────────────
function validateCpf(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || new Set(cpf).size === 1) return false;
  for (let i = 9; i <= 10; i++) {
    let s = 0;
    for (let j = 0; j < i; j++) s += parseInt(cpf[j]) * (i + 1 - j);
    if (parseInt(cpf[i]) !== (s * 10 % 11) % 10) return false;
  }
  return true;
}
function validatePhone(phone) { const d = phone.replace(/\D/g,''); return d.length >= 10 && d.length <= 11; }
function validateCep(cep) { return cep.replace(/\D/g,'').length === 8; }
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validatePassword(pw) {
  if (pw.length <= 6) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/\d/.test(pw)) return false;
  if (/[\s\u00C0-\u024F]/.test(pw)) return false;
  return true;
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────
function getUsers() { return JSON.parse(localStorage.getItem('mf_users') || '[]'); }
function saveUsers(u) { localStorage.setItem('mf_users', JSON.stringify(u)); }
function getCurrentUser() {
  const uid = localStorage.getItem('mf_session');
  if (!uid) return null;
  return getUsers().find(u => u.id === uid) || null;
}
function hashPw(pw) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) - h) + pw.charCodeAt(i); h |= 0; }
  return 'h_' + Math.abs(h).toString(36) + '_' + pw.length;
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openAuth() {
  document.getElementById('authOverlay').classList.add('open');
  const m = document.getElementById('authModal');
  m.style.display = 'block';
  setTimeout(() => m.classList.add('open'), 10);
  showLogin();
}
function closeAuth() {
  const m = document.getElementById('authModal');
  m.classList.remove('open');
  setTimeout(() => { m.style.display = 'none'; }, 300);
  document.getElementById('authOverlay').classList.remove('open');
}
function showLogin() {
  document.getElementById('viewLogin').style.display    = 'block';
  document.getElementById('viewRegister').style.display = 'none';
  document.getElementById('viewSuccess').style.display  = 'none';
  clearErrors();
}
function showRegister() {
  document.getElementById('viewLogin').style.display    = 'none';
  document.getElementById('viewRegister').style.display = 'block';
  document.getElementById('viewSuccess').style.display  = 'none';
  clearErrors();
}
function showSuccess(title, sub) {
  document.getElementById('viewLogin').style.display    = 'none';
  document.getElementById('viewRegister').style.display = 'none';
  document.getElementById('viewSuccess').style.display  = 'block';
  document.getElementById('successMsg').textContent = title;
  document.getElementById('successSub').textContent = sub;
}
function clearErrors() {
  ['loginError','registerError','registerError2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('show'); }
  });
}
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function doLogin() {
  clearErrors();
  const email    = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
  const password = document.getElementById('loginPassword').value || '';
  if (!email || !password) { showError('loginError', 'Preencha e-mail e senha.'); return; }
  const user = getUsers().find(u => u.email === email);
  if (!user || user.password !== hashPw(password)) { showError('loginError', 'E-mail ou senha incorretos.'); return; }
  localStorage.setItem('mf_session', user.id);
  IS_LOGGED = true;
  const firstName = user.name.split(' ')[0];
  updateNavUser(firstName);
  showSuccess('Login realizado! 🎉', `Bem-vindo(a), ${firstName}!`);
  setTimeout(() => closeAuth(), 1400);
}

// ─── CADASTRO ────────────────────────────────────────────────────────────────
function doRegister() {
  clearErrors();
  const name     = (document.getElementById('regName').value     || '').trim();
  const cpf      = (document.getElementById('regCpf').value      || '').trim();
  const phone    = (document.getElementById('regPhone').value    || '').trim();
  const cep      = (document.getElementById('regCep').value      || '').trim();
  const email    = (document.getElementById('regEmail').value    || '').trim().toLowerCase();
  const password = (document.getElementById('regPassword').value || '');
  if (!name || !cpf || !phone || !cep || !email || !password) { showError('registerError', 'Preencha todos os campos obrigatórios.'); return; }
  if (!validateCpf(cpf))       { showError('registerError2', 'CPF inválido.'); return; }
  if (!validatePhone(phone))   { showError('registerError2', 'Celular inválido.'); return; }
  if (!validateCep(cep))       { showError('registerError2', 'CEP inválido.'); return; }
  if (!validateEmail(email))   { showError('registerError2', 'E-mail inválido.'); return; }
  if (!validatePassword(password)) { showError('registerError2', 'Senha deve ter mais de 6 caracteres, maiúscula, minúscula e número. Sem espaços ou acentos.'); return; }
  const cpfC = cpf.replace(/\D/g,''), phoneC = phone.replace(/\D/g,''), cepC = cep.replace(/\D/g,'');
  const users = getUsers();
  if (users.find(u => u.cpf === cpfC))     { showError('registerError2','Este CPF já está cadastrado.'); return; }
  if (users.find(u => u.phone === phoneC)) { showError('registerError2','Este celular já está cadastrado.'); return; }
  if (users.find(u => u.email === email))  { showError('registerError2','Este e-mail já está cadastrado.'); return; }
  const nu = { id:'u_'+Date.now().toString(36), name, email, cpf:cpfC, phone:phoneC, cep:cepC, password:hashPw(password) };
  users.push(nu); saveUsers(users);
  localStorage.setItem('mf_session', nu.id);
  IS_LOGGED = true;
  const firstName = nu.name.split(' ')[0];
  updateNavUser(firstName);
  showSuccess('Conta criada! 🎉', `Bem-vindo(a), ${firstName}!`);
  setTimeout(() => closeAuth(), 1600);
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
function doLogout() {
  localStorage.removeItem('mf_session');
  IS_LOGGED = false;
  updateNavUser(null);
  const cs = document.getElementById('cartSidebar'); if (cs) cs.classList.remove('open');
  const co = document.getElementById('cartOverlay'); if (co) co.classList.remove('open');
}

// ─── NAV USER ────────────────────────────────────────────────────────────────
function updateNavUser(firstName) {
  const li = document.getElementById('navAuthBtn');
  if (!li) return;
  if (firstName) {
    li.innerHTML = `<button class="nav-user-btn" onclick="doLogout()">👤 ${firstName} · Sair</button>`;
  } else {
    li.innerHTML = `<button class="nav-entrar-btn" onclick="openAuth()">Entrar</button>`;
  }
}

// ─── MÁSCARAS ────────────────────────────────────────────────────────────────
function maskCpf(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/,'$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/,'$1.$2');
  el.value = v;
}
function maskPhone(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length === 11)     v = v.replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3');
  else if (v.length >= 10) v = v.replace(/(\d{2})(\d{4,5})(\d{4})/,'($1) $2-$3');
  el.value = v;
}
function maskCep(el) {
  let v = el.value.replace(/\D/g,'').slice(0,8);
  if (v.length > 5) v = v.replace(/(\d{5})(\d{1,3})/,'$1-$2');
  el.value = v;
}

// ─── TECLADO ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuth();
  if (e.key === 'Enter') {
    const lv = document.getElementById('viewLogin');
    const rv = document.getElementById('viewRegister');
    if (lv?.style.display !== 'none') doLogin();
    else if (rv?.style.display !== 'none') doRegister();
  }
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
(function init() {
  const user = getCurrentUser();
  if (user) { IS_LOGGED = true; updateNavUser(user.name.split(' ')[0]); }
  else       { IS_LOGGED = false; updateNavUser(null); }
})();
