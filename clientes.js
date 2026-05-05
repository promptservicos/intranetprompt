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

// ========== VARIÁVEIS GLOBAIS ==========
let todosClientes = [];
let currentFilter = '';

// ========== CARREGAR CLIENTES DO FIRESTORE ==========
async function carregarClientes() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.add('active');
    
    try {
        const snapshot = await db.collection('clientes').get();
        todosClientes = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            todosClientes.push({
                id: doc.id,
                nome: data.nome || doc.id,
                cnpj: data.cnpj || '',
                email: data.email || '',
                telefone: data.telefone || '',
                endereco: data.endereco || ''
            });
        });
        
        // Ordenar clientes por nome
        todosClientes.sort((a, b) => {
            return a.nome.localeCompare(b.nome);
        });
        
        // Renderizar grid
        renderizarGrid();
        
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        showError("Erro ao carregar lista de clientes. Tente novamente mais tarde.");
    } finally {
        loadingIndicator.classList.remove('active');
    }
}

// ========== RENDERIZAR GRID DE CLIENTES ==========
function renderizarGrid() {
    const grid = document.getElementById('clientesGrid');
    grid.innerHTML = '';
    
    let clientesFiltrados = todosClientes;
    if (currentFilter) {
        const filterLower = currentFilter.toLowerCase();
        clientesFiltrados = todosClientes.filter(cliente => 
            cliente.nome.toLowerCase().includes(filterLower) ||
            (cliente.cnpj && cliente.cnpj.toLowerCase().includes(filterLower))
        );
    }
    
    if (clientesFiltrados.length === 0) {
        grid.innerHTML = '<div class="no-results">Nenhum cliente encontrado</div>';
        return;
    }
    
    clientesFiltrados.forEach(cliente => {
        const card = document.createElement('div');
        card.className = 'cliente-card';
        card.setAttribute('data-id', cliente.id);
        
        card.innerHTML = `
            <div class="cliente-avatar">
                <i class='bx bx-building'></i>
            </div>
            <div class="cliente-info">
                <div class="cliente-nome">${escapeHtml(cliente.nome)}</div>
                <div class="cliente-cnpj">${cliente.cnpj ? formatarCNPJ(escapeHtml(cliente.cnpj)) : 'CNPJ não informado'}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `cliente.html?id=${cliente.id}`;
        });
        
        grid.appendChild(card);
    });
}

// ========== FUNÇÃO PARA FORMATAR CNPJ ==========
function formatarCNPJ(cnpj) {
    // Remove tudo que não é número
    const numeros = cnpj.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (numeros.length === 14) {
        return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    
    // Se não tiver 14 dígitos, retorna o original
    return cnpj;
}

// ========== FUNÇÃO PARA ESCAPAR HTML ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== FUNÇÃO DE BUSCA ==========
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    currentFilter = searchInput.value;
    renderizarGrid();
}

// ========== EXIBIR ERRO ==========
function showError(message) {
    const grid = document.getElementById('clientesGrid');
    grid.innerHTML = `<div class="no-results" style="color: var(--accent-color);">${message}</div>`;
}

// ========== AUTENTICAÇÃO E DADOS DO USUÁRIO ==========
auth.onAuthStateChanged((user) => {
    if (user) {
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
        
        // Carregar clientes após autenticação
        carregarClientes();
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

// ========== EVENTOS DE BUSCA ==========
document.getElementById('searchButton').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});