// ========== CONFIGURAÇÃO DA PLANILHA ==========
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwZQ_z4wo6NedKv0NYry12hhpcVwUBv8OTh1-Qcb_JTOKzSfZ4EiWIi36Lpbb8gT_Bj/exec";

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
let globalSortType = 'data_asc';
let currentUser = null;
let lastSyncId = 0;
let syncInterval = null;

// ========== DOM ELEMENTS ==========
const addBtn = document.getElementById('addVagaBtn');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const exportBtn = document.getElementById('exportExcelBtn');
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
const globalSort = document.getElementById('globalSort');

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
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// ========== FUNÇÕES DE SINCRONIZAÇÃO COM PLANILHA ==========
async function syncWithSheet() {
    try {
        console.log('🔄 Sincronizando com planilha...');
        
        const response = await fetch(`${SHEET_API_URL}?action=getRowsSince&since=${lastSyncId}`);
        const data = await response.json();
        
        if (data.error) {
            console.error('Erro na resposta da API:', data.error);
            return;
        }
        
        if (data.novasVagas && data.novasVagas.length > 0) {
            console.log(`📥 ${data.novasVagas.length} novas vagas encontradas`);
            
            data.novasVagas.forEach(novaVaga => {
                const existe = vagas.some(v => v.id === novaVaga.id);
                if (!existe) {
                    vagas.push(novaVaga);
                    console.log(`✅ Nova vaga: ${novaVaga.cargo} (Linha ${novaVaga.linha})`);
                }
            });
            
            if (data.lastSyncId > lastSyncId) {
                lastSyncId = data.lastSyncId;
            }
            
            renderAllCards();
        }
    } catch (error) {
        console.error('Erro na sincronização:', error);
    }
}

// Sincronização completa (primeira carga)
async function fullSync() {
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
            console.log(`📊 ${vagas.length} vagas carregadas da planilha`);
            console.log(`📋 Detalhes: ${data.linhasComTimestamp || vagas.length} linhas com timestamp`);
            
            // Log das primeiras 5 vagas para debug
            if (vagas.length > 0) {
                console.log('🔍 Primeiras vagas carregadas:');
                vagas.slice(0, 5).forEach((v, i) => {
                    console.log(`  ${i+1}. Linha ${v.linha}: ${v.cargo} (${v.cliente}) - Etapa ${v.etapa}`);
                });
            }
            
            renderAllCards();
        } else {
            console.warn('⚠️ Nenhuma vaga encontrada na resposta da API');
            vagas = [];
        }
        
        setLoading(false);
    } catch (error) {
        console.error('Erro no sync completo:', error);
        setLoading(false);
        showError('Erro ao carregar dados da planilha. Verifique a conexão.');
    }
}

// Atualizar etapa da vaga na planilha
async function updateVagaEtapa(rowId, novaEtapa) {
    try {
        console.log(`📤 Atualizando etapa da vaga linha ${rowId} para ${stages[novaEtapa]}`);
        
        // Usa GET em vez de POST para evitar CORS
        const url = `${SHEET_API_URL}?action=updateEtapa&rowId=${rowId}&novaEtapa=${novaEtapa}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Etapa atualizada com sucesso`);
        } else {
            console.error(`❌ Erro ao atualizar etapa:`, result.error);
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

// ========== CRUD ==========
async function addVaga(vagaData) {
    showError('Para adicionar uma nova vaga, insira os dados diretamente na planilha "Interno".');
    await fullSync();
}

async function deleteVaga(id) {
    const vaga = vagas.find(v => v.id === id);
    showError(`Para excluir a vaga "${vaga?.cargo}", remova a linha ${vaga?.linha} diretamente na planilha "Interno".`);
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

function getFilteredAndSorted() {
    let filtered = [...vagas];
    
    if (globalSearchTerm) {
        const term = globalSearchTerm.toLowerCase();
        filtered = filtered.filter(v => 
            (v.cargo && v.cargo.toLowerCase().includes(term)) ||
            (v.codigo && v.codigo.toLowerCase().includes(term)) ||
            (v.cliente && v.cliente.toLowerCase().includes(term)) ||
            (v.recrutador && v.recrutador.toLowerCase().includes(term))
        );
    }
    
    switch(globalSortType) {
        case 'cargo_asc': 
            filtered.sort((a,b) => (a.cargo || '').localeCompare(b.cargo || '')); 
            break;
        case 'cargo_desc': 
            filtered.sort((a,b) => (b.cargo || '').localeCompare(a.cargo || '')); 
            break;
        case 'data_asc': 
            filtered.sort((a,b) => {
                const dateA = a.dataAbertura ? new Date(a.dataAbertura) : 0;
                const dateB = b.dataAbertura ? new Date(b.dataAbertura) : 0;
                return dateA - dateB;
            }); 
            break;
        case 'data_desc': 
            filtered.sort((a,b) => {
                const dateA = a.dataAbertura ? new Date(a.dataAbertura) : 0;
                const dateB = b.dataAbertura ? new Date(b.dataAbertura) : 0;
                return dateB - dateA;
            }); 
            break;
        default: 
            filtered.sort((a,b) => (a.dataAbertura ? new Date(a.dataAbertura) : 0) - (b.dataAbertura ? new Date(b.dataAbertura) : 0));
    }
    return filtered;
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
    console.log(`🎯 Renderizando ${filteredList.length} cards`);
    
    const grouped = {};
    filteredList.forEach(vaga => {
        const etapa = vaga.etapa !== undefined ? vaga.etapa : 0;
        if (!grouped[etapa]) grouped[etapa] = [];
        grouped[etapa].push(vaga);
    });
    
    for (let s = 0; s < stages.length; s++) {
        const container = document.getElementById(`container-${s}`);
        const badge = document.getElementById(`count-${s}`);
        const count = (grouped[s] || []).length;
        if (badge) badge.innerText = count;
        
        if (container && grouped[s]) {
            console.log(`  Etapa ${stages[s]}: ${count} cards`);
            grouped[s].forEach(vaga => {
                const card = createCardElement(vaga);
                container.appendChild(card);
            });
        }
    }
    
    attachDragAndDrop();
}

function createCardElement(vaga) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.dataset.id = vaga.id;
    let expanded = false;
    const currentStage = vaga.etapa || 0;
    const hasPrev = currentStage > 0;
    const hasNext = currentStage < stages.length - 1;

    const header = document.createElement('div');
    header.className = 'card-header';
    
    header.innerHTML = `
        <div class="card-info">
            <div class="card-cargo">${escapeHtml(vaga.cargo)}</div>
            ${vaga.codigo ? `<div class="card-codigo">📌 ${escapeHtml(vaga.codigo)}</div>` : ''}
            <div class="card-cliente">🏢 ${escapeHtml(vaga.cliente)}</div>
        </div>
        <div class="card-actions-row">
            <button class="move-btn move-left" ${!hasPrev ? 'disabled' : ''}><i class='bx bx-chevron-left'></i></button>
            <button class="move-btn move-right" ${!hasNext ? 'disabled' : ''}><i class='bx bx-chevron-right'></i></button>
            <button class="delete-card-btn"><i class='bx bx-trash'></i></button>
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
    const deleteBtn = header.querySelector('.delete-card-btn');
    
    if (moveLeft) {
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
    
    if (moveRight) {
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
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirm(`Remover a vaga "${vaga.cargo}" permanentemente?`, async () => await deleteVaga(vaga.id));
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
        card.setAttribute('draggable', 'true');
        card.removeEventListener('dragstart', dragStart);
        card.removeEventListener('dragend', dragEnd);
        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);
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
    draggedId = e.target.closest('.card').dataset.id;
    e.dataTransfer.setData('text/plain', draggedId);
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
    if (vaga && (vaga.etapa !== targetStage)) {
        const targetStageName = stages[targetStage];
        showConfirm(`Mover "${vaga.cargo}" para a etapa "${targetStageName}"?`, async () => {
            await updateVaga(vaga.id, { etapa: targetStage });
        });
    }
}

// ========== MODAL ==========
function openVagaModal(vaga = null) {
    showError('Para adicionar ou editar uma vaga, utilize a planilha "Interno" diretamente.\n\nAs vagas são sincronizadas automaticamente.');
}

addBtn.addEventListener('click', () => {
    openVagaModal();
});

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
});

// ========== EXPORTAR EXCEL ==========
exportBtn.addEventListener('click', () => {
    try {
        const filtered = getFilteredAndSorted();
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
    } catch (error) {
        console.error("Erro ao exportar Excel:", error);
        alert("Falha ao gerar o arquivo Excel.");
    }
});

// ========== BUSCA E ORDENAÇÃO ==========
if (globalSearch) {
    globalSearch.addEventListener('input', (e) => {
        globalSearchTerm = e.target.value;
        renderAllCards();
    });
}

if (globalSort) {
    globalSort.addEventListener('change', (e) => {
        globalSortType = e.target.value;
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
        fullSync();
        
        if (syncInterval) clearInterval(syncInterval);
        syncInterval = setInterval(() => {
            if (currentUser) {
                syncWithSheet();
            }
        }, 10000);
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

init();