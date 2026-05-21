// ========== CONFIGURAÇÃO DA PLANILHA ==========
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyZUVXWwWVGuYhBWbj1JJkTcKGsS-28wvJJxTcHrqTcFZop5axVFn8qrMqqPeTJ_IKH/exec";

// ========== CONFIGURAÇÃO DAS ETAPAS ==========
const stages = [
    "Aguardando",
    "Recrutamento",
    "Exame",
    "Assinatura",
    "Integração"
];

// ========== VARIÁVEIS GLOBAIS ==========
let vagas = [];
let currentConfirmCallback = null;
let globalSearchTerm = '';
let currentFilterType = 'data'; // 'data', 'cargo', 'cliente', 'status'
let currentSortOrder = 'desc'; // 'asc' ou 'desc'
let currentUser = null;
let lastSyncId = 0;
let syncInterval = null;
let showOnlyCanceled = false;

// ========== DOM ELEMENTS ==========
const addBtn = document.getElementById('addVagaBtn');
const syncNowBtn = document.getElementById('syncNowBtn');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportExcelBtn');
const filterCanceledBtn = document.getElementById('filterCanceledBtn');
const filterTypeSelect = document.getElementById('filterType');
const sortOrderBtn = document.getElementById('sortOrderBtn');
const vagaModal = document.getElementById('vagaModal');
const confirmModal = document.getElementById('confirmModal');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.querySelector('.loading-text');
const vagaForm = document.getElementById('vagaForm');
const modalTitle = document.getElementById('modalTitle');
const editId = document.getElementById('editId');
const confirmMessageSpan = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYes');
const confirmNoBtn = document.getElementById('confirmNo');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const modalCloseBtn = document.querySelector('.modal-close-btn');
const kanbanBoard = document.getElementById('kanbanBoard');
const globalSearch = document.getElementById('globalSearch');

// ========== UTILITÁRIOS ==========
function setLoading(show, message = 'Carregando...') {
    if (show) {
        loadingText.textContent = message;
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

function showError(msg) {
    alert(msg);
    console.error(msg);
}

function formatDateTime(dateValue) {
    if (!dateValue) return '—';
    let d;
    if (typeof dateValue === 'string') {
        d = new Date(dateValue);
    } else if (dateValue && dateValue.toDate) {
        d = dateValue.toDate();
    } else {
        d = new Date(dateValue);
    }
    if (isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// Verificar se a vaga está cancelada
function isVagaCancelada(vaga) {
    const status = (vaga.status || '').toLowerCase().trim();
    return status === 'cancelada pelo cliente' || status === 'cancelada';
}

// Mostrar mensagem temporária (toast)
function showTemporaryMessage(msg, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `toast-message toast-${type}`;
    messageDiv.innerHTML = `
        <i class='bx ${type === 'success' ? 'bx-check-circle' : type === 'error' ? 'bx-error-circle' : 'bx-info-circle'}'></i>
        <span>${msg}</span>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// ========== FUNÇÕES DE SINCRONIZAÇÃO ==========

// Sincronização completa
async function fullSync(showLoadingMessage = true) {
    try {
        if (showLoadingMessage) {
            setLoading(true, 'Sincronizando com a planilha...');
        }
        
        if (syncNowBtn) {
            syncNowBtn.classList.add('syncing');
        }
        
        const response = await fetch(`${SHEET_API_URL}?action=getVagas`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (data.vagas) {
            const oldCount = vagas.length;
            vagas = data.vagas;
            lastSyncId = data.lastSyncId || 0;
            
            console.log(`📊 Sincronização concluída: ${oldCount} -> ${vagas.length} vagas`);
            
            const statusCount = vagas.filter(v => isVagaCancelada(v)).length;
            console.log(`📋 Canceladas: ${statusCount}`);
            
            if (vagas.length !== oldCount) {
                const diff = vagas.length - oldCount;
                if (diff > 0) {
                    showTemporaryMessage(`${diff} nova(s) vaga(s) adicionada(s)!`, 'success');
                } else if (diff < 0) {
                    showTemporaryMessage(`${Math.abs(diff)} vaga(s) removida(s)!`, 'info');
                }
            } else {
                showTemporaryMessage('Sincronização concluída!', 'success');
            }
            
            renderAllCards();
        }
        
        setLoading(false);
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
        setLoading(false);
        if (showLoadingMessage) {
            showTemporaryMessage('Erro ao sincronizar. Tente novamente.', 'error');
        }
    } finally {
        if (syncNowBtn) {
            syncNowBtn.classList.remove('syncing');
        }
    }
}

// Sincronização inicial
async function initialSync() {
    try {
        setLoading(true, 'Carregando vagas da planilha...');
        
        const response = await fetch(`${SHEET_API_URL}?action=getVagas`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (data.vagas) {
            vagas = data.vagas;
            lastSyncId = data.lastSyncId || 0;
            const statusCount = vagas.filter(v => isVagaCancelada(v)).length;
            console.log(`📊 ${vagas.length} vagas carregadas (${statusCount} canceladas)`);
            
            renderAllCards();
        }
        
        setLoading(false);
    } catch (error) {
        console.error('Erro no sync inicial:', error);
        setLoading(false);
        showError('Erro ao carregar dados da planilha. Verifique a conexão.');
    }
}

// Atualizar etapa da vaga na planilha
async function updateVagaEtapa(rowId, novaEtapa) {
    try {
        console.log(`📤 Atualizando etapa da vaga linha ${rowId} para ${stages[novaEtapa]}`);
        
        const url = `${SHEET_API_URL}?action=updateEtapa&rowId=${rowId}&novaEtapa=${novaEtapa}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Etapa atualizada com sucesso`);
            showTemporaryMessage(`Etapa alterada para "${stages[novaEtapa]}"`, 'success');
        } else {
            console.error(`❌ Erro ao atualizar etapa:`, result.error);
            showTemporaryMessage(`Erro ao salvar etapa`, 'error');
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

async function updateVaga(id, updatedData) {
    const vaga = vagas.find(v => v.id === id);
    if (vaga && vaga.rowId) {
        if (updatedData.etapa !== undefined) {
            await updateVagaEtapa(vaga.rowId, updatedData.etapa);
        }
    }
    
    const index = vagas.findIndex(v => v.id === id);
    if (index !== -1) {
        vagas[index] = { ...vagas[index], ...updatedData };
        renderAllCards();
    }
}

// ========== FUNÇÕES DE ORDENAÇÃO ==========
function getSortValue(vaga, type) {
    switch(type) {
        case 'cargo':
            return (vaga.cargo || '').toLowerCase();
        case 'cliente':
            return (vaga.cliente || '').toLowerCase();
        case 'status':
            const status = (vaga.status || '').toLowerCase();
            // Ordenar canceladas de forma especial
            if (status === 'cancelada pelo cliente' || status === 'cancelada') {
                return 'zzzz'; // Canceladas vão para o final
            }
            return status;
        case 'data':
        default:
            return vaga.dataAbertura ? new Date(vaga.dataAbertura) : 0;
    }
}

function sortVagas(vagasList) {
    return [...vagasList].sort((a, b) => {
        let valueA = getSortValue(a, currentFilterType);
        let valueB = getSortValue(b, currentFilterType);
        
        // Comparação especial para datas
        if (currentFilterType === 'data') {
            if (currentSortOrder === 'asc') {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        }
        
        // Comparação para strings
        if (currentSortOrder === 'asc') {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        }
    });
}

function getFilteredAndSorted() {
    let filtered = [...vagas];
    
    // Filtro de busca
    if (globalSearchTerm) {
        const term = globalSearchTerm.toLowerCase();
        filtered = filtered.filter(v => 
            (v.cargo && v.cargo.toLowerCase().includes(term)) ||
            (v.codigo && v.codigo.toLowerCase().includes(term)) ||
            (v.cliente && v.cliente.toLowerCase().includes(term)) ||
            (v.recrutador && v.recrutador.toLowerCase().includes(term))
        );
    }
    
    // Filtro de canceladas
    if (showOnlyCanceled) {
        filtered = filtered.filter(v => isVagaCancelada(v));
    }
    
    // Ordenação
    filtered = sortVagas(filtered);
    
    return filtered;
}

// ========== RENDERIZAÇÃO DO KANBAN ==========
function renderBoard() {
    kanbanBoard.innerHTML = '';
    const columnsContainer = document.createElement('div');
    columnsContainer.className = 'columns-container';
    
    stages.forEach((stageName, stageIdx) => {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.stage = stageIdx;
        
        const colHeader = document.createElement('div');
        colHeader.className = 'column-header';
        colHeader.innerHTML = `
            <h3 title="${stageName}">${stageName}</h3>
            <span class="column-count" id="count-${stageIdx}">0</span>
        `;
        column.appendChild(colHeader);
        
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'cards-container';
        cardsContainer.id = `container-${stageIdx}`;
        column.appendChild(cardsContainer);
        columnsContainer.appendChild(column);
    });
    
    kanbanBoard.appendChild(columnsContainer);
}

function renderAllCards() {
    // Limpar containers
    for (let s = 0; s < stages.length; s++) {
        const container = document.getElementById(`container-${s}`);
        if (container) container.innerHTML = '';
        const badge = document.getElementById(`count-${s}`);
        if (badge) badge.innerText = '0';
    }
    
    const filteredList = getFilteredAndSorted();
    console.log(`🎯 Renderizando ${filteredList.length} cards (Filtro: ${currentFilterType}, Ordem: ${currentSortOrder}, Canceladas: ${showOnlyCanceled})`);
    
    // Separar canceladas das ativas
    const grouped = {};
    stages.forEach((_, idx) => {
        grouped[idx] = { ativas: [], canceladas: [] };
    });
    
    filteredList.forEach(vaga => {
        const etapa = vaga.etapa !== undefined ? vaga.etapa : 0;
        if (isVagaCancelada(vaga)) {
            grouped[etapa].canceladas.push(vaga);
        } else {
            grouped[etapa].ativas.push(vaga);
        }
    });
    
    for (let s = 0; s < stages.length; s++) {
        const container = document.getElementById(`container-${s}`);
        const badge = document.getElementById(`count-${s}`);
        
        const totalCards = grouped[s].ativas.length + grouped[s].canceladas.length;
        if (badge) badge.innerText = totalCards;
        
        if (container) {
            // Primeiro as ativas
            grouped[s].ativas.forEach(vaga => {
                container.appendChild(createCardElement(vaga));
            });
            // Depois as canceladas
            grouped[s].canceladas.forEach(vaga => {
                container.appendChild(createCardElement(vaga));
            });
        }
        
        if (grouped[s].canceladas.length > 0) {
            console.log(`  Etapa ${stages[s]}: ${grouped[s].ativas.length} ativas + ${grouped[s].canceladas.length} canceladas`);
        }
    }
    
    attachDragAndDrop();
}

function createCardElement(vaga) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    
    // Adiciona classe especial se for cancelada
    if (isVagaCancelada(vaga)) {
        cardDiv.classList.add('canceled');
    }
    
    cardDiv.dataset.id = vaga.id;
    let expanded = false;
    const currentStage = vaga.etapa || 0;
    const hasPrev = currentStage > 0;
    const hasNext = currentStage < stages.length - 1;
    
    const isCanceled = isVagaCancelada(vaga);

    const header = document.createElement('div');
    header.className = 'card-header';
    
    const statusBadge = isCanceled ? '<div class="canceled-badge">❌ Cancelada</div>' : '';
    
    header.innerHTML = `
        <div class="card-info">
            <div class="card-cargo">${escapeHtml(vaga.cargo)}</div>
            ${vaga.codigo ? `<div class="card-codigo">📌 ${escapeHtml(vaga.codigo)}</div>` : ''}
            <div class="card-cliente">🏢 ${escapeHtml(vaga.cliente)}</div>
            ${statusBadge}
        </div>
        <div class="card-actions-row">
            <button class="move-btn move-left" ${!hasPrev || isCanceled ? 'disabled' : ''}><i class='bx bx-chevron-left'></i></button>
            <button class="move-btn move-right" ${!hasNext || isCanceled ? 'disabled' : ''}><i class='bx bx-chevron-right'></i></button>
            <button class="expand-btn"><i class='bx bx-chevron-down'></i></button>
        </div>
    `;
    cardDiv.appendChild(header);

    const details = document.createElement('div');
    details.className = 'card-details';
    details.innerHTML = `
        <div class="detail-row"><span class="detail-label">Recrutador</span><span class="detail-value">${escapeHtml(vaga.recrutador || '—')}</span></div>
        <div class="detail-row"><span class="detail-label">Tipo Contrato</span><span class="detail-value">${escapeHtml(vaga.tipoContrato || '—')}</span></div>
        <div class="detail-row"><span class="detail-label">Data Abertura</span><span class="detail-value">${formatDateTime(vaga.dataAbertura)}</span></div>
        <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${escapeHtml(vaga.status || '—')}</span></div>
        <div class="detail-row"><span class="detail-label">Linha na planilha</span><span class="detail-value">${vaga.linha || '—'}</span></div>
    `;

    const editDiv = document.createElement('div');
    editDiv.className = 'edit-fields';
    editDiv.style.display = 'none';
    
    editDiv.innerHTML = `
        <div class="edit-row">
            <label>Informações da vaga</label>
            <p style="font-size: 0.7rem; color: var(--text-muted);">Os dados da vaga são gerenciados diretamente na planilha "Interno".</p>
            <p style="font-size: 0.7rem; color: var(--text-muted);">Linha: ${vaga.linha || '—'}</p>
        </div>
        <div class="edit-actions">
            <button class="btn-cancel-edit">Fechar</button>
        </div>
    `;
    details.appendChild(editDiv);
    
    const editButton = document.createElement('button');
    editButton.className = 'btn-edit-card';
    editButton.innerHTML = '<i class="bx bx-info-circle"></i> Informações';
    details.appendChild(editButton);
    
    cardDiv.appendChild(details);

    // Eventos
    const expandBtn = header.querySelector('.expand-btn');
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        expanded = !expanded;
        if (expanded) cardDiv.classList.add('expanded');
        else cardDiv.classList.remove('expanded');
    });

    const moveLeft = header.querySelector('.move-left');
    const moveRight = header.querySelector('.move-right');
    
    if (moveLeft && !isCanceled) {
        moveLeft.addEventListener('click', (e) => {
            e.stopPropagation();
            let newStage = currentStage - 1;
            if (newStage < 0) return;
            const targetStageName = stages[newStage];
            showConfirm(`Mover "${vaga.cargo}" para a etapa "${targetStageName}"?`, async () => {
                await updateVaga(vaga.id, { etapa: newStage });
            });
        });
    }
    
    if (moveRight && !isCanceled) {
        moveRight.addEventListener('click', (e) => {
            e.stopPropagation();
            let newStage = currentStage + 1;
            if (newStage >= stages.length) return;
            const targetStageName = stages[newStage];
            showConfirm(`Mover "${vaga.cargo}" para a etapa "${targetStageName}"?`, async () => {
                await updateVaga(vaga.id, { etapa: newStage });
            });
        });
    }
    
    const cancelEdit = editDiv.querySelector('.btn-cancel-edit');
    
    editButton.addEventListener('click', () => {
        editDiv.style.display = 'flex';
        editButton.style.display = 'none';
    });
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', () => {
            editDiv.style.display = 'none';
            editButton.style.display = 'block';
        });
    }

    return cardDiv;
}

// ========== DRAG AND DROP ==========
function attachDragAndDrop() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        if (!card.classList.contains('canceled')) {
            card.setAttribute('draggable', 'true');
            card.removeEventListener('dragstart', dragStart);
            card.removeEventListener('dragend', dragEnd);
            card.addEventListener('dragstart', dragStart);
            card.addEventListener('dragend', dragEnd);
        } else {
            card.setAttribute('draggable', 'false');
        }
    });
    
    const containers = document.querySelectorAll('.cards-container');
    containers.forEach(container => {
        container.removeEventListener('dragover', dragOver);
        container.removeEventListener('drop', drop);
        container.addEventListener('dragover', dragOver);
        container.addEventListener('drop', drop);
    });
}

let draggedId = null;
function dragStart(e) {
    const card = e.target.closest('.card');
    if (card && !card.classList.contains('canceled')) {
        draggedId = card.dataset.id;
        e.dataTransfer.setData('text/plain', draggedId);
    } else {
        e.preventDefault();
        return false;
    }
}
function dragEnd() { draggedId = null; }
function dragOver(e) { e.preventDefault(); }

function drop(e) {
    e.preventDefault();
    const targetContainer = e.target.closest('.cards-container');
    if (!targetContainer) return;
    const column = targetContainer.closest('.kanban-column');
    const targetStage = parseInt(column.dataset.stage);
    const vaga = vagas.find(v => v.id == draggedId);
    if (vaga && (vaga.etapa !== targetStage) && !isVagaCancelada(vaga)) {
        const targetStageName = stages[targetStage];
        showConfirm(`Mover "${vaga.cargo}" para a etapa "${targetStageName}"?`, async () => {
            await updateVaga(vaga.id, { etapa: targetStage });
        });
    }
}

// ========== EVENTOS DOS FILTROS ==========

// Filtro de tipo (Data, Cargo, Cliente, Status)
if (filterTypeSelect) {
    filterTypeSelect.addEventListener('change', (e) => {
        currentFilterType = e.target.value;
        updateSortButtonIcon();
        renderAllCards();
        showTemporaryMessage(`Ordenando por: ${filterTypeSelect.options[filterTypeSelect.selectedIndex].text}`, 'info');
    });
}

// Botão de ordem (crescente/decrescente)
function updateSortButtonIcon() {
    if (sortOrderBtn) {
        sortOrderBtn.classList.remove('asc', 'desc');
        sortOrderBtn.classList.add(currentSortOrder);
        
        const icon = sortOrderBtn.querySelector('i');
        if (icon) {
            if (currentSortOrder === 'asc') {
                icon.className = 'bx bx-up-arrow-alt';
            } else {
                icon.className = 'bx bx-down-arrow-alt';
            }
        }
    }
}

if (sortOrderBtn) {
    sortOrderBtn.addEventListener('click', () => {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        updateSortButtonIcon();
        renderAllCards();
        
        const orderText = currentSortOrder === 'asc' ? 'crescente' : 'decrescente';
        const filterText = filterTypeSelect.options[filterTypeSelect.selectedIndex].text;
        showTemporaryMessage(`Ordenação: ${filterText} (${orderText})`, 'info');
    });
}

// Botão de filtrar canceladas
if (filterCanceledBtn) {
    filterCanceledBtn.addEventListener('click', () => {
        showOnlyCanceled = !showOnlyCanceled;
        
        if (showOnlyCanceled) {
            filterCanceledBtn.classList.add('active');
            showTemporaryMessage('Mostrando apenas vagas canceladas', 'info');
        } else {
            filterCanceledBtn.classList.remove('active');
            showTemporaryMessage('Mostrando todas as vagas', 'info');
        }
        
        renderAllCards();
    });
}

// ========== MODAL ==========
function openVagaModal(vaga = null) {
    showError('Para adicionar ou editar uma vaga, utilize a planilha "Interno" diretamente.\n\nAs vagas são sincronizadas automaticamente.');
}

addBtn.addEventListener('click', () => {
    openVagaModal();
});

// Botão de sincronizar
if (syncNowBtn) {
    syncNowBtn.addEventListener('click', () => {
        fullSync(true);
    });
}

// ========== CONFIRMAÇÃO ==========
function showConfirm(msg, onConfirm) {
    confirmMessageSpan.innerText = msg;
    confirmModal.style.display = 'flex';
    currentConfirmCallback = onConfirm;
}

confirmYesBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    if (currentConfirmCallback) currentConfirmCallback();
    currentConfirmCallback = null;
});

confirmNoBtn.addEventListener('click', () => {
    confirmModal.style.display = 'none';
    currentConfirmCallback = null;
});

window.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        confirmModal.style.display = 'none';
    }
    if (e.target === vagaModal) {
        vagaModal.style.display = 'none';
    }
});

// ========== EXPORTAR EXCEL ==========
exportBtn.addEventListener('click', () => {
    try {
        let filtered = getFilteredAndSorted();
        
        if (filtered.length === 0) {
            alert("Nenhuma vaga para exportar.");
            return;
        }
        
        const worksheetData = [
            ["Cargo", "Código", "Cliente", "Recrutador", "Tipo Contrato", "Etapa", "Data Abertura", "Status", "Linha"]
        ];
        
        filtered.forEach(vaga => {
            const stageName = stages[vaga.etapa] || "Etapa inválida";
            worksheetData.push([
                vaga.cargo || "",
                vaga.codigo || "",
                vaga.cliente || "",
                vaga.recrutador || "",
                vaga.tipoContrato || "",
                stageName,
                formatDateTime(vaga.dataAbertura),
                vaga.status || "",
                vaga.linha || ""
            ]);
        });
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Kanban de Vagas");
        worksheet['!cols'] = [
            {wch:25}, {wch:15}, {wch:25}, {wch:20}, {wch:15}, {wch:20}, {wch:18}, {wch:15}, {wch:10}
        ];
        
        const fileName = `vagas_kanban_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showTemporaryMessage('Exportação concluída!', 'success');
    } catch (error) {
        console.error("Erro ao exportar Excel:", error);
        alert("Falha ao gerar o arquivo Excel.");
    }
});

// ========== BUSCA ==========
if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
        globalSearchTerm = e.target.value;
        renderAllCards();
    });
}

// ========== TEMA CLARO/ESCURO ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = themeToggle.querySelector('i');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeIcon.classList.remove('bx-moon');
        themeIcon.classList.add('bx-sun');
    } else {
        document.body.classList.remove('dark');
        themeIcon.classList.remove('bx-sun');
        themeIcon.classList.add('bx-moon');
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    const themeIcon = themeToggle.querySelector('i');
    
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

// ========== AUTENTICAÇÃO ==========
function checkAuth() {
    setLoading(true);
    
    setTimeout(() => {
        currentUser = { email: 'usuario@planilha.com' };
        console.log('✅ Usuário autenticado via planilha');
        setLoading(false);
        renderBoard();
        initialSync();
        
        // Inicializar ícone do botão de ordem
        updateSortButtonIcon();
    }, 500);
}

// ========== LOGOUT ==========
logoutBtn.addEventListener('click', async () => {
    if (syncInterval) clearInterval(syncInterval);
    window.location.href = 'intranet.html';
});

// ========== INICIALIZAÇÃO ==========
function init() {
    initTheme();
    checkAuth();
}

// Inicia tudo
init();