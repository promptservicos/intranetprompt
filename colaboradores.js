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

// ========== DEPARTAMENTOS FIXOS (ORDEM DEFINIDA) ==========
const departamentosFixos = [
    "PABX",
    "Recrutamento e Seleção",
    "Comercial",
    "Marketing",
    "Departamento Pessoal",
    "Financeiro",
    "Administrativo"
];

// ========== ITENS FIXOS (PABX e Sala de Reunião) ==========
const itensFixosPorDepartamento = {
    "PABX": [
        {
            name: "Michelle",
            phone: "200",
            email: "recepcao.sp@promptservicos.com.br"
        }
    ],
    "Administrativo": [
        {
            name: "Sala de Reunião",
            phone: "237",
            email: "**"
        }
    ]
};

// ========== VARIÁVEIS GLOBAIS ==========
let colaboradoresPorDepartamento = {}; // Objeto: { "Departamento": [colaboradores] }
let currentFilter = '';

// ========== CARREGAR COLABORADORES DO FIRESTORE ==========
async function carregarColaboradores() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.add('active');
    
    try {
        // Inicializar estrutura com departamentos fixos
        colaboradoresPorDepartamento = {};
        departamentosFixos.forEach(dept => {
            colaboradoresPorDepartamento[dept] = [];
        });
        
        // Buscar todos os usuários do Firebase
        const snapshot = await db.collection('usuarios').get();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Só adiciona se tiver nome e departamento
            if (data.nome && data.departamento) {
                const dept = data.departamento;
                // Verificar se o departamento está na lista de fixos
                if (colaboradoresPorDepartamento.hasOwnProperty(dept)) {
                    colaboradoresPorDepartamento[dept].push({
                        name: data.nome,
                        phone: data.ramal || 'Não informado',
                        email: data.email || `${data.nome.toLowerCase().replace(/\s/g, '.')}@promptservicos.com.br`,
                        cargo: data.cargo || '',
                        uid: doc.id
                    });
                } else {
                    // Se for um departamento não listado, podemos ignorar ou adicionar no final
                    // Por enquanto, ignoramos para manter a ordem definida
                    console.log(`Departamento não listado: ${dept}`);
                }
            }
        });
        
        // Ordenar colaboradores dentro de cada departamento por nome
        for (let dept in colaboradoresPorDepartamento) {
            colaboradoresPorDepartamento[dept].sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
        }
        
        // Adicionar itens fixos aos departamentos correspondentes
        for (let dept in itensFixosPorDepartamento) {
            if (colaboradoresPorDepartamento[dept]) {
                // Adicionar itens fixos no início do departamento
                colaboradoresPorDepartamento[dept] = [
                    ...itensFixosPorDepartamento[dept],
                    ...colaboradoresPorDepartamento[dept]
                ];
            }
        }
        
        // Renderizar tabela
        renderTabela();
        
    } catch (error) {
        console.error("Erro ao carregar colaboradores:", error);
        showError("Erro ao carregar lista de colaboradores. Tente novamente mais tarde.");
    } finally {
        loadingIndicator.classList.remove('active');
    }
}

// ========== RENDERIZAR TABELA ==========
function renderTabela() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    let hasResults = false;
    const filterLower = currentFilter.toLowerCase().trim();
    
    // Percorrer departamentos na ordem fixa
    for (let dept of departamentosFixos) {
        const colaboradores = colaboradoresPorDepartamento[dept] || [];
        
        // Filtrar colaboradores deste departamento
        let colaboradoresFiltrados = colaboradores;
        if (filterLower !== '') {
            colaboradoresFiltrados = colaboradores.filter(item => 
                item.name.toLowerCase().includes(filterLower) ||
                item.phone.toLowerCase().includes(filterLower) ||
                item.email.toLowerCase().includes(filterLower)
            );
        }
        
        // Se não há colaboradores neste departamento (após filtro), pular
        if (colaboradoresFiltrados.length === 0) {
            continue;
        }
        
        hasResults = true;
        
        // Adicionar cabeçalho do departamento
        const headerRow = document.createElement('tr');
        headerRow.className = 'department-header';
        headerRow.innerHTML = `<td colspan="4"><strong>${dept}</strong></td>`;
        tbody.appendChild(headerRow);
        
        // Adicionar linhas dos colaboradores
        colaboradoresFiltrados.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dept}</td>
                <td>${item.phone}</td>
                <td>${item.name}</td>
                <td>${item.email}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    if (!hasResults && filterLower !== '') {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum colaborador encontrado</td></tr>';
    } else if (!hasResults && filterLower === '') {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Carregando colaboradores...</td></tr>';
    }
}

// ========== FUNÇÃO DE BUSCA ==========
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    currentFilter = searchInput.value;
    renderTabela();
}

// ========== EXIBIR ERRO ==========
function showError(message) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--accent-color);">${message}</td></tr>`;
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
        
        // Carregar colaboradores após autenticação
        carregarColaboradores();
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

// ========== BOTÃO DE TEMA STICKY (PARA NO RODAPÉ) ==========
function ajustarBotaoTema() {
    const themeBtn = document.getElementById('themeToggle');
    const footer = document.querySelector('footer');
    
    if (!themeBtn || !footer) return;
    
    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    const themeBtnHeight = themeBtn.offsetHeight;
    
    // Se o rodapé está visível ou próximo
    if (footerTop < windowHeight - 50) {
        // Calcula a posição para o botão parar acima do rodapé
        const stopPosition = footerTop - themeBtnHeight - 20;
        if (stopPosition < windowHeight - themeBtnHeight - 20) {
            themeBtn.style.position = 'absolute';
            themeBtn.style.bottom = 'auto';
            themeBtn.style.top = `${footer.offsetTop - themeBtnHeight - 20}px`;
            themeBtn.style.right = '20px';
        }
    } else {
        // Volta para posição fixa
        themeBtn.style.position = 'fixed';
        themeBtn.style.bottom = '20px';
        themeBtn.style.top = 'auto';
        themeBtn.style.right = '20px';
    }
}

// Adicionar event listeners para scroll e resize
window.addEventListener('scroll', ajustarBotaoTema);
window.addEventListener('resize', ajustarBotaoTema);

// Chamar uma vez para inicializar
setTimeout(ajustarBotaoTema, 100);

// ========== EVENTOS DE BUSCA ==========
document.getElementById('searchButton').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});