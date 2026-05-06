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

// ========== USUÁRIOS AUTORIZADOS PARA EDITAR CLIENTES ==========
const USUARIOS_AUTORIZADOS_IDS = [
    "AYcRWgTIRndQWnb5oyTHxLPNAtv2",
    "rDPXgiatpDUCL3dJ7NyAPL0mLtD3",
    "LptL8Wg2heSJKwPHowBxujIsR0E2"
];

const USUARIOS_AUTORIZADOS_EMAILS = [
    "fabiomansur@promptservicos.com.br",
    "fabio@promptservicos.com.br",
    "marketing@promptservicos.com.br"
];

const DEPARTAMENTOS_AUTORIZADOS = [
    "DP",
    "Departamento Pessoal"
];

// ========== VARIÁVEIS GLOBAIS ==========
let todosClientes = [];
let currentFilter = '';
let podeEditarClientes = false;

// ========== FUNÇÃO PARA VERIFICAR PERMISSÃO DE EDIÇÃO ==========
async function verificarPermissaoEdicao(user) {
    if (USUARIOS_AUTORIZADOS_IDS.includes(user.uid)) {
        podeEditarClientes = true;
        return true;
    }
    
    if (user.email && USUARIOS_AUTORIZADOS_EMAILS.includes(user.email)) {
        podeEditarClientes = true;
        return true;
    }
    
    try {
        const doc = await db.collection('usuarios').doc(user.uid).get();
        if (doc.exists) {
            const userData = doc.data();
            const departamento = userData.departamento || userData.cargo || '';
            const acessoPorDepartamento = DEPARTAMENTOS_AUTORIZADOS.some(
                dept => departamento.toLowerCase().includes(dept.toLowerCase())
            );
            if (acessoPorDepartamento) {
                podeEditarClientes = true;
                return true;
            }
        }
    } catch (error) {
        console.error("Erro ao verificar departamento:", error);
    }
    
    podeEditarClientes = false;
    return false;
}

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
                codigogi: data.codigogi || '',
                rsocial: data.rsocial || data.razao_social || '',
                contato: data.contato || '',
                email: data.email || '',
                telefone: data.telefone || '',
                endereco: data.endereco || '',
                iestadual: data.iestadual || ''
            });
        });
        
        todosClientes.sort((a, b) => a.nome.localeCompare(b.nome));
        
        const btnNovoCliente = document.getElementById('btnNovoCliente');
        if (btnNovoCliente) {
            btnNovoCliente.style.display = podeEditarClientes ? 'flex' : 'none';
        }
        
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

// ========== FUNÇÕES DE FORMATAÇÃO ==========
function formatarCNPJ(cnpj) {
    const numeros = cnpj.replace(/\D/g, '');
    if (numeros.length === 14) {
        return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
}

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

function showError(message) {
    const grid = document.getElementById('clientesGrid');
    grid.innerHTML = `<div class="no-results" style="color: var(--accent-color);">${message}</div>`;
}

// ========== FUNÇÃO PARA SANITIZAR NOME (usar como ID) ==========
function sanitizarNome(nome) {
    return nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
}

// ========== FUNÇÕES DO MODAL DE CLIENTE ==========
function abrirModalNovoCliente() {
    if (!podeEditarClientes) {
        alert('Você não tem permissão para cadastrar clientes.');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Novo Cliente';
    document.getElementById('clienteForm').reset();
    document.getElementById('clienteModal').style.display = 'flex';
    window.editandoClienteId = null;
}

function fecharModalCliente() {
    document.getElementById('clienteModal').style.display = 'none';
    document.getElementById('clienteForm').reset();
    window.editandoClienteId = null;
}

async function salvarCliente(event) {
    event.preventDefault();
    
    if (!podeEditarClientes) {
        alert('Você não tem permissão para cadastrar/editar clientes.');
        return;
    }
    
    const nomeCliente = document.getElementById('clienteNome').value.trim();
    
    if (!nomeCliente) {
        alert('O nome do cliente é obrigatório.');
        return;
    }
    
    const clienteData = {
        nome: nomeCliente,
        cnpj: document.getElementById('clienteCNPJ').value.trim(),
        codigogi: document.getElementById('clienteCodigoGI').value.trim(),
        rsocial: document.getElementById('clienteRazaoSocial').value.trim(),
        contato: document.getElementById('clienteContato').value.trim(),
        email: document.getElementById('clienteEmail').value.trim(),
        telefone: document.getElementById('clienteTelefone').value.trim(),
        endereco: document.getElementById('clienteEndereco').value.trim(),
        iestadual: document.getElementById('clienteInscricaoEstadual').value.trim()
    };
    
    try {
        if (window.editandoClienteId) {
            await db.collection('clientes').doc(window.editandoClienteId).update(clienteData);
        } else {
            const clienteId = sanitizarNome(nomeCliente);
            const docRef = db.collection('clientes').doc(clienteId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                const resposta = confirm(`Já existe um cliente com o nome "${nomeCliente}". Deseja sobrescrever? Clique em Cancelar para criar com um sufixo.`);
                
                if (resposta) {
                    await docRef.set(clienteData);
                } else {
                    let novoId = clienteId;
                    let contador = 1;
                    let docExistente = await db.collection('clientes').doc(novoId).get();
                    
                    while (docExistente.exists) {
                        contador++;
                        novoId = `${clienteId}_${contador}`;
                        docExistente = await db.collection('clientes').doc(novoId).get();
                    }
                    
                    await db.collection('clientes').doc(novoId).set(clienteData);
                }
            } else {
                await docRef.set(clienteData);
            }
        }
        
        fecharModalCliente();
        await carregarClientes();
        
    } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        alert('Erro ao salvar cliente. Verifique suas permissões.');
    }
}

// ========== AUTENTICAÇÃO ==========
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await verificarPermissaoEdicao(user);
        
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
        
        await carregarClientes();
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
if (userInfoPanel) {
    userInfoPanel.addEventListener('click', () => {
        window.location.href = 'perfil.html';
    });
}

// ========== LOGO CLICÁVEL ==========
document.getElementById('logoHome').addEventListener('click', () => {
    window.location.href = 'intranet.html';
});

// ========== EVENTOS DE BUSCA ==========
const searchButton = document.getElementById('searchButton');
if (searchButton) {
    searchButton.addEventListener('click', performSearch);
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// ========== EVENTOS DO MODAL DE CLIENTE ==========
const btnNovoCliente = document.getElementById('btnNovoCliente');
if (btnNovoCliente) {
    btnNovoCliente.addEventListener('click', abrirModalNovoCliente);
}

const modalCloseCliente = document.querySelector('.modal-close-cliente');
if (modalCloseCliente) {
    modalCloseCliente.addEventListener('click', fecharModalCliente);
}

const btnCancelarCliente = document.getElementById('btnCancelarCliente');
if (btnCancelarCliente) {
    btnCancelarCliente.addEventListener('click', fecharModalCliente);
}

const clienteForm = document.getElementById('clienteForm');
if (clienteForm) {
    clienteForm.addEventListener('submit', salvarCliente);
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('clienteModal');
    if (e.target === modal) {
        fecharModalCliente();
    }
});

// ========== FORMATAÇÃO AUTOMÁTICA ==========
const cnpjInput = document.getElementById('clienteCNPJ');
if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 14) value = value.slice(0, 14);
        if (value.length === 14) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        }
        e.target.value = value;
    });
}

const telefoneInput = document.getElementById('clienteTelefone');
if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length === 10) {
            value = value.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
        } else if (value.length === 11) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        }
        e.target.value = value;
    });
}

// ========== BOTÃO DE TEMA STICKY ==========
function ajustarBotaoTema() {
    const themeBtn = document.getElementById('themeToggle');
    const footer = document.querySelector('footer');
    
    if (!themeBtn || !footer) return;
    
    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    const themeBtnHeight = themeBtn.offsetHeight;
    
    if (footerTop < windowHeight - 50) {
        const stopPosition = footerTop - themeBtnHeight - 20;
        if (stopPosition < windowHeight - themeBtnHeight - 20) {
            themeBtn.style.position = 'absolute';
            themeBtn.style.bottom = 'auto';
            themeBtn.style.top = `${footer.offsetTop - themeBtnHeight - 20}px`;
            themeBtn.style.right = '20px';
        }
    } else {
        themeBtn.style.position = 'fixed';
        themeBtn.style.bottom = '20px';
        themeBtn.style.top = 'auto';
        themeBtn.style.right = '20px';
    }
}

window.addEventListener('scroll', ajustarBotaoTema);
window.addEventListener('resize', ajustarBotaoTema);
setTimeout(ajustarBotaoTema, 100);