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

// ========== USUÁRIOS AUTORIZADOS ==========
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
    "Departamento Pessoal",
    "Financeiro"
];

// ========== VARIÁVEIS GLOBAIS ==========
let clienteId = null;
let fotosBase64 = [];
let cargosList = [];
let currentFotoIndex = 0;
let cargoEditandoIndex = null;
let diasSelecionadosTemp = [];
let escalasTemp = [];
let modoEdicaoCargo = false;

// ========== CONSTANTES PARA DIAS ==========
const diasMap = {
    'seg': 'Segunda',
    'ter': 'Terça',
    'qua': 'Quarta',
    'qui': 'Quinta',
    'sex': 'Sexta',
    'sab': 'Sábado',
    'dom': 'Domingo'
};

const ordemDias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

// ========== FUNÇÃO PARA VERIFICAR ACESSO ==========
function verificarAcesso(usuario) {
    if (USUARIOS_AUTORIZADOS_IDS.includes(usuario.uid)) {
        return true;
    }
    if (usuario.email && USUARIOS_AUTORIZADOS_EMAILS.includes(usuario.email)) {
        return true;
    }
    return null;
}

// ========== MOSTRAR TELA DE ACESSO NEGADO ==========
function mostrarAcessoNegado() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const clienteContent = document.getElementById('clienteContent');
    const errorMessage = document.getElementById('errorMessage');
    const acessoNegadoDiv = document.getElementById('acessoNegado');
    
    loadingIndicator.style.display = 'none';
    clienteContent.style.display = 'none';
    errorMessage.style.display = 'none';
    
    if (acessoNegadoDiv) {
        acessoNegadoDiv.style.display = 'block';
    }
}

// ========== PEGAR ID DO CLIENTE DA URL ==========
function getClienteId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// ========== FUNÇÕES DE FORMATAÇÃO ==========
function formatarCNPJ(cnpj) {
    if (!cnpj) return 'Não informado';
    const numeros = cnpj.replace(/\D/g, '');
    if (numeros.length === 14) {
        return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
}

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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== FUNÇÕES PARA ESCALA ==========
function formatarEscala(dias) {
    if (!dias || dias.length === 0) return '';
    
    const diasExtenso = dias.map(d => diasMap[d]);
    const indices = dias.map(d => ordemDias.indexOf(d)).sort((a, b) => a - b);
    
    let isSequencial = true;
    for (let i = 1; i < indices.length; i++) {
        if (indices[i] !== indices[i-1] + 1) {
            isSequencial = false;
            break;
        }
    }
    
    if (isSequencial && dias.length > 1) {
        const primeiro = diasExtenso[0];
        const ultimo = diasExtenso[diasExtenso.length - 1];
        return `${primeiro} à ${ultimo}`;
    }
    
    return diasExtenso.join(', ');
}

// ========== FUNÇÕES PARA CONTROLE DE EDIÇÃO DO CARGO ==========
function habilitarEdicaoCargo(habilitar) {
    modoEdicaoCargo = habilitar;
    
    // Campos de texto
    const nomeInput = document.getElementById('fichaCargoNome');
    nomeInput.readOnly = !habilitar;
    
    // Container de seleção de escala
    const escalaSelecaoContainer = document.getElementById('escalaSelecaoContainer');
    if (escalaSelecaoContainer) {
        escalaSelecaoContainer.style.display = habilitar ? 'flex' : 'none';
    }
    
    // Botões de dias da semana
    document.querySelectorAll('.dia-btn').forEach(btn => {
        if (habilitar) {
            btn.removeAttribute('disabled');
        } else {
            btn.setAttribute('disabled', 'disabled');
        }
    });
    
    // Botão de adicionar escala
    const btnAddEscala = document.getElementById('btnAdicionarEscala');
    if (btnAddEscala) {
        if (habilitar) {
            btnAddEscala.removeAttribute('disabled');
        } else {
            btnAddEscala.setAttribute('disabled', 'disabled');
        }
    }
    
    // Botões de remover escala
    document.querySelectorAll('.btn-remover-escala-item').forEach(btn => {
        btn.style.display = habilitar ? 'flex' : 'none';
    });
    
    // Botão de adicionar jornada
    const btnAddJornada = document.getElementById('btnAdicionarJornada');
    if (btnAddJornada) {
        btnAddJornada.style.display = habilitar ? 'inline-flex' : 'none';
    }
    
    // Botões do modal
    const btnEditar = document.getElementById('btnEditarCargo');
    const btnSalvar = document.getElementById('btnSalvarFicha');
    const btnCancelar = document.getElementById('btnCancelarFicha');
    
    if (btnEditar) btnEditar.style.display = habilitar ? 'none' : 'flex';
    if (btnSalvar) btnSalvar.style.display = habilitar ? 'flex' : 'none';
    if (btnCancelar) btnCancelar.textContent = habilitar ? 'Cancelar' : 'Fechar';
    
    // Renderizar jornadas no modo apropriado
    renderizarJornadas();
}

function entrarModoEdicao() {
    habilitarEdicaoCargo(true);
}

function sairModoEdicao() {
    habilitarEdicaoCargo(false);
    // Recarregar os dados originais do cargo
    if (cargoEditandoIndex !== null) {
        const cargo = cargosList[cargoEditandoIndex];
        carregarDadosCargoNoModal(cargo);
    }
}

function carregarDadosCargoNoModal(cargo) {
    document.getElementById('fichaCargoNome').value = cargo.nome || '';
    
    escalasTemp = cargo.escalas ? [...cargo.escalas] : [];
    renderizarEscalasLista();
    limparSelecaoDias();
    
    // Renderizar jornadas (será chamada novamente pelo habilitarEdicaoCargo)
    // Mas precisamos garantir que os dados estejam disponíveis
    if (cargo.jornadas) {
        // Salvar temporariamente para uso no modo edição
        window.jornadasTemp = [...cargo.jornadas];
    }
    
    renderizarJornadas();
}

function formatarEscalaCompleta(dias) {
    if (!dias || dias.length === 0) return '';
    
    const totalDias = dias.length;
    const descricao = formatarEscala(dias);
    
    if (totalDias === 5) return `5x2 - ${descricao}`;
    if (totalDias === 6) return `6x1 - ${descricao}`;
    if (totalDias === 4) return `4x3 - ${descricao}`;
    if (totalDias === 3) return `3x4 - ${descricao}`;
    if (totalDias === 2) return `2x5 - ${descricao}`;
    if (totalDias === 1) return `1x6 - ${descricao}`;
    if (totalDias === 7) return `7x0 - Todos os dias`;
    
    return `${totalDias}x${7-totalDias} - ${descricao}`;
}

function atualizarPreviewEscala() {
    const preview = document.getElementById('escalaPreview');
    if (preview) {
        if (diasSelecionadosTemp.length === 0) {
            preview.textContent = 'Nenhum dia selecionado';
        } else {
            preview.textContent = formatarEscalaCompleta(diasSelecionadosTemp);
        }
    }
    
    const btnAdicionar = document.getElementById('btnAdicionarEscala');
    if (btnAdicionar) {
        btnAdicionar.style.display = diasSelecionadosTemp.length > 0 ? 'inline-flex' : 'none';
    }
}

function limparSelecaoDias() {
    diasSelecionadosTemp = [];
    document.querySelectorAll('.dia-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    atualizarPreviewEscala();
}

function toggleDia(dia) {
    const btn = document.querySelector(`.dia-btn[data-dia="${dia}"]`);
    if (diasSelecionadosTemp.includes(dia)) {
        diasSelecionadosTemp = diasSelecionadosTemp.filter(d => d !== dia);
        btn.classList.remove('selected');
    } else {
        diasSelecionadosTemp.push(dia);
        btn.classList.add('selected');
    }
    diasSelecionadosTemp.sort((a, b) => ordemDias.indexOf(a) - ordemDias.indexOf(b));
    atualizarPreviewEscala();
}

function adicionarEscalaAtual() {
    if (diasSelecionadosTemp.length === 0) {
        alert('Selecione pelo menos um dia para criar a escala.');
        return;
    }
    
    const escalaString = diasSelecionadosTemp.join(',');
    escalasTemp.push(escalaString);
    renderizarEscalasLista();
    limparSelecaoDias();
}

function removerEscala(index) {
    escalasTemp.splice(index, 1);
    renderizarEscalasLista();
}

function renderizarEscalasLista() {
    const container = document.getElementById('escalasList');
    if (!container) return;
    
    if (escalasTemp.length === 0) {
        container.innerHTML = '<div class="no-item">Nenhuma escala cadastrada</div>';
        return;
    }
    
    container.innerHTML = '';
    escalasTemp.forEach((escala, index) => {
        const diasArray = typeof escala === 'string' ? escala.split(',') : escala;
        const escalaFormatada = formatarEscalaCompleta(diasArray);
        
        const escalaDiv = document.createElement('div');
        escalaDiv.className = 'escala-item';
        escalaDiv.innerHTML = `
            <span class="escala-item-text">${escalaFormatada}</span>
            ${modoEdicaoCargo ? `<button class="btn-remover-escala-item" data-index="${index}">
                <i class='bx bx-trash'></i>
            </button>` : ''}
        `;
        container.appendChild(escalaDiv);
    });
    
    if (modoEdicaoCargo) {
        document.querySelectorAll('.btn-remover-escala-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                removerEscala(index);
            });
        });
    }
}

// ========== FUNÇÕES PARA JORNADAS ==========
function renderizarJornadas() {
    const container = document.getElementById('jornadasContainer');
    if (!container) return;
    
    const cargo = cargoEditandoIndex !== null ? cargosList[cargoEditandoIndex] : null;
    const jornadas = cargo ? (cargo.jornadas || [{ entrada: '08:00', saida: '17:00' }]) : [{ entrada: '', saida: '' }];
    
    container.innerHTML = '';
    
    if (modoEdicaoCargo) {
        // Modo edição: mostrar campos editáveis
        jornadas.forEach((jornada, idx) => {
            const jornadaDiv = document.createElement('div');
            jornadaDiv.className = 'jornada-item';
            jornadaDiv.setAttribute('data-jornada-index', idx);
            jornadaDiv.innerHTML = `
                <input type="time" placeholder="Entrada" class="input-horario" value="${jornada.entrada || ''}">
                <span>às</span>
                <input type="time" placeholder="Saída" class="input-horario" value="${jornada.saida || ''}">
                <button type="button" class="btn-remover-jornada" ${jornadas.length === 1 ? 'style="display: none;"' : ''}>✕</button>
            `;
            
            const btnRemover = jornadaDiv.querySelector('.btn-remover-jornada');
            btnRemover.addEventListener('click', () => {
                if (container.children.length > 1) {
                    jornadaDiv.remove();
                } else {
                    alert('É necessário ter pelo menos uma jornada de trabalho.');
                }
            });
            
            container.appendChild(jornadaDiv);
        });
    } else {
        // Modo visualização: mostrar texto
        if (!jornadas || jornadas.length === 0 || (jornadas.length === 1 && !jornadas[0].entrada && !jornadas[0].saida)) {
            container.innerHTML = '<div class="no-item">Nenhuma jornada cadastrada</div>';
        } else {
            jornadas.forEach((jornada, idx) => {
                if (jornada.entrada && jornada.saida) {
                    const jornadaDiv = document.createElement('div');
                    jornadaDiv.className = 'jornada-visualizacao';
                    jornadaDiv.innerHTML = `
                        <i class='bx bx-time'></i>
                        <span class="jornada-visualizacao-texto">${formatarHorario(jornada.entrada)} às ${formatarHorario(jornada.saida)}</span>
                    `;
                    container.appendChild(jornadaDiv);
                }
            });
        }
    }
}

function formatarHorario(horario) {
    if (!horario) return '--:--';
    // Se já estiver no formato HH:MM, retorna assim
    if (horario.includes(':')) return horario;
    // Se for número, converte (ex: 8 -> 08:00)
    const hora = parseInt(horario);
    if (!isNaN(hora)) {
        return `${hora.toString().padStart(2, '0')}:00`;
    }
    return horario;
}

function adicionarJornada(entrada = '', saida = '') {
    if (!modoEdicaoCargo) return;
    
    const container = document.getElementById('jornadasContainer');
    if (!container) return;
    
    const jornadaDiv = document.createElement('div');
    jornadaDiv.className = 'jornada-item';
    jornadaDiv.innerHTML = `
        <input type="time" placeholder="Entrada" class="input-horario" value="${entrada}">
        <span>às</span>
        <input type="time" placeholder="Saída" class="input-horario" value="${saida}">
        <button type="button" class="btn-remover-jornada">✕</button>
    `;
    
    const btnRemover = jornadaDiv.querySelector('.btn-remover-jornada');
    btnRemover.addEventListener('click', () => {
        if (container.children.length > 1) {
            jornadaDiv.remove();
        } else {
            alert('É necessário ter pelo menos uma jornada de trabalho.');
        }
    });
    
    container.appendChild(jornadaDiv);
}

function coletarJornadas() {
    if (!modoEdicaoCargo) return [];
    
    const jornadasItens = document.querySelectorAll('#jornadasContainer .jornada-item');
    const jornadas = [];
    
    jornadasItens.forEach(item => {
        const inputs = item.querySelectorAll('.input-horario');
        const entrada = inputs[0].value;
        const saida = inputs[1].value;
        
        if (entrada && saida) {
            jornadas.push({ entrada, saida });
        }
    });
    
    return jornadas;
}

// ========== FUNÇÕES PARA CARGOS ==========
function abrirModalAddCargo() {
    cargoEditandoIndex = null;
    const modal = document.getElementById('fichaCargoModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.getElementById('fichaCargoNome').value = '';
    
    escalasTemp = [];
    renderizarEscalasLista();
    limparSelecaoDias();
    
    // Inicializar jornadas vazias
    window.jornadasTemp = [{ entrada: '', saida: '' }];
    renderizarJornadas();
    
    // Em modo de adição, já começar em modo edição
    habilitarEdicaoCargo(true);
}

function abrirModalEditarCargo(index) {
    cargoEditandoIndex = index;
    const cargo = cargosList[index];
    if (!cargo) return;
    
    const modal = document.getElementById('fichaCargoModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Salvar jornadas originais para referência
    window.jornadasTemp = cargo.jornadas ? [...cargo.jornadas] : [{ entrada: '08:00', saida: '17:00' }];
    
    // Carregar os dados no modal
    carregarDadosCargoNoModal(cargo);
    
    // Iniciar em modo visualização (não edição)
    habilitarEdicaoCargo(false);
}

function fecharModalFicha() {
    const modal = document.getElementById('fichaCargoModal');
    if (modal) modal.style.display = 'none';
    cargoEditandoIndex = null;
    modoEdicaoCargo = false;
}

function coletarDadosCargo() {
    const nome = document.getElementById('fichaCargoNome').value.trim();
    if (!nome) {
        alert('O nome do cargo é obrigatório.');
        return null;
    }
    
    if (escalasTemp.length === 0) {
        alert('Adicione pelo menos uma escala de trabalho.');
        return null;
    }
    
    const jornadas = coletarJornadas();
    
    if (jornadas.length === 0) {
        alert('Adicione pelo menos uma jornada de trabalho válida.');
        return null;
    }
    
    return {
        nome: nome,
        escalas: escalasTemp,
        jornadas: jornadas
    };
}

async function salvarCargoFicha() {
    const cargoData = coletarDadosCargo();
    if (!cargoData) return;
    
    if (cargoEditandoIndex !== null) {
        cargosList[cargoEditandoIndex] = cargoData;
    } else {
        cargosList.push(cargoData);
    }
    
    await salvarCargos();
    renderizarCargos();
    fecharModalFicha();
}

async function removerCargo(index) {
    if (confirm('Tem certeza que deseja remover este cargo?')) {
        cargosList.splice(index, 1);
        await salvarCargos();
        renderizarCargos();
    }
}

function renderizarCargos() {
    const list = document.getElementById('cargosList');
    if (!list) return;
    
    if (!cargosList || cargosList.length === 0) {
        list.innerHTML = '<div class="no-cargos">Nenhum cargo cadastrado</div>';
        return;
    }
    
    list.innerHTML = '';
    cargosList.forEach((cargo, index) => {
        const nomeCargo = cargo.nome;
        let escalaPreview = '';
        if (cargo.escalas && cargo.escalas.length > 0) {
            const primeiraEscala = cargo.escalas[0];
            const diasArray = typeof primeiraEscala === 'string' ? primeiraEscala.split(',') : primeiraEscala;
            escalaPreview = `<div class="cargo-escala-preview">${formatarEscalaCompleta(diasArray)}</div>`;
        }
        
        const cargoDiv = document.createElement('div');
        cargoDiv.className = 'cargo-item';
        cargoDiv.innerHTML = `
            <div class="cargo-info">
                <span class="cargo-nome">${escapeHtml(nomeCargo)}</span>
                ${escalaPreview}
            </div>
            <div class="cargo-buttons">
                <button class="btn-remover-cargo" data-index="${index}" title="Remover cargo">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        `;
        
        cargoDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-remover-cargo')) {
                abrirModalEditarCargo(index);
            }
        });
        
        list.appendChild(cargoDiv);
    });
    
    document.querySelectorAll('.btn-remover-cargo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            removerCargo(index);
        });
    });
}

async function salvarCargos() {
    if (!clienteId) return;
    await db.collection('clientes').doc(clienteId).update({
        cargos: cargosList
    }).catch(error => {
        console.error("Erro ao salvar cargos:", error);
        alert('Erro ao salvar cargos. Verifique as permissões.');
    });
}

async function carregarCargos() {
    if (!clienteId) return;
    try {
        const doc = await db.collection('clientes').doc(clienteId).get();
        if (doc.exists && doc.data().cargos) {
            cargosList = doc.data().cargos;
            cargosList = cargosList.map(cargo => {
                if (typeof cargo === 'string') {
                    return {
                        nome: cargo,
                        escalas: ['seg,ter,qua,qui,sex'],
                        jornadas: [{ entrada: '08:00', saida: '17:00' }]
                    };
                }
                if (!cargo.escalas) {
                    cargo.escalas = ['seg,ter,qua,qui,sex'];
                }
                cargo.escalas = cargo.escalas.map(escala => {
                    if (Array.isArray(escala)) {
                        return escala.join(',');
                    }
                    return escala;
                });
                return cargo;
            });
        } else {
            cargosList = [];
        }
        renderizarCargos();
    } catch (error) {
        console.error("Erro ao carregar cargos:", error);
        cargosList = [];
        renderizarCargos();
    }
}

// ========== FUNÇÕES PARA FOTOS ==========
async function compactarImagem(file, maxSizeKB = 200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                const canvas = document.createElement('canvas');
                const maxDimension = 800;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height * maxDimension) / width;
                        width = maxDimension;
                    } else {
                        width = (width * maxDimension) / height;
                        height = maxDimension;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                function tryQuality(q) {
                    const dataUrl = canvas.toDataURL('image/jpeg', q);
                    const estimatedSize = (dataUrl.length * 0.75) / 1024;
                    
                    if (estimatedSize <= maxSizeKB || q <= 0.3) {
                        resolve(dataUrl);
                    } else {
                        tryQuality(q - 0.1);
                    }
                }
                
                tryQuality(0.9);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

function abrirModalFoto(index) {
    currentFotoIndex = index;
    const modal = document.getElementById('fotoModal');
    const modalFoto = document.getElementById('modalFoto');
    
    if (!modal || !modalFoto) return;
    
    modalFoto.src = fotosBase64[currentFotoIndex];
    modal.style.display = 'flex';
    
    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');
    
    if (prevBtn) prevBtn.style.display = fotosBase64.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = fotosBase64.length > 1 ? 'flex' : 'none';
}

function fecharModalFoto() {
    const modal = document.getElementById('fotoModal');
    if (modal) modal.style.display = 'none';
}

function proximaFoto() {
    if (currentFotoIndex < fotosBase64.length - 1) {
        currentFotoIndex++;
        const modalFoto = document.getElementById('modalFoto');
        if (modalFoto) modalFoto.src = fotosBase64[currentFotoIndex];
    }
}

function fotoAnterior() {
    if (currentFotoIndex > 0) {
        currentFotoIndex--;
        const modalFoto = document.getElementById('modalFoto');
        if (modalFoto) modalFoto.src = fotosBase64[currentFotoIndex];
    }
}

async function removerFotoModal() {
    if (confirm('Tem certeza que deseja remover esta foto?')) {
        fotosBase64.splice(currentFotoIndex, 1);
        await salvarFotos();
        renderizarFotos();
        fecharModalFoto();
    }
}

async function renderizarFotos() {
    const grid = document.getElementById('fotosGrid');
    if (!grid) return;
    
    if (!fotosBase64 || fotosBase64.length === 0) {
        grid.innerHTML = '<div class="no-fotos">Nenhuma imagem cadastrada</div>';
        return;
    }
    
    grid.innerHTML = '';
    fotosBase64.forEach((foto, index) => {
        const fotoDiv = document.createElement('div');
        fotoDiv.className = 'foto-item';
        fotoDiv.innerHTML = `
            <img src="${foto}" alt="Foto do cliente">
            <button class="btn-remover-foto" data-index="${index}" title="Remover foto">
                <i class='bx bx-trash'></i>
            </button>
        `;
        
        fotoDiv.querySelector('img').addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalFoto(index);
        });
        
        fotoDiv.querySelector('.btn-remover-foto').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Tem certeza que deseja remover esta foto?')) {
                fotosBase64.splice(index, 1);
                await salvarFotos();
                renderizarFotos();
            }
        });
        
        grid.appendChild(fotoDiv);
    });
}

async function salvarFotos() {
    if (!clienteId) return;
    await db.collection('clientes').doc(clienteId).update({
        fotos: fotosBase64
    }).catch(error => {
        console.error("Erro ao salvar fotos:", error);
    });
}

async function carregarFotos() {
    if (!clienteId) return;
    try {
        const doc = await db.collection('clientes').doc(clienteId).get();
        if (doc.exists && doc.data().fotos) {
            fotosBase64 = doc.data().fotos;
        } else {
            fotosBase64 = [];
        }
        renderizarFotos();
    } catch (error) {
        console.error("Erro ao carregar fotos:", error);
        fotosBase64 = [];
        renderizarFotos();
    }
}

// ========== CARREGAR DADOS DO CLIENTE ==========
async function carregarCliente() {
    clienteId = getClienteId();
    
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
        
        document.getElementById('clienteNome').textContent = data.nome || 'Nome não informado';
        document.getElementById('clienteCNPJ').innerHTML = `<i class='bx bx-receipt'></i> CNPJ: ${formatarCNPJ(data.cnpj)}`;
        document.getElementById('clienteRazaoSocial').textContent = data.rsocial || data.razao_social || 'Não informado';
        document.getElementById('clienteContato').textContent = data.contato || 'Não informado';
        document.getElementById('clienteEmail').textContent = data.email || 'Não informado';
        document.getElementById('clienteTelefone').textContent = formatarTelefone(data.telefone);
        document.getElementById('clienteEndereco').textContent = data.endereco || 'Não informado';
        document.getElementById('clienteInscricaoEstadual').textContent = data.iestadual || data.inscricao_estadual || 'Não informado';
        document.getElementById('clienteCodigoGI').innerHTML = `<i class='bx bx-barcode'></i> Código GI: ${data.codigogi || 'Não informado'}`;
        
        loadingIndicator.style.display = 'none';
        clienteContent.style.display = 'block';
        
        await carregarFotos();
        await carregarCargos();
        
    } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        mostrarErro();
    }
}

function mostrarErro() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const clienteContent = document.getElementById('clienteContent');
    const errorMessage = document.getElementById('errorMessage');
    
    loadingIndicator.style.display = 'none';
    clienteContent.style.display = 'none';
    errorMessage.style.display = 'block';
}

// ========== AUTENTICAÇÃO ==========
auth.onAuthStateChanged((user) => {
    if (user) {
        let acessoPermitido = verificarAcesso(user);
        
        if (acessoPermitido === true) {
            carregarDadosUsuario(user);
            carregarCliente();
        } else if (acessoPermitido === null) {
            db.collection('usuarios').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        const departamento = userData.departamento || userData.cargo || '';
                        
                        const acessoPorDepartamento = DEPARTAMENTOS_AUTORIZADOS.some(
                            dept => departamento.toLowerCase().includes(dept.toLowerCase())
                        );
                        
                        if (acessoPorDepartamento) {
                            carregarDadosUsuarioComDados(user, userData);
                            carregarCliente();
                        } else {
                            mostrarAcessoNegado();
                        }
                    } else {
                        mostrarAcessoNegado();
                    }
                })
                .catch((error) => {
                    console.error("Erro ao buscar dados do usuário:", error);
                    mostrarAcessoNegado();
                });
        } else {
            mostrarAcessoNegado();
        }
    } else {
        window.location.href = 'index.html';
    }
});

function carregarDadosUsuario(user) {
    db.collection('usuarios').doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                carregarDadosUsuarioComDados(user, userData);
            }
        })
        .catch(error => console.error("Erro ao buscar usuário:", error));
}

function carregarDadosUsuarioComDados(user, userData) {
    document.getElementById('userName').textContent = userData.nome;
    document.getElementById('userRole').textContent = userData.cargo || 'Colaborador';
    
    const names = userData.nome.split(' ');
    const initials = names[0].charAt(0) + (names.length > 1 ? names[names.length-1].charAt(0) : '');
    document.getElementById('userAvatar').textContent = initials;
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

// ========== LOGO CLICÁVEL ==========
const logoHome = document.getElementById('logoHome');
if (logoHome) {
    logoHome.addEventListener('click', () => {
        window.location.href = 'intranet.html';
    });
}

// ========== BOTÃO VOLTAR ==========
const btnVoltar = document.getElementById('btnVoltar');
if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
        window.location.href = 'clientes.html';
    });
}

// ========== EVENTOS PARA FOTOS ==========
const btnAdicionarFoto = document.getElementById('btnAdicionarFoto');
const uploadFoto = document.getElementById('uploadFoto');

if (btnAdicionarFoto) {
    btnAdicionarFoto.addEventListener('click', () => {
        uploadFoto.click();
    });
}

if (uploadFoto) {
    uploadFoto.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }
        
        try {
            const fotoBase64 = await compactarImagem(file);
            fotosBase64.push(fotoBase64);
            await salvarFotos();
            renderizarFotos();
            uploadFoto.value = '';
        } catch (error) {
            console.error("Erro ao processar imagem:", error);
            alert('Erro ao processar a imagem. Tente novamente.');
        }
    });
}

// Eventos do modal de fotos
const modalClose = document.getElementById('modalClose');
if (modalClose) modalClose.addEventListener('click', fecharModalFoto);
const modalPrev = document.getElementById('modalPrev');
if (modalPrev) modalPrev.addEventListener('click', fotoAnterior);
const modalNext = document.getElementById('modalNext');
if (modalNext) modalNext.addEventListener('click', proximaFoto);
const modalRemover = document.getElementById('modalRemover');
if (modalRemover) modalRemover.addEventListener('click', removerFotoModal);

window.addEventListener('click', (e) => {
    const modal = document.getElementById('fotoModal');
    if (e.target === modal) fecharModalFoto();
});

// ========== EVENTOS PARA ESCALA ==========
document.querySelectorAll('.dia-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const dia = btn.dataset.dia;
        toggleDia(dia);
    });
});

const btnAdicionarEscala = document.getElementById('btnAdicionarEscala');
if (btnAdicionarEscala) {
    btnAdicionarEscala.addEventListener('click', adicionarEscalaAtual);
}

// ========== EVENTOS PARA CARGOS ==========
const btnAbrirAddCargo = document.getElementById('btnAbrirAddCargo');
if (btnAbrirAddCargo) {
    btnAbrirAddCargo.addEventListener('click', abrirModalAddCargo);
}

// Botão de editar cargo
const btnEditarCargo = document.getElementById('btnEditarCargo');
if (btnEditarCargo) {
    btnEditarCargo.addEventListener('click', entrarModoEdicao);
}

// Botão cancelar/fechar
const btnCancelarFicha = document.getElementById('btnCancelarFicha');
if (btnCancelarFicha) {
    btnCancelarFicha.addEventListener('click', () => {
        if (modoEdicaoCargo) {
            sairModoEdicao();
        } else {
            fecharModalFicha();
        }
    });
}

// Eventos do modal da ficha do cargo
const fichaModal = document.getElementById('fichaCargoModal');
const modalCloseFicha = document.querySelector('.modal-close-ficha');
const btnSalvarFicha = document.getElementById('btnSalvarFicha');
const btnAdicionarJornada = document.getElementById('btnAdicionarJornada');

if (modalCloseFicha) modalCloseFicha.addEventListener('click', fecharModalFicha);
if (btnSalvarFicha) btnSalvarFicha.addEventListener('click', salvarCargoFicha);
if (btnAdicionarJornada) btnAdicionarJornada.addEventListener('click', () => adicionarJornada());

if (fichaModal) {
    window.addEventListener('click', (e) => {
        if (e.target === fichaModal) fecharModalFicha();
    });
}