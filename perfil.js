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
let currentUserUid = null;

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

// ========== FUNÇÕES DE FORMATAÇÃO ==========
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

function formatarCEP(cep) {
    if (!cep) return 'Não informado';
    const numeros = cep.replace(/\D/g, '');
    if (numeros.length === 8) {
        return numeros.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    }
    return cep;
}

function formatarDataAniversario(dataStr) {
    if (!dataStr) return 'Não informado';
    const meses = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    const [dia, mes] = dataStr.split('/');
    return `${parseInt(dia)} de ${meses[mes]}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== CARREGAR DADOS DO USUÁRIO ==========
async function carregarPerfil() {
    if (!currentUserUid) return;
    
    try {
        const doc = await db.collection('usuarios').doc(currentUserUid).get();
        
        if (!doc.exists) {
            showToast('Erro ao carregar dados do perfil', true);
            return;
        }
        
        const data = doc.data();
        
        if (data.dadosCriptografados) {
            const usuarioDecriptografado = recoverUserFromSave({ id: doc.id, ...data });
            if (usuarioDecriptografado) {
                currentUserData = usuarioDecriptografado;
            } else {
                currentUserData = data;
            }
        } else {
            currentUserData = data;
        }
        
        currentUserData.uid = currentUserUid;
        
        preencherPerfil();
        
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        showToast('Erro ao carregar dados do perfil', true);
    }
}

// ========== PREENCHER PERFIL NA TELA ==========
function preencherPerfil() {
    const nome = currentUserData.nome || 'Usuário';
    const cargo = currentUserData.cargo || 'Colaborador';
    const departamento = currentUserData.departamento || 'Não informado';
    
    document.getElementById('perfilNome').textContent = nome;
    document.getElementById('perfilCargo').textContent = cargo;
    document.getElementById('perfilDepartamento').textContent = departamento;
    
    const names = nome.split(' ');
    const initials = names[0].charAt(0) + (names.length > 1 ? names[names.length-1].charAt(0) : '');
    document.getElementById('perfilAvatarText').textContent = initials.toUpperCase();
    
    // Informações Pessoais
    document.getElementById('infoNome').textContent = nome;
    document.getElementById('infoEmailPessoal').textContent = currentUserData.emailPessoal || 'Não informado';
    document.getElementById('infoTelefone').textContent = formatarTelefone(currentUserData.telefone);
    document.getElementById('infoTelefone2').textContent = formatarTelefone(currentUserData.telefone2);
    document.getElementById('infoAniversario').textContent = formatarDataAniversario(currentUserData.aniversario);
    
    // Informações Profissionais
    document.getElementById('infoCargo').textContent = cargo;
    document.getElementById('infoDepartamento').textContent = departamento;
    document.getElementById('infoRamal').textContent = currentUserData.ramal || 'Não informado';
    document.getElementById('infoEmailCorp').textContent = currentUserData.email || 'Não informado';
    document.getElementById('infoAdmissao').textContent = currentUserData.dataAdmissao || 'Não informado';
    
    // Endereço
    const endereco = currentUserData.endereco || 'Não informado';
    const bairro = currentUserData.bairro || 'Não informado';
    const cidade = currentUserData.cidade || '';
    const uf = currentUserData.uf || '';
    const cidadeUf = cidade && uf ? `${cidade}/${uf}` : cidade || uf || 'Não informado';
    
    document.getElementById('infoEndereco').textContent = endereco;
    document.getElementById('infoBairro').textContent = bairro;
    document.getElementById('infoCidadeUf').textContent = cidadeUf;
    document.getElementById('infoCep').textContent = formatarCEP(currentUserData.cep);
}

// ========== ABRIR MODAL DE EDIÇÃO ==========
function abrirModalEditar() {
    document.getElementById('editNome').value = currentUserData.nome || '';
    document.getElementById('editEmailPessoal').value = currentUserData.emailPessoal || '';
    document.getElementById('editTelefone').value = currentUserData.telefone || '';
    document.getElementById('editTelefone2').value = currentUserData.telefone2 || '';
    document.getElementById('editAniversario').value = currentUserData.aniversario || '';
    document.getElementById('editRamal').value = currentUserData.ramal || '';
    
    document.getElementById('editCargo').value = currentUserData.cargo || '';
    document.getElementById('editDepartamento').value = currentUserData.departamento || '';
    document.getElementById('editEmail').value = currentUserData.email || '';
    
    document.getElementById('editEndereco').value = currentUserData.endereco || '';
    document.getElementById('editBairro').value = currentUserData.bairro || '';
    document.getElementById('editCidade').value = currentUserData.cidade || '';
    document.getElementById('editUf').value = currentUserData.uf || '';
    document.getElementById('editCep').value = currentUserData.cep || '';
    
    document.getElementById('editarPerfilModal').style.display = 'flex';
}

function fecharModalEditar() {
    document.getElementById('editarPerfilModal').style.display = 'none';
}

// ========== SALVAR ALTERAÇÕES DO PERFIL ==========
async function salvarEdicaoPerfil(event) {
    event.preventDefault();
    
    const dadosAtualizados = {
        ...currentUserData,
        nome: document.getElementById('editNome').value.trim(),
        emailPessoal: document.getElementById('editEmailPessoal').value.trim(),
        telefone: document.getElementById('editTelefone').value.trim(),
        telefone2: document.getElementById('editTelefone2').value.trim(),
        aniversario: document.getElementById('editAniversario').value.trim(),
        ramal: document.getElementById('editRamal').value.trim(),
        endereco: document.getElementById('editEndereco').value.trim(),
        bairro: document.getElementById('editBairro').value.trim(),
        cidade: document.getElementById('editCidade').value.trim(),
        uf: document.getElementById('editUf').value.trim().toUpperCase(),
        cep: document.getElementById('editCep').value.trim()
    };
    
    if (!dadosAtualizados.nome) {
        showToast('O nome é obrigatório', true);
        return;
    }
    
    try {
        const dadosPublicos = {
            nome: dadosAtualizados.nome,
            email: dadosAtualizados.email,
            cargo: dadosAtualizados.cargo,
            departamento: dadosAtualizados.departamento,
            ramal: dadosAtualizados.ramal,
            status: dadosAtualizados.status || 'ativo'
        };
        
        const dadosSensiveis = {
            emailPessoal: dadosAtualizados.emailPessoal,
            telefone: dadosAtualizados.telefone,
            telefone2: dadosAtualizados.telefone2,
            aniversario: dadosAtualizados.aniversario,
            endereco: dadosAtualizados.endereco,
            bairro: dadosAtualizados.bairro,
            cidade: dadosAtualizados.cidade,
            uf: dadosAtualizados.uf,
            cep: dadosAtualizados.cep,
            dataAdmissao: dadosAtualizados.dataAdmissao,
            atalhos: dadosAtualizados.atalhos || []
        };
        
        const dadosCriptografados = encryptData(dadosSensiveis);
        
        await db.collection('usuarios').doc(currentUserUid).set({
            ...dadosPublicos,
            dadosCriptografados: dadosCriptografados,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        currentUserData = {
            ...dadosPublicos,
            ...dadosSensiveis,
            uid: currentUserUid
        };
        
        preencherPerfil();
        fecharModalEditar();
        showToast('Perfil atualizado com sucesso!', false);
        
        // Atualizar header
        const names = dadosAtualizados.nome.split(' ');
        const initials = names[0].charAt(0) + (names.length > 1 ? names[names.length-1].charAt(0) : '');
        document.getElementById('userName').textContent = dadosAtualizados.nome;
        document.getElementById('userAvatarText').textContent = initials;
        
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        showToast('Erro ao salvar alterações', true);
    }
}

// ========== AUTENTICAÇÃO ==========
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUserUid = user.uid;
        
        try {
            const doc = await db.collection('usuarios').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                let userData;
                
                if (data.dadosCriptografados) {
                    const dadosSensiveis = decryptData(data.dadosCriptografados);
                    userData = { ...data, ...dadosSensiveis };
                } else {
                    userData = data;
                }
                
                document.getElementById('userName').textContent = userData.nome || 'Usuário';
                document.getElementById('userRole').textContent = userData.cargo || 'Colaborador';
                
                const names = (userData.nome || 'Usuário').split(' ');
                const initials = names[0].charAt(0) + (names.length > 1 ? names[names.length-1].charAt(0) : '');
                document.getElementById('userAvatarText').textContent = initials;
            }
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
        
        await carregarPerfil();
        
    } else {
        window.location.href = 'index.html';
    }
});

// ========== EVENTOS ==========
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch(error => console.error("Erro no logout:", error));
});

const userInfoPanel = document.getElementById('userInfoPanel');
if (userInfoPanel) {
    userInfoPanel.addEventListener('click', () => {
        window.location.href = 'intranet.html';
    });
}

const logoHome = document.getElementById('logoHome');
if (logoHome) {
    logoHome.addEventListener('click', () => {
        window.location.href = 'intranet.html';
    });
}

const btnEditarPerfil = document.getElementById('btnEditarPerfil');
if (btnEditarPerfil) {
    btnEditarPerfil.addEventListener('click', abrirModalEditar);
}

const modalCloseEditar = document.querySelector('.modal-close-editar');
if (modalCloseEditar) {
    modalCloseEditar.addEventListener('click', fecharModalEditar);
}

const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener('click', fecharModalEditar);
}

const editarPerfilForm = document.getElementById('editarPerfilForm');
if (editarPerfilForm) {
    editarPerfilForm.addEventListener('submit', salvarEdicaoPerfil);
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('editarPerfilModal');
    if (e.target === modal) {
        fecharModalEditar();
    }
});

// Formatação automática
const telefoneInput = document.getElementById('editTelefone');
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

const telefone2Input = document.getElementById('editTelefone2');
if (telefone2Input) {
    telefone2Input.addEventListener('input', (e) => {
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

const cepInput = document.getElementById('editCep');
if (cepInput) {
    cepInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length === 8) {
            value = value.replace(/^(\d{5})(\d{3})$/, '$1-$2');
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

document.body.style.position = 'relative';
document.body.style.minHeight = '100vh';

window.addEventListener('scroll', ajustarBotaoTema);
window.addEventListener('resize', ajustarBotaoTema);
window.addEventListener('load', ajustarBotaoTema);
setTimeout(ajustarBotaoTema, 100);