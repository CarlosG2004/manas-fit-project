"""
Manas Fit Marmitas — Backend Flask
Execute: python app.py
Acesse: http://localhost:5000
"""

from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import re

app = Flask(__name__)
app.secret_key = 'manas_fit_secret_2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///manas_fit.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ══════════════════════════════════════════════════════════════════════════════
# MODEL
# ══════════════════════════════════════════════════════════════════════════════

class User(db.Model):
    id       = db.Column(db.Integer,     primary_key=True)
    name     = db.Column(db.String(120), nullable=False)
    cpf      = db.Column(db.String(14),  unique=True, nullable=False)
    phone    = db.Column(db.String(20),  unique=True, nullable=False)
    cep      = db.Column(db.String(10),  nullable=False)
    email    = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)

with app.app_context():
    db.create_all()


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS DE VALIDAÇÃO
# ══════════════════════════════════════════════════════════════════════════════

def validate_cpf(cpf: str) -> bool:
    cpf = re.sub(r'\D', '', cpf)
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    for i in range(9, 11):
        s = sum(int(cpf[j]) * (i + 1 - j) for j in range(i))
        if int(cpf[i]) != (s * 10 % 11) % 10:
            return False
    return True

def validate_phone(phone: str) -> bool:
    phone = re.sub(r'\D', '', phone)
    return 10 <= len(phone) <= 11

def validate_cep(cep: str) -> bool:
    cep = re.sub(r'\D', '', cep)
    return len(cep) == 8

def validate_email(email: str) -> bool:
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email))

def validate_password(pw: str) -> bool:
    """Mais de 6 chars, maiúscula, minúscula, número, sem espaço ou acento."""
    if len(pw) <= 6:
        return False
    if not re.search(r'[A-Z]', pw):
        return False
    if not re.search(r'[a-z]', pw):
        return False
    if not re.search(r'\d', pw):
        return False
    if re.search(r'[\s\u00C0-\u024F]', pw):
        return False
    return True


# ══════════════════════════════════════════════════════════════════════════════
# ROTAS DE PÁGINA
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/')
def index():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('index.html', user=user)

@app.route('/cardapio')
def cardapio():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
    return render_template('cardapio.html', user=user)


# ══════════════════════════════════════════════════════════════════════════════
# API — AUTENTICAÇÃO
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name     = (data.get('name')     or '').strip()
    cpf      = (data.get('cpf')      or '').strip()
    phone    = (data.get('phone')    or '').strip()
    cep      = (data.get('cep')      or '').strip()
    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '')

    if not all([name, cpf, phone, cep, email, password]):
        return jsonify(ok=False, msg='Preencha todos os campos obrigatórios.')

    if not validate_cpf(cpf):
        return jsonify(ok=False, msg='CPF inválido. Verifique e tente novamente.')
    if not validate_phone(phone):
        return jsonify(ok=False, msg='Número de celular inválido.')
    if not validate_cep(cep):
        return jsonify(ok=False, msg='CEP inválido. Informe os 8 dígitos.')
    if not validate_email(email):
        return jsonify(ok=False, msg='E-mail inválido.')
    if not validate_password(password):
        return jsonify(ok=False, msg='Senha deve ter mais de 6 caracteres, com letras maiúsculas, minúsculas e números. Sem espaços ou acentos.')

    cpf_clean   = re.sub(r'\D', '', cpf)
    phone_clean = re.sub(r'\D', '', phone)

    if User.query.filter_by(cpf=cpf_clean).first():
        return jsonify(ok=False, msg='Este CPF já está cadastrado.')
    if User.query.filter_by(phone=phone_clean).first():
        return jsonify(ok=False, msg='Este número de celular já está cadastrado.')
    if User.query.filter_by(email=email).first():
        return jsonify(ok=False, msg='Este e-mail já está cadastrado.')

    user = User(
        name=name, cpf=cpf_clean, phone=phone_clean,
        cep=re.sub(r'\D', '', cep), email=email,
        password=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    session['user_id'] = user.id
    return jsonify(ok=True, msg='Cadastro realizado com sucesso!', name=user.name)


@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '')

    if not email or not password:
        return jsonify(ok=False, msg='Preencha e-mail e senha.')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify(ok=False, msg='E-mail ou senha incorretos.')

    session['user_id'] = user.id
    return jsonify(ok=True, msg='Login realizado!', name=user.name)


@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify(ok=True)


@app.route('/api/me')
def me():
    if 'user_id' not in session:
        return jsonify(logged=False)
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify(logged=False)
    return jsonify(logged=True, name=user.name, email=user.email)


# ══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    app.run(debug=True, port=5000)
