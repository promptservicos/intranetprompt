// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDrm6aDZ054tggEYFZIhpKbYmZCQYONq4I",
    authDomain: "intra-9a38d.firebaseapp.com",
    projectId: "intra-9a38d",
    storageBucket: "intra-9a38d.firebasestorage.app",
    messagingSenderId: "729542143030",
    appId: "1:729542143030:web:8ecb6aa4b989ebc217bc97",
    measurementId: "G-GX36SFKVR6"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Verificar se há credenciais salvas para "Lembrar senha"
window.addEventListener('DOMContentLoaded', () => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const rememberMe = document.getElementById('rememberMe');
    
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        rememberMe.checked = true;
    }
    
    if (rememberedPassword && rememberMe.checked) {
        document.getElementById('senha').value = rememberedPassword;
    }
});

// Manipular envio do formulário de login
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
            
            const userDoc = await db.collection('usuarios').doc(userCredential.user.uid).get();
            window.location.href = 'intranet.html';
        })
        .catch((error) => {
            loginBtn.textContent = 'Acessar Intranet';
            loginBtn.disabled = false;
            
            const errorCode = error.code;
            let alertMessage = '';
            
            if (errorCode === 'auth/user-not-found') {
                alertMessage = 'Usuário não encontrado. Verifique seu e-mail.';
            } else if (errorCode === 'auth/wrong-password') {
                alertMessage = 'Senha incorreta. Tente novamente.';
            } else if (errorCode === 'auth/invalid-email') {
                alertMessage = 'E-mail inválido.';
            } else if (errorCode === 'auth/too-many-requests') {
                alertMessage = 'Muitas tentativas malsucedidas. Tente novamente mais tarde ou redefina sua senha.';
            } else {
                alertMessage = 'Erro ao fazer login: ' + error.message;
            }
            
            showAlert(alertMessage, 'error');
        });
});

// Modal de recuperação de senha
const modal = document.getElementById('passwordResetModal');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeBtn = document.querySelector('.close');
const sendResetBtn = document.getElementById('sendResetEmail');

forgotPasswordLink.addEventListener('click', function(e) {
    e.preventDefault();
    modal.style.display = 'flex';
    document.getElementById('resetAlertBox').innerHTML = '';
});

closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Enviar e-mail de redefinição de senha
sendResetBtn.addEventListener('click', function() {
    const email = document.getElementById('resetEmail').value;
    
    if (!email) {
        showResetAlert('Por favor, informe seu e-mail.', 'error');
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
            
            const errorCode = error.code;
            let errorMessage = '';
            
            if (errorCode === 'auth/user-not-found') {
                errorMessage = 'Não há usuário correspondente a este e-mail.';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            } else {
                errorMessage = 'Erro ao enviar e-mail de redefinição: ' + error.message;
            }
            
            showResetAlert(errorMessage, 'error');
        });
});

// Funções auxiliares para exibir alertas
function showAlert(message, type) {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertBox.innerHTML = '';
    }, 5000);
}

function showResetAlert(message, type) {
    const alertBox = document.getElementById('resetAlertBox');
    alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}