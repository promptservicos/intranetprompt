// ========== TEMA (CLARO/ESCURO) ==========
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeIcon.classList.remove('bx-moon');
    themeIcon.classList.add('bx-sun');
} else {
    document.body.classList.remove('dark');
    themeIcon.classList.remove('bx-sun');
    themeIcon.classList.add('bx-moon');
}

// Alternar tema ao clicar no botão
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    if (isDark) {
        themeIcon.classList.remove('bx-moon');
        themeIcon.classList.add('bx-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.classList.remove('bx-sun');
        themeIcon.classList.add('bx-moon');
        localStorage.setItem('theme', 'light');
    }
});

// ========== CONFIGURAÇÃO FIREBASE ==========
const firebaseConfig = {
    apiKey: "AIzaSyDrm6aDZ054tggEYFZIhpKbYmZCQYONq4I",
    authDomain: "intra-9a38d.firebaseapp.com",
    projectId: "intra-9a38d",
    storageBucket: "intra-9a38d.firebasestorage.app",
    messagingSenderId: "729542143030",
    appId: "1:729542143030:web:8ecb6aa4b989ebc217bc97",
    measurementId: "G-GX36SFKVR6"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ========== LEMBRAR SENHA (LOCALSTORAGE) ==========
window.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const rememberCheck = document.getElementById('rememberMe');
    
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        rememberCheck.checked = true;
    }
    if (rememberedPassword && rememberCheck.checked) {
        document.getElementById('senha').value = rememberedPassword;
    }
});

// ========== LOGIN ==========
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const loginBtn = document.querySelector('.login');
    
    loginBtn.textContent = 'Entrando...';
    loginBtn.disabled = true;
    
    auth.signInWithEmailAndPassword(email, senha)
        .then(async (userCredential) => {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', senha);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }
            
            // Redireciona para a intranet
            window.location.href = 'intranet.html';
        })
        .catch((error) => {
            loginBtn.textContent = 'Acessar Intranet';
            loginBtn.disabled = false;
            
            let alertMessage = '';
            switch (error.code) {
                case 'auth/user-not-found':
                    alertMessage = 'Usuário não encontrado. Verifique seu e-mail.';
                    break;
                case 'auth/wrong-password':
                    alertMessage = 'Senha incorreta. Tente novamente.';
                    break;
                case 'auth/invalid-email':
                    alertMessage = 'E-mail inválido.';
                    break;
                case 'auth/too-many-requests':
                    alertMessage = 'Muitas tentativas. Tente mais tarde ou redefina sua senha.';
                    break;
                default:
                    alertMessage = 'Erro ao fazer login: ' + error.message;
            }
            showAlert(alertMessage, 'error');
        });
});

// ========== MODAL DE RECUPERAÇÃO DE SENHA ==========
const modal = document.getElementById('passwordResetModal');
const forgotLink = document.getElementById('forgotPasswordLink');
const closeBtn = document.querySelector('.close');
const sendResetBtn = document.getElementById('sendResetEmail');

forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'flex';
    document.getElementById('resetAlertBox').innerHTML = '';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

sendResetBtn.addEventListener('click', () => {
    const email = document.getElementById('resetEmail').value;
    if (!email) {
        showResetAlert('Informe seu e-mail.', 'error');
        return;
    }
    
    sendResetBtn.textContent = 'Enviando...';
    sendResetBtn.disabled = true;
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showResetAlert('E-mail de redefinição enviado! Verifique sua caixa de entrada.', 'success');
            sendResetBtn.textContent = 'E-mail enviado!';
            setTimeout(() => {
                modal.style.display = 'none';
                sendResetBtn.textContent = 'Enviar instruções';
                sendResetBtn.disabled = false;
            }, 3000);
        })
        .catch((error) => {
            sendResetBtn.textContent = 'Enviar instruções';
            sendResetBtn.disabled = false;
            let errorMsg = error.code === 'auth/user-not-found' 
                ? 'Não há usuário com este e-mail.' 
                : 'Erro: ' + error.message;
            showResetAlert(errorMsg, 'error');
        });
});

// ========== FUNÇÕES AUXILIARES ==========
function showAlert(msg, type) {
    const box = document.getElementById('alertBox');
    box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => box.innerHTML = '', 5000);
}

function showResetAlert(msg, type) {
    const box = document.getElementById('resetAlertBox');
    box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}