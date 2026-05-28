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
let currentUserData = {};
let userAtalhos = [];
let sortableInstance = null;

// ========== FUNÇÃO PARA MOSTRAR TOAST ==========
function showToast(message, isError = false) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    if (isError) toast.classList.add('error');
    
    const icon = document.createElement('i');
    icon.className = isError ? 'bx bx-error-circle' : 'bx bx-check-circle';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== CATÁLOGO DE ATALHOS DISPONÍVEIS ==========
const catalogoAtalhos = [
    // Dentro da Intranet
    { id: 'colaboradores', nome: 'Colaboradores', icone: 'bx-user-circle', url: 'colaboradores.html', categoria: 'intranet', permissoes: [] },
    { id: 'clientes', nome: 'Clientes', icone: 'bx-briefcase', url: 'clientes.html', categoria: 'intranet', permissoes: [] },
    { id: 'vagas', nome: 'Vagas', icone: 'bx-briefcase-alt-2', url: 'vagas.html', categoria: 'intranet', permissoes: [] },
    { id: 'aniversarios', nome: 'Aniversariantes', icone: 'bx-gift', url: 'aniversarios.html', categoria: 'intranet', permissoes: [] },
    { id: 'powerbi', nome: 'Power BI', icone: 'bx-bar-chart-alt', url: 'powerbi.html', categoria: 'intranet', permissoes: [] },
    
    // Planilhas
    { id: 'planilha_vagas', nome: 'Planilha de Vagas', icone: 'bx-spreadsheet', url: 'https://docs.google.com/spreadsheets/d/1bR9lW1oy6XH1Lg7cTVUtupXQBEsLKta1hfDAhyVkMQ0/edit?gid=1018065189#gid=1018065189', categoria: 'planilhas', permissoes: [] },
    { id: 'planilha_diarias', nome: 'Planilha de Diárias', icone: 'bx-spreadsheet', url: 'https://docs.google.com/spreadsheets/d/1UWx7AgvSDAZwHsw4IV8rM8B5SBYbR_eP1QARtQ9CDbM/edit?gid=750604467#gid=750604467', categoria: 'planilhas', permissoes: ['dp', 'recrutamento', 'fabios', 'marketing'] },
    { id: 'planilha_processos_dp', nome: 'Processos DP', icone: 'bx-spreadsheet', url: 'https://docs.google.com/spreadsheets/d/1cg-geYrv60-5Puh8CdJDGUKzxW6foj-qjgbF-M6INbE/edit?gid=586934667#gid=586934667', categoria: 'planilhas', permissoes: ['dp', 'fabios', 'marketing'] },
    { id: 'planilha_funcionarios', nome: 'Funcionários', icone: 'bx-spreadsheet', url: 'https://docs.google.com/spreadsheets/d/1U9_-8_JZktkIv9swY-A4pZGqU3t7RIJg0DYBGSQ61CY/edit?gid=1736093305#gid=1736093305', categoria: 'planilhas', permissoes: ['dp', 'recrutamento', 'fabios', 'marketing'] },
    { id: 'planilha_clientes', nome: 'Clientes', icone: 'bx-spreadsheet', url: 'https://docs.google.com/spreadsheets/d/10L0Hnv8dTMXymQ88oB1AiaCy27WpKDm3Znq8bgVWg8c/edit?gid=1696575052#gid=1696575052', categoria: 'planilhas', permissoes: [] },
    { id: 'planilha_cartoes_comercial', nome: 'Cartões Comercial', icone: 'bx-spreadsheet', url: 'https://docs.google.com/spreadsheets/d/1w0igt8sfYikBOcFMkZfUaJ5CYcheTjKuJX_cK6vLJjQ/edit?gid=1406395175#gid=1406395175', categoria: 'planilhas', permissoes: ['comercial', 'fabios', 'marketing'] },
    
    // Formulários
    { id: 'form_diarias', nome: 'Formulário de Diárias', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/17NA2ParhSx_0XdTmuYKAGtGz8MaVl1OTkWCD95cI0Vg/edit?usp=forms_home&ouid=109879431990498042572&ths=true', categoria: 'formularios', permissoes: [] },
    { id: 'form_abertura_vagas_interno', nome: 'Abertura de Vagas (Interno)', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/1NpFsIAC8jM733WhPar6k0k0E4sLsFKCdh0A8Ng2yPTc/edit', categoria: 'formularios', permissoes: [] },
    { id: 'form_abertura_vagas_externo', nome: 'Abertura de Vagas (Externo)', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/1yz6rSqOHjBjhNdwYUw1NFv18U4Lzx6ttelMLGLhCOis/edit', categoria: 'formularios', permissoes: [] },
    { id: 'form_supervisao', nome: 'Formulário Supervisão', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/1reDarl9ach9eoJpxbg5Uka6mIrGxj3N-2UaqIAVSXQE/edit', categoria: 'formularios', permissoes: [] },
    { id: 'form_funcionarios_geral', nome: 'Funcionários (Geral)', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/1tL4ZGQdCT8sVh-8O-j9sf27_sergM-jM48e7wuZCwCM/edit', categoria: 'formularios', permissoes: [] },
    { id: 'form_funcionarios_customiza', nome: 'Funcionários (Customiza)', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/1Q7ClBMO5iiroFs8WNiYhCGalFoSi413yLunaU0Hw_QQ/edit', categoria: 'formularios', permissoes: [] },
    { id: 'form_rp_funcionarios', nome: 'RP - Funcionários', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/1Kyshddd_J34y5Nv0zfR7ID682XDQOC9hLAdPvKRrbtc/edit', categoria: 'formularios', permissoes: [] },
    { id: 'form_cadastro_clientes', nome: 'Cadastro de Clientes', icone: 'bx-edit-alt', url: 'https://docs.google.com/forms/d/10KtFXH4DT9JiSSfy9q6Pa71mf0Ii6EmT5lJxg9LXixY/edit', categoria: 'formularios', permissoes: [] }
];

// ========== FUNÇÃO PARA VERIFICAR PERMISSÕES DO USUÁRIO ==========
function verificarPermissaoUsuario(permissoesRequeridas) {
    if (!permissoesRequeridas || permissoesRequeridas.length === 0) return true;
    
    const userDept = (currentUserData.departamento || '').toLowerCase();
    const userCargo = (currentUserData.cargo || '').toLowerCase();
    const userEmail = (currentUserData.email || '').toLowerCase();
    const userUid = currentUserData.uid;
    
    const usuariosAutorizadosIds = [
        "AYcRWgTIRndQWnb5oyTHxLPNAtv2",
        "rDPXgiatpDUCL3dJ7NyAPL0mLtD3",
        "LptL8Wg2heSJKwPHowBxujIsR0E2"
    ];
    
    const usuariosAutorizadosEmails = [
        "fabiomansur@promptservicos.com.br",
        "fabio@promptservicos.com.br",
        "marketing@promptservicos.com.br"
    ];
    
    for (const permissao of permissoesRequeridas) {
        if (permissao === 'fabios') {
            if (usuariosAutorizadosIds.includes(userUid) || usuariosAutorizadosEmails.includes(userEmail)) {
                return true;
            }
        } else if (permissao === 'dp' && (userDept.includes('dp') || userDept.includes('departamento pessoal'))) {
            return true;
        } else if (permissao === 'recrutamento' && (userDept.includes('recrutamento') || userCargo.includes('recrutamento'))) {
            return true;
        } else if (permissao === 'comercial' && (userDept.includes('comercial') || userCargo.includes('comercial'))) {
            return true;
        } else if (permissao === 'marketing' && (userDept.includes('marketing') || userCargo.includes('marketing'))) {
            return true;
        }
    }
    
    return false;
}

// ========== CARREGAR ATALHOS DO USUÁRIO (COM CRIPTOGRAFIA) ==========
async function carregarAtalhosUsuario() {
    if (!currentUserData.uid) return;
    
    try {
        const doc = await db.collection('usuarios').doc(currentUserData.uid).get();
        if (doc.exists) {
            const data = doc.data();
            
            // Verificar se os dados estão criptografados
            if (data.dadosCriptografados) {
                const usuarioDecriptografado = recoverUserFromSave({ id: doc.id, ...data });
                if (usuarioDecriptografado && usuarioDecriptografado.atalhos) {
                    userAtalhos = usuarioDecriptografado.atalhos;
                } else {
                    userAtalhos = [];
                }
            } else {
                // Formato antigo (sem criptografia)
                userAtalhos = data.atalhos || [];
            }
        } else {
            userAtalhos = [];
        }
        renderizarAtalhos();
    } catch (error) {
        console.error("Erro ao carregar atalhos:", error);
        userAtalhos = [];
        renderizarAtalhos();
    }
}

// ========== SALVAR ATALHOS DO USUÁRIO (COM CRIPTOGRAFIA) ==========
async function salvarAtalhosUsuario() {
    if (!currentUserData.uid) return;
    
    try {
        const docRef = db.collection('usuarios').doc(currentUserData.uid);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            let dadosAtualizados;
            
            if (data.dadosCriptografados) {
                // Formato criptografado - preservar outros dados
                const usuarioDecriptografado = recoverUserFromSave({ id: doc.id, ...data });
                if (usuarioDecriptografado) {
                    usuarioDecriptografado.atalhos = userAtalhos;
                    const novosDadosCriptografados = prepareUserForSave(usuarioDecriptografado);
                    await docRef.set(novosDadosCriptografados);
                } else {
                    // Fallback
                    await docRef.update({ atalhos: userAtalhos });
                }
            } else {
                // Formato antigo
                await docRef.update({ atalhos: userAtalhos });
            }
        }
    } catch (error) {
        console.error("Erro ao salvar atalhos:", error);
    }
}

// ========== RENDERIZAR ATALHOS NA TELA ==========
function renderizarAtalhos() {
    const container = document.getElementById('atalhosGrid');
    if (!container) return;
    
    if (!userAtalhos || userAtalhos.length === 0) {
        container.innerHTML = '<div class="empty-atalhos">Nenhum atalho adicionado. Clique em "Editar Atalhos" para personalizar.</div>';
        return;
    }
    
    container.innerHTML = '';
    userAtalhos.forEach(atalho => {
        const card = document.createElement('div');
        card.className = 'atalho-card';
        card.setAttribute('data-url', atalho.url);
        card.innerHTML = `
            <div class="atalho-icon">
                <i class='bx ${atalho.icone}'></i>
            </div>
            <div class="atalho-nome">${escapeHtml(atalho.nome)}</div>
        `;
        card.addEventListener('click', () => {
            if (atalho.url.startsWith('http')) {
                window.open(atalho.url, '_blank');
            } else {
                window.location.href = atalho.url;
            }
        });
        container.appendChild(card);
    });
}

// ========== ABRIR MODAL DE EDIÇÃO DE ATALHOS ==========
function abrirModalEditarAtalhos() {
    const modal = document.getElementById('modalAtalhos');
    if (!modal) return;
    
    const listaDisponiveis = document.getElementById('listaDisponiveis');
    const listaSelecionados = document.getElementById('listaSelecionados');
    
    if (!listaDisponiveis || !listaSelecionados) return;
    
    // Filtrar atalhos disponíveis por permissão
    const atalhosDisponiveis = catalogoAtalhos.filter(atalho => verificarPermissaoUsuario(atalho.permissoes));
    
    // Agrupar por categoria
    const atalhosPorCategoria = {
        intranet: atalhosDisponiveis.filter(a => a.categoria === 'intranet'),
        planilhas: atalhosDisponiveis.filter(a => a.categoria === 'planilhas'),
        formularios: atalhosDisponiveis.filter(a => a.categoria === 'formularios')
    };
    
    const categorias = [
        { id: 'intranet', nome: 'Links Internos', icone: 'bx-link' },
        { id: 'planilhas', nome: 'Planilhas', icone: 'bx-spreadsheet' },
        { id: 'formularios', nome: 'Formulários', icone: 'bx-edit-alt' }
    ];
    
    // Renderizar atalhos disponíveis por categoria
    listaDisponiveis.innerHTML = '';
    categorias.forEach(cat => {
        const atalhos = atalhosPorCategoria[cat.id];
        if (atalhos && atalhos.length > 0) {
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'categoria-item';
            categoriaDiv.innerHTML = `
                <div class="categoria-titulo">
                    <i class='bx ${cat.icone}'></i>
                    <span>${cat.nome}</span>
                </div>
                <div class="lista-atalhos-categoria">
                    ${atalhos.map(atalho => `
                        <div class="atalho-item" data-id="${atalho.id}" data-nome="${atalho.nome}" data-icone="${atalho.icone}" data-url="${atalho.url}">
                            <i class='bx ${atalho.icone}'></i>
                            <span>${escapeHtml(atalho.nome)}</span>
                            <button class="btn-adicionar" title="Adicionar">+</button>
                        </div>
                    `).join('')}
                </div>
            `;
            listaDisponiveis.appendChild(categoriaDiv);
        }
    });
    
    // Adicionar eventos aos botões de adicionar
    document.querySelectorAll('#listaDisponiveis .btn-adicionar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.atalho-item');
            adicionarAtalho(
                item.dataset.id,
                item.dataset.nome,
                item.dataset.icone,
                item.dataset.url
            );
        });
    });
    
    // Renderizar atalhos selecionados
    renderizarListaSelecionados(listaSelecionados);
    
    modal.style.display = 'flex';
    
    // Inicializar SortableJS
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = new Sortable(listaSelecionados, {
        animation: 150,
        onEnd: function() {
            const novosAtalhos = [];
            document.querySelectorAll('#listaSelecionados .atalho-item').forEach(item => {
                novosAtalhos.push({
                    id: item.dataset.id,
                    nome: item.dataset.nome,
                    icone: item.dataset.icone,
                    url: item.dataset.url
                });
            });
            userAtalhos = novosAtalhos;
        }
    });
}

function renderizarListaSelecionados(container) {
    container.innerHTML = '';
    if (!userAtalhos || userAtalhos.length === 0) {
        container.innerHTML = '<div class="empty-atalhos" style="padding: 2rem; text-align: center;">Nenhum atalho selecionado. Adicione clicando nos itens ao lado.</div>';
        return;
    }
    
    userAtalhos.forEach(atalho => {
        const item = document.createElement('div');
        item.className = 'atalho-item';
        item.setAttribute('data-id', atalho.id);
        item.setAttribute('data-nome', atalho.nome);
        item.setAttribute('data-icone', atalho.icone);
        item.setAttribute('data-url', atalho.url);
        item.innerHTML = `
            <i class='bx ${atalho.icone}'></i>
            <span>${escapeHtml(atalho.nome)}</span>
            <button class="btn-remover-atalho" title="Remover">✕</button>
        `;
        
        const btnRemover = item.querySelector('.btn-remover-atalho');
        btnRemover.addEventListener('click', (e) => {
            e.stopPropagation();
            removerAtalhoSelecionado(atalho.id);
        });
        
        container.appendChild(item);
    });
}

function adicionarAtalho(id, nome, icone, url) {
    if (userAtalhos.some(a => a.id === id)) {
        alert('Este atalho já está na sua lista.');
        return;
    }
    
    userAtalhos.push({ id, nome, icone, url });
    const listaSelecionados = document.getElementById('listaSelecionados');
    renderizarListaSelecionados(listaSelecionados);
}

function removerAtalhoSelecionado(id) {
    userAtalhos = userAtalhos.filter(a => a.id !== id);
    const listaSelecionados = document.getElementById('listaSelecionados');
    renderizarListaSelecionados(listaSelecionados);
}

function fecharModalAtalhos() {
    const modal = document.getElementById('modalAtalhos');
    modal.style.display = 'none';
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
}

async function salvarAlteracoesAtalhos() {
    await salvarAtalhosUsuario();
    renderizarAtalhos();
    fecharModalAtalhos();
    showToast('Atalhos salvos com sucesso!', false);
}

// ========== AUTENTICAÇÃO E DADOS DO USUÁRIO (COM CRIPTOGRAFIA) ==========
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const doc = await db.collection('usuarios').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                
                // VERIFICAR SE OS DADOS ESTÃO CRIPTOGRAFADOS
                if (data.dadosCriptografados) {
                    // USAR DESCRIPTOGRAFIA
                    const usuarioDecriptografado = recoverUserFromSave({ id: doc.id, ...data });
                    if (usuarioDecriptografado) {
                        currentUserData = usuarioDecriptografado;
                        currentUserData.uid = user.uid;
                        currentUserData.email = user.email;
                    } else {
                        // Fallback para dados não criptografados
                        currentUserData = data;
                        currentUserData.uid = user.uid;
                        currentUserData.email = user.email;
                    }
                } else {
                    // Formato antigo (sem criptografia) - para compatibilidade
                    currentUserData = data;
                    currentUserData.uid = user.uid;
                    currentUserData.email = user.email;
                    
                    // Opcional: Migrar para o formato criptografado
                    migrarUsuarioParaCriptografia(user.uid, currentUserData);
                }
                
                document.getElementById('userName').textContent = currentUserData.nome || 'Usuário';
                document.getElementById('userRole').textContent = currentUserData.cargo || 'Colaborador';
                document.getElementById('welcomeText').textContent = `Bem-vindo, ${currentUserData.nome || 'Usuário'}!`;
                
                const names = (currentUserData.nome || 'Usuário').split(' ');
                const initials = names[0].charAt(0) + (names.length > 1 ? names[names.length-1].charAt(0) : '');
                document.getElementById('userAvatar').textContent = initials;
                
                await carregarAtalhosUsuario();
            }
        } catch (error) {
            console.error("Erro ao buscar usuário:", error);
        }
        
        carregarAniversariantes();
    } else {
        window.location.href = 'index.html';
    }
});

// ========== FUNÇÃO PARA MIGRAR USUÁRIO PARA CRIPTOGRAFIA ==========
async function migrarUsuarioParaCriptografia(uid, userData) {
    // Verificar se já está criptografado
    const doc = await db.collection('usuarios').doc(uid).get();
    if (doc.exists && doc.data().dadosCriptografados) {
        return; // Já está criptografado
    }
    
    try {
        const dadosCriptografados = prepareUserForSave(userData);
        await db.collection('usuarios').doc(uid).set(dadosCriptografados);
        console.log(`✅ Usuário ${uid} migrado para criptografia`);
    } catch (error) {
        console.error(`❌ Erro ao migrar usuário ${uid}:`, error);
    }
}

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

// ========== DATA ATUAL ==========
function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateString = now.toLocaleDateString('pt-BR', options);
    dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    document.getElementById('currentDate').textContent = dateString;
}
updateDate();

// ========== FUNÇÕES PARA ANIVERSARIANTES ==========
const meses = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

function formatarDataAniversario(dataStr) {
    const [dia, mes] = dataStr.split('/');
    return `${parseInt(dia)} de ${meses[mes]}`;
}

function calcularProximosAniversariantes(aniversarios) {
    const hoje = new Date();
    return aniversarios.filter(item => {
        const [dia, mes] = item.aniversario.split('/').map(Number);
        let dataAniversario = new Date(hoje.getFullYear(), mes - 1, dia);
        if (dataAniversario < hoje) {
            dataAniversario = new Date(hoje.getFullYear() + 1, mes - 1, dia);
        }
        const diffDays = Math.ceil((dataAniversario - hoje) / (1000 * 60 * 60 * 24));
        return diffDays <= 60 && diffDays >= 0;
    }).sort((a, b) => {
        const [diaA, mesA] = a.aniversario.split('/').map(Number);
        const [diaB, mesB] = b.aniversario.split('/').map(Number);
        let dataA = new Date(hoje.getFullYear(), mesA - 1, diaA);
        let dataB = new Date(hoje.getFullYear(), mesB - 1, diaB);
        if (dataA < hoje) dataA = new Date(hoje.getFullYear() + 1, mesA - 1, diaA);
        if (dataB < hoje) dataB = new Date(hoje.getFullYear() + 1, mesB - 1, diaB);
        return dataA - dataB;
    });
}

let aniversariantesList = [];
let currentIndexCarousel = 0;
let carouselInterval = null;

async function carregarAniversariantes() {
    try {
        const snapshot = await db.collection('usuarios').get();
        const aniversarios = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            let aniversario = null;
            
            // Verificar se os dados estão criptografados
            if (data.dadosCriptografados) {
                const usuarioDecriptografado = recoverUserFromSave({ id: doc.id, ...data });
                if (usuarioDecriptografado && usuarioDecriptografado.aniversario) {
                    aniversario = usuarioDecriptografado.aniversario;
                }
            } else {
                // Formato antigo
                aniversario = data.aniversario;
            }
            
            if (aniversario) {
                aniversarios.push({
                    nome: data.nome || (usuarioDecriptografado ? usuarioDecriptografado.nome : 'Usuário'),
                    departamento: data.cargo || data.departamento || (usuarioDecriptografado ? usuarioDecriptografado.cargo : 'Funcionário'),
                    aniversario: aniversario
                });
            }
        }
        
        aniversariantesList = calcularProximosAniversariantes(aniversarios);
        
        if (aniversariantesList.length === 0) {
            document.getElementById('birthdayName').textContent = 'Nenhum aniversariante';
            document.getElementById('birthdayDept').textContent = 'nos próximos 2 meses';
            document.getElementById('birthdayDate').innerHTML = '<i class="bx bx-calendar"></i> Em breve';
            return;
        }
        
        currentIndexCarousel = 0;
        exibirAniversariante(currentIndexCarousel);
        iniciarCarrosselAutomatico();
    } catch (error) {
        console.error("Erro ao carregar aniversariantes:", error);
    }
}

function exibirAniversariante(index) {
    if (aniversariantesList.length === 0) return;
    const item = aniversariantesList[index];
    const card = document.querySelector('.birthday-card-single');
    if (card) {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }
    document.getElementById('birthdayName').textContent = item.nome;
    document.getElementById('birthdayDept').textContent = item.departamento;
    document.getElementById('birthdayDate').innerHTML = `<i class='bx bx-calendar'></i> ${formatarDataAniversario(item.aniversario)}`;
}

function iniciarCarrosselAutomatico() {
    if (carouselInterval) clearInterval(carouselInterval);
    if (aniversariantesList.length > 1) {
        carouselInterval = setInterval(() => {
            proximoAniversariante();
        }, 4000);
    }
}

function proximoAniversariante() {
    if (aniversariantesList.length === 0) return;
    currentIndexCarousel = (currentIndexCarousel + 1) % aniversariantesList.length;
    exibirAniversariante(currentIndexCarousel);
}

function anteriorAniversariante() {
    if (aniversariantesList.length === 0) return;
    currentIndexCarousel = (currentIndexCarousel - 1 + aniversariantesList.length) % aniversariantesList.length;
    exibirAniversariante(currentIndexCarousel);
    if (carouselInterval) {
        clearInterval(carouselInterval);
        iniciarCarrosselAutomatico();
    }
}

// ========== CONTROLES DO CARROSSEL ==========
const carouselPrev = document.getElementById('carouselPrev');
const carouselNext = document.getElementById('carouselNext');
if (carouselPrev) carouselPrev.addEventListener('click', anteriorAniversariante);
if (carouselNext) carouselNext.addEventListener('click', () => {
    proximoAniversariante();
    if (carouselInterval) {
        clearInterval(carouselInterval);
        iniciarCarrosselAutomatico();
    }
});

// ========== EVENTOS DO MODAL DE ATALHOS ==========
const btnEditarAtalhos = document.getElementById('btnEditarAtalhos');
if (btnEditarAtalhos) {
    btnEditarAtalhos.addEventListener('click', abrirModalEditarAtalhos);
}

const modalCloseAtalhos = document.querySelector('.modal-close-atalhos');
if (modalCloseAtalhos) {
    modalCloseAtalhos.addEventListener('click', fecharModalAtalhos);
}

const btnCancelarAtalhos = document.getElementById('btnCancelarAtalhos');
if (btnCancelarAtalhos) {
    btnCancelarAtalhos.addEventListener('click', fecharModalAtalhos);
}

const btnSalvarAtalhos = document.getElementById('btnSalvarAtalhos');
if (btnSalvarAtalhos) {
    btnSalvarAtalhos.addEventListener('click', salvarAlteracoesAtalhos);
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('modalAtalhos');
    if (e.target === modal) {
        fecharModalAtalhos();
    }
});

// ========== FUNÇÃO AUXILIAR ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

document.body.style.position = 'relative';
document.body.style.minHeight = '100vh';

window.addEventListener('scroll', ajustarBotaoTema);
window.addEventListener('resize', ajustarBotaoTema);
window.addEventListener('load', ajustarBotaoTema);
setTimeout(ajustarBotaoTema, 100);