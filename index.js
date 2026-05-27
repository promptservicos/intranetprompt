// ========== TEMA (CLARO/ESCURO) ==========
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme_prompt_intranet');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeIcon.classList.remove('bx-moon');
    themeIcon.classList.add('bx-sun');
} else {
    document.body.classList.remove('dark');
    themeIcon.classList.remove('bx-sun');
    themeIcon.classList.add('bx-moon');
    if (!savedTheme) localStorage.setItem('theme_prompt_intranet', 'light');
}

// Alternar tema ao clicar no botão
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    
    if (isDark) {
        themeIcon.classList.remove('bx-moon');
        themeIcon.classList.add('bx-sun');
        localStorage.setItem('theme_prompt_intranet', 'dark');
    } else {
        themeIcon.classList.remove('bx-sun');
        themeIcon.classList.add('bx-moon');
        localStorage.setItem('theme_prompt_intranet', 'light');
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Configurar persistência
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(console.error);

// ========== ELEMENTOS DOM ==========
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('senha');
const rememberCheckbox = document.getElementById('rememberMe');
const loginBtn = document.getElementById('loginBtn');
const togglePasswordBtn = document.getElementById('togglePassword');
const alertBox = document.getElementById('alertBox');
const supportLink = document.getElementById('supportLink');

// ========== VARIÁVEL PARA EVITAR REDIRECIONAMENTO MÚLTIPLO ==========
let isRedirecting = false;

// ========== LINK DO SUPORTE (WHATSAPP) ==========
if (supportLink) {
    supportLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://wa.me/5511977194737', '_blank');
    });
}

// ========== TOGGLE SENHA ==========
if (togglePasswordBtn && passwordInput) {
    const toggleIcon = togglePasswordBtn.querySelector('i');
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        if (type === 'text') {
            toggleIcon.classList.remove('bx-show');
            toggleIcon.classList.add('bx-hide');
        } else {
            toggleIcon.classList.remove('bx-hide');
            toggleIcon.classList.add('bx-show');
        }
    });
}

// ========== CARREGAR CREDENCIAIS SALVAS ==========
function loadSavedCredentials() {
    const savedEmail = localStorage.getItem('remembered_email_intranet');
    const savedPassword = localStorage.getItem('remembered_password_intranet');
    const remember = localStorage.getItem('remember_me_intranet') === 'true';
    
    if (remember && savedEmail) {
        emailInput.value = savedEmail;
        if (savedPassword) passwordInput.value = savedPassword;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

loadSavedCredentials();

// ========== SALVAR CREDENCIAIS ==========
function saveCredentials(email, senha, remember) {
    if (remember) {
        localStorage.setItem('remembered_email_intranet', email);
        localStorage.setItem('remembered_password_intranet', senha);
        localStorage.setItem('remember_me_intranet', 'true');
    } else {
        localStorage.removeItem('remembered_email_intranet');
        localStorage.removeItem('remembered_password_intranet');
        localStorage.setItem('remember_me_intranet', 'false');
    }
}

// ========== FUNÇÕES DE ALERTA ==========
function showAlert(msg, type) {
    if (alertBox) {
        alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
        setTimeout(() => {
            if (alertBox.innerHTML) alertBox.innerHTML = '';
        }, 5000);
    }
}

// Modal de mensagem
const messageModal = document.getElementById('messageModal');
const messageText = document.getElementById('messageText');
const messageIcon = document.getElementById('messageIcon');
const closeMessageModal = document.getElementById('closeMessageModal');
const messageOkBtn = document.getElementById('messageOkBtn');

function showMessageModal(message, isError = true) {
    if (messageText) messageText.textContent = message;
    if (messageIcon) {
        messageIcon.className = isError ? 'bx bx-error-circle modal-icon' : 'bx bx-check-circle modal-icon';
        if (!isError) messageIcon.style.color = '#2ecc71';
        else messageIcon.style.color = '#C10404';
    }
    if (messageModal) messageModal.style.display = 'flex';
}

function closeMessageModalFunc() {
    if (messageModal) messageModal.style.display = 'none';
}

if (closeMessageModal) closeMessageModal.addEventListener('click', closeMessageModalFunc);
if (messageOkBtn) messageOkBtn.addEventListener('click', closeMessageModalFunc);
if (messageModal) {
    messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) closeMessageModalFunc();
    });
}

// ========== VERIFICAR SESSÃO ATIVA ==========
function checkActiveSession() {
    setTimeout(() => {
        auth.onAuthStateChanged((user) => {
            if (user && !isRedirecting) {
                isRedirecting = true;
                window.location.href = 'intranet.html';
            }
        });
    }, 500);
}

checkActiveSession();

// ========== FUNÇÃO DE LOADING ==========
function setLoading(isLoading) {
    if (loginBtn) {
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span>Entrando</span><i class="bx bx-loader-alt bx-spin"></i>';
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Acessar Intranet</span><i class="bx bx-log-in"></i>';
        }
    }
}

// ========== LOGIN ==========
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const senha = passwordInput.value;
        const remember = rememberCheckbox ? rememberCheckbox.checked : false;
        
        // Validações
        if (!email || !senha) {
            showAlert('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Por favor, insira um e-mail válido.', 'error');
            return;
        }
        
        setLoading(true);
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, senha);
            const user = userCredential.user;
            
            if (user) {
                saveCredentials(email, senha, remember);
                showMessageModal('Login realizado com sucesso! Redirecionando...', false);
                
                setTimeout(() => {
                    window.location.href = 'intranet.html';
                }, 1500);
            }
        } catch (error) {
            let mensagemErro = 'E-mail ou senha inválidos.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    mensagemErro = 'Usuário não encontrado. Verifique o e-mail.';
                    break;
                case 'auth/wrong-password':
                    mensagemErro = 'Senha incorreta. Tente novamente.';
                    break;
                case 'auth/invalid-email':
                    mensagemErro = 'E-mail inválido.';
                    break;
                case 'auth/user-disabled':
                    mensagemErro = 'Esta conta foi desativada.';
                    break;
                case 'auth/too-many-requests':
                    mensagemErro = 'Muitas tentativas. Tente novamente mais tarde.';
                    break;
                case 'auth/network-request-failed':
                    mensagemErro = 'Erro de rede. Verifique sua conexão com a internet.';
                    break;
                default:
                    mensagemErro = error.message || 'Erro ao fazer login. Tente novamente.';
            }
            
            showAlert(mensagemErro, 'error');
            passwordInput.value = '';
            passwordInput.focus();
        } finally {
            setLoading(false);
        }
    });
}

// Permitir login com Enter
if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && loginForm) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
}

// ========== MODAL DE RECUPERAÇÃO DE SENHA ==========
const resetModal = document.getElementById('passwordResetModal');
const forgotLink = document.getElementById('forgotPasswordLink');
const closeResetBtn = document.querySelector('#passwordResetModal .close');
const sendResetBtn = document.getElementById('sendResetEmail');
const resetEmailInput = document.getElementById('resetEmail');
const resetAlertBox = document.getElementById('resetAlertBox');

function showResetAlert(msg, type) {
    if (resetAlertBox) {
        resetAlertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
        setTimeout(() => {
            if (resetAlertBox.innerHTML) resetAlertBox.innerHTML = '';
        }, 5000);
    }
}

if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (resetModal) {
            resetModal.style.display = 'flex';
            if (resetAlertBox) resetAlertBox.innerHTML = '';
            if (resetEmailInput) resetEmailInput.value = '';
        }
    });
}

if (closeResetBtn) {
    closeResetBtn.addEventListener('click', () => {
        if (resetModal) resetModal.style.display = 'none';
    });
}

if (resetModal) {
    resetModal.addEventListener('click', (e) => {
        if (e.target === resetModal) resetModal.style.display = 'none';
    });
}

if (sendResetBtn) {
    sendResetBtn.addEventListener('click', async () => {
        const email = resetEmailInput ? resetEmailInput.value.trim() : '';
        
        if (!email) {
            showResetAlert('Informe seu e-mail.', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showResetAlert('Informe um e-mail válido.', 'error');
            return;
        }
        
        sendResetBtn.disabled = true;
        sendResetBtn.innerHTML = '<span>Enviando</span><i class="bx bx-loader-alt bx-spin"></i>';
        
        try {
            await auth.sendPasswordResetEmail(email);
            showResetAlert('✅ E-mail de redefinição enviado! Verifique sua caixa de entrada.', 'success');
            sendResetBtn.innerHTML = '<span>Enviado!</span><i class="bx bx-check"></i>';
            
            setTimeout(() => {
                if (resetModal) resetModal.style.display = 'none';
                sendResetBtn.disabled = false;
                sendResetBtn.innerHTML = '<span>Enviar instruções</span><i class="bx bx-send"></i>';
            }, 3000);
        } catch (error) {
            sendResetBtn.disabled = false;
            sendResetBtn.innerHTML = '<span>Enviar instruções</span><i class="bx bx-send"></i>';
            
            let errorMsg = '';
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMsg = '❌ Não há usuário cadastrado com este e-mail.';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = '⚠️ Muitas tentativas. Aguarde alguns minutos e tente novamente.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = '🌐 Erro de rede. Verifique sua conexão com a internet.';
                    break;
                default:
                    errorMsg = '❌ Erro ao enviar e-mail. Tente novamente mais tarde.';
            }
            showResetAlert(errorMsg, 'error');
        }
    });
}