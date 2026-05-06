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

// ========== AUTENTICAÇÃO E DADOS DO USUÁRIO ==========
let currentUserData = {};

auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('usuarios').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    currentUserData = doc.data();
                    document.getElementById('userName').textContent = currentUserData.nome;
                    document.getElementById('userRole').textContent = currentUserData.cargo;
                    document.getElementById('welcomeText').textContent = `Bem-vindo, ${currentUserData.nome}!`;
                    
                    const names = currentUserData.nome.split(' ');
                    const initials = names[0].charAt(0) + (names.length > 1 ? names[names.length-1].charAt(0) : '');
                    document.getElementById('userAvatar').textContent = initials;
                }
            })
            .catch(error => console.error("Erro ao buscar usuário:", error));
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

// ========== PAINEL DO USUÁRIO CLICÁVEL (com hover e cursor) ==========
const userInfoPanel = document.getElementById('userInfoPanel');
userInfoPanel.addEventListener('click', () => {
    window.location.href = 'perfil.html';
});

// ========== DATA ATUAL COM PRIMEIRA LETRA MAIÚSCULA ==========
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateString = now.toLocaleDateString('pt-BR', options);
    dateString = dateString.replace(/^\w/, (c) => c.toUpperCase());
    document.getElementById('currentDate').textContent = dateString;
}
updateDate();

// ========== FUNÇÕES PARA MESES ==========
const meses = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
};

function formatarDataAniversario(dataStr) {
    // dataStr vem como "dd/mm"
    const [dia, mes] = dataStr.split('/');
    return `${parseInt(dia)} de ${meses[mes]}`;
}

function calcularProximosAniversariantes(aniversarios) {
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();
    
    // Calcular data do próximo aniversário em dias (considerando até 2 meses = 60 dias)
    const aniversariosProximos = aniversarios.filter(item => {
        const [dia, mes] = item.aniversario.split('/').map(Number);
        
        // Criar data do aniversário neste ano
        let dataAniversario = new Date(hoje.getFullYear(), mes - 1, dia);
        
        // Se já passou este ano, considerar ano que vem
        if (dataAniversario < hoje) {
            dataAniversario = new Date(hoje.getFullYear() + 1, mes - 1, dia);
        }
        
        // Calcular diferença em dias
        const diffTime = dataAniversario - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Filtrar aniversários nos próximos 60 dias (2 meses)
        return diffDays <= 60 && diffDays >= 0;
    });
    
    // Ordenar por data mais próxima
    aniversariosProximos.sort((a, b) => {
        const [diaA, mesA] = a.aniversario.split('/').map(Number);
        const [diaB, mesB] = b.aniversario.split('/').map(Number);
        
        let dataA = new Date(hoje.getFullYear(), mesA - 1, diaA);
        let dataB = new Date(hoje.getFullYear(), mesB - 1, diaB);
        
        if (dataA < hoje) dataA = new Date(hoje.getFullYear() + 1, mesA - 1, diaA);
        if (dataB < hoje) dataB = new Date(hoje.getFullYear() + 1, mesB - 1, diaB);
        
        return dataA - dataB;
    });
    
    return aniversariosProximos;
}

// ========== CARREGAR ANIVERSARIANTES DO FIRESTORE ==========
let aniversariantesList = [];
let currentIndexCarousel = 0;
let carouselInterval = null;

async function carregarAniversariantes() {
    try {
        const snapshot = await db.collection('usuarios').get();
        const aniversarios = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.aniversario) {
                aniversarios.push({
                    nome: data.nome,
                    departamento: data.cargo || data.departamento || 'Funcionário',
                    aniversario: data.aniversario // formato "dd/mm"
                });
            }
        });
        
        aniversariantesList = calcularProximosAniversariantes(aniversarios);
        
        if (aniversariantesList.length === 0) {
            // Nenhum aniversariante nos próximos 2 meses
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
        document.getElementById('birthdayName').textContent = 'Erro ao carregar';
        document.getElementById('birthdayDept').textContent = 'Tente novamente mais tarde';
    }
}

function exibirAniversariante(index) {
    if (aniversariantesList.length === 0) return;
    
    const item = aniversariantesList[index];
    const card = document.querySelector('.birthday-card-single');
    
    // Adicionar animação fade
    card.style.animation = 'none';
    setTimeout(() => {
        card.style.animation = 'fadeIn 0.5s ease';
    }, 10);
    
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
    
    // Resetar o intervalo automático
    if (carouselInterval) {
        clearInterval(carouselInterval);
        iniciarCarrosselAutomatico();
    }
}

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

// ========== CONTROLES DO CARROSSEL ==========
document.getElementById('carouselPrev').addEventListener('click', anteriorAniversariante);
document.getElementById('carouselNext').addEventListener('click', () => {
    proximoAniversariante();
    // Resetar o intervalo automático
    if (carouselInterval) {
        clearInterval(carouselInterval);
        iniciarCarrosselAutomatico();
    }
});

// Inicializar carregamento
carregarAniversariantes();