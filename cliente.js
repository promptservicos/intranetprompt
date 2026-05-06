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
let uniformesTemp = [];
let examesTemp = [];
let contratosTemp = [];
let podeEditarCliente = false;

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

// ========== VERIFICAR PERMISSÃO PARA EDITAR CLIENTE ==========
async function verificarPermissaoEdicaoCliente(user) {
    if (USUARIOS_AUTORIZADOS_IDS.includes(user.uid)) {
        podeEditarCliente = true;
        return true;
    }
    
    if (user.email && USUARIOS_AUTORIZADOS_EMAILS.includes(user.email)) {
        podeEditarCliente = true;
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
                podeEditarCliente = true;
                return true;
            }
        }
    } catch (error) {
        console.error("Erro ao verificar departamento:", error);
    }
    
    podeEditarCliente = false;
    return false;
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

// ========== MOSTRAR MENSAGEM DE ERRO ==========
function mostrarErro() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const clienteContent = document.getElementById('clienteContent');
    const errorMessage = document.getElementById('errorMessage');
    
    loadingIndicator.style.display = 'none';
    clienteContent.style.display = 'none';
    errorMessage.style.display = 'block';
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

// ========== FUNÇÕES PARA EDITAR CLIENTE ==========
function abrirModalEditarCliente() {
    if (!podeEditarCliente) {
        alert('Você não tem permissão para editar este cliente.');
        return;
    }
    
    // Preencher o modal com os dados atuais
    document.getElementById('editClienteNome').value = document.getElementById('clienteNome').textContent;
    document.getElementById('editClienteCNPJ').value = document.getElementById('clienteCNPJ').textContent.replace('CNPJ: ', '');
    document.getElementById('editClienteCodigoGI').value = document.getElementById('clienteCodigoGI').textContent.replace('Código GI: ', '');
    document.getElementById('editClienteRazaoSocial').value = document.getElementById('clienteRazaoSocial').textContent;
    document.getElementById('editClienteContato').value = document.getElementById('clienteContato').textContent;
    document.getElementById('editClienteEmail').value = document.getElementById('clienteEmail').textContent;
    document.getElementById('editClienteTelefone').value = document.getElementById('clienteTelefone').textContent;
    document.getElementById('editClienteEndereco').value = document.getElementById('clienteEndereco').textContent;
    document.getElementById('editClienteInscricaoEstadual').value = document.getElementById('clienteInscricaoEstadual').textContent;
    
    // Informações complementares
    document.getElementById('editClienteSupervisor').value = document.getElementById('clienteSupervisor').textContent;
    document.getElementById('editClientePonto').value = document.getElementById('clientePonto').textContent;
    document.getElementById('editClienteFechFolha').value = document.getElementById('clienteFechFolha').textContent;
    document.getElementById('editClienteIntManha').value = document.getElementById('clienteIntManha').textContent;
    document.getElementById('editClienteIntTarde').value = document.getElementById('clienteIntTarde').textContent;
    document.getElementById('editClienteIntNoite').value = document.getElementById('clienteIntNoite').textContent;
    
    // Faturamento
    document.getElementById('editClienteEmiFat').value = document.getElementById('clienteEmiFat').textContent;
    document.getElementById('editClienteVencFat').value = document.getElementById('clienteVencFat').textContent;
    
    // Pagamentos
    document.getElementById('editClienteAdiantData').value = document.getElementById('clienteAdiantData').textContent;
    document.getElementById('editClientePagData').value = document.getElementById('clientePagData').textContent;
    document.getElementById('editClienteBenAdiant').value = document.getElementById('clienteBenAdiant').textContent;
    document.getElementById('editClienteBenPag').value = document.getElementById('clienteBenPag').textContent;
    
    document.getElementById('editarClienteModal').style.display = 'flex';
}

function fecharModalEditarCliente() {
    document.getElementById('editarClienteModal').style.display = 'none';
}

async function salvarEdicaoCliente(event) {
    event.preventDefault();
    
    if (!podeEditarCliente) {
        alert('Você não tem permissão para editar este cliente.');
        return;
    }
    
    const clienteData = {
        nome: document.getElementById('editClienteNome').value.trim(),
        cnpj: document.getElementById('editClienteCNPJ').value.trim(),
        codigogi: document.getElementById('editClienteCodigoGI').value.trim(),
        rsocial: document.getElementById('editClienteRazaoSocial').value.trim(),
        contato: document.getElementById('editClienteContato').value.trim(),
        email: document.getElementById('editClienteEmail').value.trim(),
        telefone: document.getElementById('editClienteTelefone').value.trim(),
        endereco: document.getElementById('editClienteEndereco').value.trim(),
        iestadual: document.getElementById('editClienteInscricaoEstadual').value.trim(),
        supervisor: document.getElementById('editClienteSupervisor').value.trim(),
        ponto: document.getElementById('editClientePonto').value.trim(),
        fechfolha: document.getElementById('editClienteFechFolha').value.trim(),
        intmanha: document.getElementById('editClienteIntManha').value.trim(),
        inttarde: document.getElementById('editClienteIntTarde').value.trim(),
        intnoite: document.getElementById('editClienteIntNoite').value.trim(),
        emifat: document.getElementById('editClienteEmiFat').value.trim(),
        vencfat: document.getElementById('editClienteVencFat').value.trim(),
        adiantdata: document.getElementById('editClienteAdiantData').value.trim(),
        pagdata: document.getElementById('editClientePagData').value.trim(),
        beneadiant: document.getElementById('editClienteBenAdiant').value.trim(),
        benepag: document.getElementById('editClienteBenPag').value.trim()
    };
    
    if (!clienteData.nome) {
        alert('O nome do cliente é obrigatório.');
        return;
    }
    
    try {
        await db.collection('clientes').doc(clienteId).update(clienteData);
        fecharModalEditarCliente();
        
        // Recarregar os dados na tela
        await carregarCliente();
        
    } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        alert('Erro ao salvar as alterações. Verifique suas permissões.');
    }
}

// ========== FUNÇÕES PARA CONTROLE DE EDIÇÃO DO CARGO ==========
function habilitarEdicaoCargo(habilitar) {
    modoEdicaoCargo = habilitar;
    
    // Campos de texto
    const nomeInput = document.getElementById('fichaCargoNome');
    if (nomeInput) nomeInput.readOnly = !habilitar;
    
    // Container de seleção de escala
    const escalaSelecaoContainer = document.getElementById('escalaSelecaoContainer');
    if (escalaSelecaoContainer) {
        escalaSelecaoContainer.style.display = habilitar ? 'flex' : 'none';
    }
    
    // Container de seleção de uniformes
    const uniformesSelecao = document.getElementById('uniformesSelecaoContainer');
    if (uniformesSelecao) {
        uniformesSelecao.style.display = habilitar ? 'flex' : 'none';
    }
    
    // Container de seleção de exames
    const examesSelecao = document.getElementById('examesSelecaoContainer');
    if (examesSelecao) {
        examesSelecao.style.display = habilitar ? 'flex' : 'none';
    }
    
    // Container de seleção de contratos
    const contratoSelecao = document.getElementById('contratoSelecaoContainer');
    if (contratoSelecao) {
        contratoSelecao.style.display = habilitar ? 'flex' : 'none';
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
    
    // Renderizar listas no modo apropriado
    if (typeof renderizarJornadas === 'function') renderizarJornadas();
    if (typeof renderizarUniformes === 'function') renderizarUniformes();
    if (typeof renderizarExames === 'function') renderizarExames();
    if (typeof renderizarContratos === 'function') renderizarContratos();
}

function entrarModoEdicao() {
    habilitarEdicaoCargo(true);
}

function sairModoEdicao() {
    habilitarEdicaoCargo(false);
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
    
    uniformesTemp = cargo.uniformes ? [...cargo.uniformes] : [];
    renderizarUniformes();
    
    examesTemp = cargo.exames ? [...cargo.exames] : [];
    renderizarExames();
    
    contratosTemp = cargo.contratos ? [...cargo.contratos] : [];
    renderizarContratos();
    
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
    if (horario.includes(':')) return horario;
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
    
    window.jornadasTemp = [{ entrada: '', saida: '' }];
    renderizarJornadas();
    
    habilitarEdicaoCargo(true);
}

function abrirModalEditarCargo(index) {
    cargoEditandoIndex = index;
    const cargo = cargosList[index];
    if (!cargo) return;
    
    const modal = document.getElementById('fichaCargoModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    window.jornadasTemp = cargo.jornadas ? [...cargo.jornadas] : [{ entrada: '08:00', saida: '17:00' }];
    carregarDadosCargoNoModal(cargo);
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
        jornadas: jornadas,
        uniformes: uniformesTemp,
        exames: examesTemp,
        contratos: contratosTemp
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

// ========== FUNÇÕES PARA UNIFORMES ==========
function renderizarUniformes() {
    const container = document.getElementById('uniformesList');
    if (!container) return;
    
    if (!uniformesTemp || uniformesTemp.length === 0) {
        container.innerHTML = '<div class="no-item">Nenhum uniforme cadastrado</div>';
        return;
    }
    
    container.innerHTML = '';
    uniformesTemp.forEach((uniforme, index) => {
        const uniformeDiv = document.createElement('div');
        uniformeDiv.className = 'uniforme-item';
        uniformeDiv.innerHTML = `
            <div class="uniforme-info">
                <span class="uniforme-nome">${escapeHtml(uniforme.nome)}</span>
                <span class="uniforme-quantidade">${uniforme.quantidade} unidade(s)</span>
            </div>
            ${modoEdicaoCargo ? `<button class="btn-remover-uniforme" data-index="${index}">
                <i class='bx bx-trash'></i>
            </button>` : ''}
        `;
        container.appendChild(uniformeDiv);
    });
    
    if (modoEdicaoCargo) {
        document.querySelectorAll('.btn-remover-uniforme').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                uniformesTemp.splice(index, 1);
                renderizarUniformes();
            });
        });
    }
}

function adicionarUniforme() {
    const select = document.getElementById('uniformesSelect');
    const quantidade = document.getElementById('uniformeQuantidade');
    
    const nome = select.value;
    const qtd = parseInt(quantidade.value);
    
    if (!nome) {
        alert('Selecione um uniforme.');
        return;
    }
    
    if (!qtd || qtd < 1) {
        alert('Informe uma quantidade válida (mínimo 1).');
        return;
    }
    
    const existe = uniformesTemp.some(u => u.nome === nome);
    if (existe) {
        alert('Este uniforme já foi adicionado.');
        return;
    }
    
    uniformesTemp.push({ nome, quantidade: qtd });
    renderizarUniformes();
    
    select.value = '';
    quantidade.value = '';
}

// ========== FUNÇÕES PARA EXAMES ==========
function renderizarExames() {
    const container = document.getElementById('examesList');
    if (!container) return;
    
    if (!examesTemp || examesTemp.length === 0) {
        container.innerHTML = '<div class="no-item">Nenhum exame cadastrado</div>';
        return;
    }
    
    container.innerHTML = '';
    examesTemp.forEach((exame, index) => {
        const exameDiv = document.createElement('div');
        exameDiv.className = 'exame-item';
        exameDiv.innerHTML = `
            <span class="exame-nome">${escapeHtml(exame)}</span>
            ${modoEdicaoCargo ? `<button class="btn-remover-exame" data-index="${index}">
                <i class='bx bx-trash'></i>
            </button>` : ''}
        `;
        container.appendChild(exameDiv);
    });
    
    if (modoEdicaoCargo) {
        document.querySelectorAll('.btn-remover-exame').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                examesTemp.splice(index, 1);
                renderizarExames();
            });
        });
    }
}

function adicionarExame() {
    const select = document.getElementById('examesSelect');
    const nome = select.value;
    
    if (!nome) {
        alert('Selecione um exame.');
        return;
    }
    
    if (examesTemp.includes(nome)) {
        alert('Este exame já foi adicionado.');
        return;
    }
    
    examesTemp.push(nome);
    renderizarExames();
    select.value = '';
}

// ========== FUNÇÕES PARA CONTRATOS ==========
function renderizarContratos() {
    const container = document.getElementById('contratoList');
    if (!container) return;
    
    if (!contratosTemp || contratosTemp.length === 0) {
        container.innerHTML = '<div class="no-item">Nenhum contrato cadastrado</div>';
        return;
    }
    
    container.innerHTML = '';
    contratosTemp.forEach((contrato, index) => {
        const contratoDiv = document.createElement('div');
        contratoDiv.className = 'contrato-item';
        contratoDiv.innerHTML = `
            <span class="contrato-nome">${escapeHtml(contrato)}</span>
            ${modoEdicaoCargo ? `<button class="btn-remover-contrato" data-index="${index}">
                <i class='bx bx-x'></i>
            </button>` : ''}
        `;
        container.appendChild(contratoDiv);
    });
    
    if (modoEdicaoCargo) {
        document.querySelectorAll('.btn-remover-contrato').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                contratosTemp.splice(index, 1);
                renderizarContratos();
            });
        });
    }
}

function adicionarContrato() {
    const select = document.getElementById('contratoSelect');
    const nome = select.value;
    
    if (!nome) {
        alert('Selecione um tipo de contrato.');
        return;
    }
    
    if (contratosTemp.includes(nome)) {
        alert('Este tipo de contrato já foi adicionado.');
        return;
    }
    
    contratosTemp.push(nome);
    renderizarContratos();
    select.value = '';
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
        
        // Dados básicos
        document.getElementById('clienteNome').textContent = data.nome || 'Nome não informado';
        document.getElementById('clienteCNPJ').innerHTML = `<i class='bx bx-receipt'></i> CNPJ: ${formatarCNPJ(data.cnpj || '')}`;
        document.getElementById('clienteRazaoSocial').textContent = data.rsocial || data.razao_social || 'Não informado';
        document.getElementById('clienteContato').textContent = data.contato || 'Não informado';
        document.getElementById('clienteEmail').textContent = data.email || 'Não informado';
        document.getElementById('clienteTelefone').textContent = formatarTelefone(data.telefone || '');
        document.getElementById('clienteEndereco').textContent = data.endereco || 'Não informado';
        document.getElementById('clienteInscricaoEstadual').textContent = data.iestadual || data.inscricao_estadual || 'Não informado';
        document.getElementById('clienteCodigoGI').innerHTML = `<i class='bx bx-barcode'></i> Código GI: ${data.codigogi || 'Não informado'}`;
        
        // Informações adicionais
        document.getElementById('clienteSupervisor').textContent = data.supervisor || 'Não informado';
        document.getElementById('clientePonto').textContent = data.ponto || 'Não informado';
        document.getElementById('clienteFechFolha').textContent = data.fechfolha || 'Não informado';
        
        // Integrações
        document.getElementById('clienteIntManha').textContent = data.intmanha || 'Não informado';
        document.getElementById('clienteIntTarde').textContent = data.inttarde || 'Não informado';
        document.getElementById('clienteIntNoite').textContent = data.intnoite || 'Não informado';
        
        // Faturamento
        document.getElementById('clienteEmiFat').textContent = data.emifat || 'Não informado';
        document.getElementById('clienteVencFat').textContent = data.vencfat || 'Não informado';
        
        // Pagamentos
        document.getElementById('clienteAdiantData').textContent = data.adiantdata || 'Não informado';
        document.getElementById('clientePagData').textContent = data.pagdata || 'Não informado';
        
        // Benefícios
        document.getElementById('clienteBenAdiant').textContent = data.beneadiant || 'Não informado';
        document.getElementById('clienteBenPag').textContent = data.benepag || 'Não informado';
        
        loadingIndicator.style.display = 'none';
        clienteContent.style.display = 'block';
        
        // Mostrar botão de editar se tiver permissão
        const btnEditarCliente = document.getElementById('btnEditarCliente');
        if (btnEditarCliente) {
            btnEditarCliente.style.display = podeEditarCliente ? 'flex' : 'none';
        }
        
        await carregarFotos();
        await carregarCargos();
        
    } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        mostrarErro();
    }
}

// ========== AUTENTICAÇÃO ==========
auth.onAuthStateChanged(async (user) => {
    if (user) {
        let acessoPermitido = verificarAcesso(user);
        
        await verificarPermissaoEdicaoCliente(user);
        
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

const btnEditarCargo = document.getElementById('btnEditarCargo');
if (btnEditarCargo) {
    btnEditarCargo.addEventListener('click', entrarModoEdicao);
}

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

const btnAdicionarContrato = document.getElementById('btnAdicionarContrato');
if (btnAdicionarContrato) {
    btnAdicionarContrato.addEventListener('click', adicionarContrato);
}

const btnAdicionarUniforme = document.getElementById('btnAdicionarUniforme');
if (btnAdicionarUniforme) {
    btnAdicionarUniforme.addEventListener('click', adicionarUniforme);
}

const btnAdicionarExame = document.getElementById('btnAdicionarExame');
if (btnAdicionarExame) {
    btnAdicionarExame.addEventListener('click', adicionarExame);
}

// ========== EVENTOS PARA EDITAR CLIENTE ==========
const btnEditarCliente = document.getElementById('btnEditarCliente');
if (btnEditarCliente) {
    btnEditarCliente.addEventListener('click', abrirModalEditarCliente);
}

const modalCloseEditar = document.querySelector('.modal-close-editar-cliente');
if (modalCloseEditar) {
    modalCloseEditar.addEventListener('click', fecharModalEditarCliente);
}

const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener('click', fecharModalEditarCliente);
}

const editarClienteForm = document.getElementById('editarClienteForm');
if (editarClienteForm) {
    editarClienteForm.addEventListener('submit', salvarEdicaoCliente);
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('editarClienteModal');
    if (e.target === modal) {
        fecharModalEditarCliente();
    }
});

// ========== EVENTOS DO MODAL DA FICHA DO CARGO ==========
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

// ========== BOTÃO DE TEMA STICKY (PARA NO RODAPÉ) ==========
function ajustarBotaoTema() {
    const themeBtn = document.getElementById('themeToggle');
    const footer = document.querySelector('footer');
    
    if (!themeBtn || !footer) return;
    
    const footerRect = footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const themeBtnHeight = themeBtn.offsetHeight;
    
    // Se o topo do footer está visível ou próximo do viewport
    if (footerRect.top <= windowHeight - 50) {
        // Botão fica absoluto em relação ao body
        const scrollY = window.scrollY;
        const footerOffsetTop = footer.offsetTop;
        const newTop = footerOffsetTop - themeBtnHeight - 20;
        
        themeBtn.style.position = 'absolute';
        themeBtn.style.bottom = 'auto';
        themeBtn.style.top = newTop + 'px';
        themeBtn.style.right = '20px';
    } else {
        // Botão volta para posição fixa
        themeBtn.style.position = 'fixed';
        themeBtn.style.bottom = '20px';
        themeBtn.style.top = 'auto';
        themeBtn.style.right = '20px';
    }
}

// Garantir que o body tem position relative para o absolute funcionar
document.body.style.position = 'relative';
document.body.style.minHeight = '100vh';

// Adicionar event listeners
window.addEventListener('scroll', ajustarBotaoTema);
window.addEventListener('resize', ajustarBotaoTema);
window.addEventListener('load', ajustarBotaoTema);

// Chamar uma vez para inicializar
setTimeout(ajustarBotaoTema, 100);