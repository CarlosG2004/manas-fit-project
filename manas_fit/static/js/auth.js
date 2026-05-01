// ─── AUTH MODAL ───────────────────────────────────────────────────────────────

function openAuth() {
  document.getElementById('authOverlay').classList.add('open');
  const modal = document.getElementById('authModal');
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('open'), 10);
  showLogin();
}

function closeAuth() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
  document.getElementById('authOverlay').classList.remove('open');
}

function showLogin() {
  document.getElementById('viewLogin').style.display = 'block';
  document.getElementById('viewRegister').style.display = 'none';
  document.getElementById('viewSuccess').style.display = 'none';
  clearErrors();
}

function showRegister() {
  document.getElementById('viewLogin').style.display = 'none';
  document.getElementById('viewRegister').style.display = 'block';
  document.getElementById('viewSuccess').style.display = 'none';
  clearErrors();
}

function showSuccess(title, sub) {
  document.getElementById('viewLogin').style.display = 'none';
  document.getElementById('viewRegister').style.display = 'none';
  document.getElementById('viewSuccess').style.display = 'block';
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

// ─── LOGIN ────────────────────────────────────────────────────────────────────

async function doLogin() {
  clearErrors();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showError('loginError', 'Preencha e-mail e senha.');
    return;
  }

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.ok) {
      showSuccess('Login realizado! 🎉', `Bem-vindo(a), ${data.name}!`);
      setTimeout(() => location.reload(), 1400);
    } else {
      showError('loginError', data.msg);
    }
  } catch {
    showError('loginError', 'Erro de conexão. Tente novamente.');
  }
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

async function doRegister() {
  clearErrors();
  const name     = document.getElementById('regName').value.trim();
  const cpf      = document.getElementById('regCpf').value.trim();
  const phone    = document.getElementById('regPhone').value.trim();
  const cep      = document.getElementById('regCep').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!name || !cpf || !phone || !cep || !email || !password) {
    showError('registerError', 'Preencha todos os campos obrigatórios.');
    return;
  }

  try {
    const res  = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cpf, phone, cep, email, password })
    });
    const data = await res.json();
    if (data.ok) {
      showSuccess('Conta criada! 🎉', `Bem-vindo(a), ${data.name}! Seu cadastro foi realizado.`);
      setTimeout(() => location.reload(), 1600);
    } else {
      showError('registerError2', data.msg);
    }
  } catch {
    showError('registerError2', 'Erro de conexão. Tente novamente.');
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

async function doLogout() {
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
}

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────

function googleLogin() {
  // Opens Google OAuth — if user cancels or no account, returns to site
  const popup = window.open(
    'https://accounts.google.com/ServiceLogin?continue=' + encodeURIComponent(window.location.href),
    '_blank',
    'width=500,height=600'
  );
  if (!popup) {
    showError('loginError', 'Popup bloqueado. Permita popups para usar o Google.');
  }
}

// ─── MASKS ────────────────────────────────────────────────────────────────────

function maskCpf(el) {
  let v = el.value.replace(/\D/g, '').slice(0,11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  el.value = v;
}

function maskPhone(el) {
  let v = el.value.replace(/\D/g, '').slice(0,11);
  if (v.length === 11) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (v.length >= 10) v = v.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  el.value = v;
}

function maskCep(el) {
  let v = el.value.replace(/\D/g, '').slice(0,8);
  if (v.length > 5) v = v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  el.value = v;
}

// ─── ENTER KEY ────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuth();
  if (e.key === 'Enter') {
    if (document.getElementById('viewLogin').style.display !== 'none') doLogin();
    else if (document.getElementById('viewRegister').style.display !== 'none') doRegister();
  }
});
