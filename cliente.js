// ========== TEMA (CLARO/ESCURO) ==========
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');
const logoImg = document.getElementById('logoImg');

function updateLogo() {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
        logoImg.src = 'img/logo1b.png';
    } else {
        logoImg.src = 'img/logo1v.png';
    }
}

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
updateLogo();

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
    updateLogo();
});

// ========== FIREBASE CONFIG ==========
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

// ========== PEGAR ID DO CLIENTE DA URL ==========
function getClienteId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// ========== FUNÇÃO PARA FORMATAR CNPJ ==========
function formatarCNPJ(cnpj) {
    if (!cnpj) return 'Não informado';
    const numeros = cnpj.replace(/\D/g, '');
    if (numeros.length === 14) {
        return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
}

// ========== FUNÇÃO PARA FORMATAR TELEFONE ==========
function formatarTelefone(telefone) {
    if (!telefone) return 'Não informado';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 10) {
        return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }
    if (numeros.length === 11) {
        return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return telefone;
}

// ========== CARREGAR DADOS DO CLIENTE ==========
async function carregarCliente() {
    const clienteId = getClienteId();
    
    if (!clienteId) {
        mostrarErro();
        return;
    }
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    const clienteContent = document.getElementById('clienteContent');
    const errorMessage = document.getElementById('errorMessage');
    
    loadingIndicator.style.display = 'block';
    
    try {
        const doc = await db.collection('clientes').doc(clienteId).get();
        
        if (!doc.exists) {
            mostrarErro();
            return;
        }
        
        const data = doc.data();
        
        // Preencher os campos
        document.getElementById('clienteNome').textContent = data.nome || 'Nome não informado';
        document.getElementById('clienteCNPJ').innerHTML = `<i class='bx bx-receipt'></i> CNPJ: ${formatarCNPJ(data.cnpj)}`;
        document.getElementById('clienteRazaoSocial').textContent = data.rsocial || data.razao_social || 'Não informado';
        document.getElementById('clienteContato').textContent = data.contato || 'Não informado';
        document.getElementById('clienteEmail').textContent = data.email || 'Não informado';
        document.getElementById('clienteTelefone').textContent = formatarTelefone(data.telefone);
        document.getElementById('clienteEndereco').textContent = data.endereco || 'Não informado';
        document.getElementById('clienteInscricaoEstadual').textContent = data.iestadual || data.inscricao_estadual || 'Não informado';
        
        // Mostrar conteúdo e esconder loading
        loadingIndicator.style.display = 'none';
        clienteContent.style.display = 'block';
        
    } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        mostrarErro();
    }
}

// ========== MOSTRAR MENSAGEM DE ERRO ==========
function mostrarErro() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    
    loadingIndicator.style.display = 'none';
    errorMessage.style.display = 'block';
}

// ========== AUTENTICAÇÃO ==========
auth.onAuthStateChanged((user) => {
    if (user) {
        // Buscar dados do usuário logado
        db.collection('usuarios').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById('userName').textContent = userData.nome;
                    document.getElementById('userRole').textContent = userData.cargo || 'Colaborador';
                    
                    const names = userData.nome.split(' ');
                    const initials = names[0].charAt(0) + (names.length > 1 ? names[names.length-1].charAt(0) : '');
                    document.getElementById('userAvatar').textContent = initials;
                }
            })
            .catch(error => console.error("Erro ao buscar usuário:", error));
        
        // Carregar dados do cliente
        carregarCliente();
    } else {
        window.location.href = 'index.html';
    }
});

// ========== LOGOUT ==========
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch(error => console.error("Erro no logout:", error));
});

// ========== PAINEL DO USUÁRIO CLICÁVEL ==========
const userInfoPanel = document.getElementById('userInfoPanel');
userInfoPanel.addEventListener('click', () => {
    window.location.href = 'perfil.html';
});

// ========== LOGO CLICÁVEL ==========
document.getElementById('logoHome').addEventListener('click', () => {
    window.location.href = 'intranet.html';
});