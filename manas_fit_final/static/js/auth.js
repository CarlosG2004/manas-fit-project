// ════════════════════════════════════════════════════════════════════════════
// AUTH MODAL — ABRIR / FECHAR
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════

async function doLogin() {
  clearErrors();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showError('loginError', 'Preencha e-mail e senha.'); return; }
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

// ════════════════════════════════════════════════════════════════════════════
// CADASTRO
// ════════════════════════════════════════════════════════════════════════════

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
      showSuccess('Conta criada! 🎉', `Bem-vindo(a), ${data.name}!`);
      setTimeout(() => location.reload(), 1600);
    } else {
      showError('registerError2', data.msg);
    }
  } catch {
    showError('registerError2', 'Erro de conexão. Tente novamente.');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════════════════════

async function doLogout() {
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
}

// ════════════════════════════════════════════════════════════════════════════
// ENTRAR COM GOOGLE — sem erro 400
// Exibe um diálogo informativo em vez de redirecionar para a API do Google
// (OAuth real requer configuração de client_id no Google Cloud Console)
// ════════════════════════════════════════════════════════════════════════════

function googleLogin() {
  // Cria um overlay de aviso amigável no lugar do redirect que gerava erro 400
  const existing = document.getElementById('googleInfoBox');
  if (existing) { existing.remove(); return; }

  const box = document.createElement('div');
  box.id        = 'googleInfoBox';
  box.innerHTML = `
    <div style="
      position:fixed; inset:0; z-index:9999;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.75); backdrop-filter:blur(6px);
    ">
      <div style="
        background:#1a1a1a; border:1px solid rgba(76,175,80,0.35);
        border-radius:18px; padding:36px 32px; max-width:380px; width:92%;
        text-align:center; font-family:'Nunito',sans-serif; color:#e8e8e8;
        box-shadow:0 20px 60px rgba(0,0,0,0.6);
      ">
        <div style="font-size:2.5rem; margin-bottom:14px;">🔐</div>
        <h3 style="font-family:'Playfair Display',serif; color:#81C784; font-size:1.3rem; margin-bottom:10px;">
          Login com Google
        </h3>
        <p style="color:#aaa; font-size:0.9rem; line-height:1.6; margin-bottom:20px;">
          A integração com o Google requer configuração do <strong>Google OAuth</strong> no servidor.
          Por enquanto, use <strong>e-mail e senha</strong> para entrar ou criar sua conta.
        </p>
        <button onclick="document.getElementById('googleInfoBox').remove()"
          style="background:linear-gradient(135deg,#2E7D32,#4CAF50);color:#fff;border:none;
            border-radius:50px;padding:12px 28px;font-family:'Nunito',sans-serif;
            font-weight:700;cursor:pointer;font-size:0.95rem;width:100%;">
          Entendido — Usar e-mail e senha
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(box);
  box.addEventListener('click', e => { if (e.target === box.firstElementChild) box.remove(); });
}

// ════════════════════════════════════════════════════════════════════════════
// MÁSCARAS
// ════════════════════════════════════════════════════════════════════════════

function maskCpf(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  el.value = v;
}

function maskPhone(el) {
  let v = el.value.replace(/\D/g,'').slice(0,11);
  if (v.length === 11)      v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (v.length >= 10)  v = v.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  el.value = v;
}

function maskCep(el) {
  let v = el.value.replace(/\D/g,'').slice(0,8);
  if (v.length > 5) v = v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  el.value = v;
}

// ════════════════════════════════════════════════════════════════════════════
// TECLADO
// ════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAuth();
    const gi = document.getElementById('googleInfoBox');
    if (gi) gi.remove();
  }
  if (e.key === 'Enter') {
    const loginView    = document.getElementById('viewLogin');
    const registerView = document.getElementById('viewRegister');
    if (loginView?.style.display    !== 'none') doLogin();
    else if (registerView?.style.display !== 'none') doRegister();
  }
});
