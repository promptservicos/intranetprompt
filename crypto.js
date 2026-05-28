// ========== crypto.js ==========
// Biblioteca de criptografia para a Intranet Prompt Serviços

// ========== CONFIGURAÇÃO ==========
// ATENÇÃO: Em produção, mova esta chave para variáveis de ambiente!
// Nunca deixe hardcoded em código front-end em produção!
const ENCRYPTION_KEY = 'PromptServicosIntranet2024!@#$%SecureKey#Prompt';

// ========== FUNÇÕES BASE DE CRIPTOGRAFIA ==========

/**
 * Criptografa dados (objeto ou string)
 * @param {any} data - Dados a serem criptografados
 * @returns {string|null} - Dados criptografados em Base64
 */
function encryptData(data) {
    try {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
        return encrypted;
    } catch (error) {
        console.error('❌ Erro ao criptografar:', error);
        return null;
    }
}

/**
 * Descriptografa dados
 * @param {string} encryptedData - Dados criptografados
 * @returns {any|null} - Dados descriptografados (objeto ou string)
 */
function decryptData(encryptedData) {
    try {
        if (!encryptedData) return null;
        
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!decryptedString) {
            throw new Error('Falha na descriptografia - dados corrompidos');
        }
        
        // Tentar fazer parse como JSON, se falhar retornar como string
        try {
            return JSON.parse(decryptedString);
        } catch {
            return decryptedString;
        }
    } catch (error) {
        console.error('❌ Erro ao descriptografar:', error);
        return null;
    }
}

// ========== CRIPTOGRAFIA DE CAMPOS INDIVIDUAIS ==========

/**
 * Criptografa um campo específico (útil para campos sensíveis)
 * @param {string} value - Valor a ser criptografado
 * @returns {string|null} - Valor criptografado
 */
function encryptField(value) {
    if (!value) return null;
    try {
        return CryptoJS.AES.encrypt(String(value), ENCRYPTION_KEY).toString();
    } catch (error) {
        console.error('❌ Erro ao criptografar campo:', error);
        return null;
    }
}

/**
 * Descriptografa um campo específico
 * @param {string} encryptedValue - Valor criptografado
 * @returns {string|null} - Valor descriptografado
 */
function decryptField(encryptedValue) {
    if (!encryptedValue) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('❌ Erro ao descriptografar campo:', error);
        return null;
    }
}

// ========== CRIPTOGRAFIA PARA CLIENTES (DADOS COMPLETOS) ==========

/**
 * Prepara dados do cliente para salvamento (criptografa campos sensíveis)
 * @param {Object} clienteData - Dados completos do cliente
 * @returns {Object} - Dados separados em públicos e criptografados
 */
function prepareClienteForSave(clienteData) {
    // Dados públicos (podem ser buscados)
    const dadosPublicos = {
        nome: clienteData.nome || '',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
    };
    
    // Dados sensíveis (serão criptografados juntos)
    const dadosSensiveis = {
        cnpj: clienteData.cnpj || '',
        rsocial: clienteData.rsocial || '',
        contato: clienteData.contato || '',
        email: clienteData.email || '',
        telefone: clienteData.telefone || '',
        endereco: clienteData.endereco || '',
        iestadual: clienteData.iestadual || '',
        codigogi: clienteData.codigogi || '',
        supervisor: clienteData.supervisor || '',
        ponto: clienteData.ponto || '',
        fechfolha: clienteData.fechfolha || '',
        intmanha: clienteData.intmanha || '',
        inttarde: clienteData.inttarde || '',
        intnoite: clienteData.intnoite || '',
        emifat: clienteData.emifat || '',
        vencfat: clienteData.vencfat || '',
        adiantdata: clienteData.adiantdata || '',
        pagdata: clienteData.pagdata || '',
        beneadiant: clienteData.beneadiant || '',
        benepag: clienteData.benepag || '',
        cargos: clienteData.cargos || [],
        fotos: clienteData.fotos || []
    };
    
    // Criptografar todos os dados sensíveis juntos
    const dadosCriptografados = encryptData(dadosSensiveis);
    
    return {
        dadosPublicos,
        dadosCriptografados
    };
}

/**
 * Recupera dados completos do cliente (descriptografa)
 * @param {Object} clienteFirestore - Documento do Firestore
 * @returns {Object|null} - Dados completos do cliente
 */
function recoverClienteFromSave(clienteFirestore) {
    try {
        const data = clienteFirestore;
        
        if (!data.dadosCriptografados) {
            console.error('Dados criptografados não encontrados');
            return null;
        }
        
        const dadosSensiveis = decryptData(data.dadosCriptografados);
        
        if (!dadosSensiveis) {
            return null;
        }
        
        return {
            id: data.id,
            ...(data.dadosPublicos || {}),
            ...dadosSensiveis
        };
    } catch (error) {
        console.error('❌ Erro ao recuperar cliente:', error);
        return null;
    }
}

// ========== CRIPTOGRAFIA PARA VAGAS ==========

/**
 * Prepara dados da vaga para salvamento
 * @param {Object} vagaData - Dados da vaga
 * @returns {Object} - Dados prontos para o Firestore
 */
function prepareVagaForSave(vagaData) {
    // Dados sensíveis da vaga
    const dadosSensiveis = {
        descricao: vagaData.descricao || '',
        requisitos: vagaData.requisitos || [],
        beneficios: vagaData.beneficios || [],
        observacoes: vagaData.observacoes || ''
    };
    
    // Dados públicos (para busca e listagem)
    const dadosPublicos = {
        cargo: vagaData.cargo || '',
        cliente: vagaData.cliente || '',
        codigo: vagaData.codigo || '',
        recrutador: vagaData.recrutador || '',
        tipoContrato: vagaData.tipoContrato || '',
        dataAbertura: vagaData.dataAbertura || new Date().toISOString(),
        status: vagaData.status || 'Aguardando',
        etapa: vagaData.etapa || 0,
        linha: vagaData.linha || null,
        rowId: vagaData.rowId || null
    };
    
    return {
        ...dadosPublicos,
        dadosCriptografados: encryptData(dadosSensiveis)
    };
}

/**
 * Recupera dados completos da vaga
 * @param {Object} vagaFirestore - Documento do Firestore
 * @returns {Object|null} - Dados completos da vaga
 */
function recoverVagaFromSave(vagaFirestore) {
    try {
        const data = vagaFirestore;
        
        if (!data.dadosCriptografados) {
            return data; // Se não tem criptografia, retorna como está
        }
        
        const dadosSensiveis = decryptData(data.dadosCriptografados);
        
        return {
            ...data,
            ...dadosSensiveis,
            dadosCriptografados: undefined
        };
    } catch (error) {
        console.error('❌ Erro ao recuperar vaga:', error);
        return vagaFirestore;
    }
}

// ========== CRIPTOGRAFIA PARA USUÁRIOS (DADOS PESSOAIS) ==========

/**
 * Prepara dados do usuário para salvamento
 * @param {Object} userData - Dados do usuário
 * @returns {Object} - Dados prontos para o Firestore
 */
function prepareUserForSave(userData) {
    // Dados sensíveis do usuário
    const dadosSensiveis = {
        telefone: userData.telefone || '',
        aniversario: userData.aniversario || '',
        endereco: userData.endereco || '',
        documentos: userData.documentos || {}
    };
    
    // Dados públicos
    const dadosPublicos = {
        nome: userData.nome || '',
        email: userData.email || '',
        cargo: userData.cargo || '',
        departamento: userData.departamento || '',
        ramal: userData.ramal || '',
        atalhos: userData.atalhos || [],
        status: userData.status || 'ativo',
        criadoEm: userData.criadoEm || new Date().toISOString()
    };
    
    return {
        ...dadosPublicos,
        dadosCriptografados: encryptData(dadosSensiveis)
    };
}

/**
 * Recupera dados completos do usuário
 * @param {Object} userFirestore - Documento do Firestore
 * @returns {Object|null} - Dados completos do usuário
 */
function recoverUserFromSave(userFirestore) {
    try {
        const data = userFirestore;
        
        if (!data.dadosCriptografados) {
            return data;
        }
        
        const dadosSensiveis = decryptData(data.dadosCriptografados);
        
        return {
            ...data,
            ...dadosSensiveis,
            dadosCriptografados: undefined
        };
    } catch (error) {
        console.error('❌ Erro ao recuperar usuário:', error);
        return userFirestore;
    }
}

// ========== FUNÇÕES DE VALIDAÇÃO ==========

/**
 * Verifica se os dados estão criptografados
 * @param {string} data - Dados para verificar
 * @returns {boolean}
 */
function isEncrypted(data) {
    if (!data || typeof data !== 'string') return false;
    // Verifica se parece com um hash AES (Base64 com padding)
    return /^[A-Za-z0-9+\/=]+$/.test(data) && data.length > 20;
}

/**
 * Gera hash seguro para IDs ou senhas
 * @param {string} value - Valor para gerar hash
 * @returns {string}
 */
function generateHash(value) {
    return CryptoJS.SHA256(value + ENCRYPTION_KEY).toString();
}

// ========== EXEMPLOS DE USO ==========

/*
// ===== SALVAR CLIENTE =====
async function salvarCliente(clienteData) {
    const dadosParaSalvar = prepareClienteForSave(clienteData);
    
    await db.collection('clientes').doc(clienteId).set({
        dadosPublicos: dadosParaSalvar.dadosPublicos,
        dadosCriptografados: dadosParaSalvar.dadosCriptografados,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// ===== CARREGAR CLIENTE =====
async function carregarCliente(clienteId) {
    const doc = await db.collection('clientes').doc(clienteId).get();
    const cliente = recoverClienteFromSave({ id: doc.id, ...doc.data() });
    return cliente;
}

// ===== SALVAR VAGA =====
async function salvarVaga(vagaData) {
    const dadosParaSalvar = prepareVagaForSave(vagaData);
    await db.collection('vagas').add(dadosParaSalvar);
}

// ===== CARREGAR VAGA =====
async function carregarVaga(vagaId) {
    const doc = await db.collection('vagas').doc(vagaId).get();
    const vaga = recoverVagaFromSave({ id: doc.id, ...doc.data() });
    return vaga;
}
*/

// ========== EXPORTAR FUNÇÕES (SE USAR MÓDULOS) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        encryptData,
        decryptData,
        encryptField,
        decryptField,
        prepareClienteForSave,
        recoverClienteFromSave,
        prepareVagaForSave,
        recoverVagaFromSave,
        prepareUserForSave,
        recoverUserFromSave,
        isEncrypted,
        generateHash
    };
}