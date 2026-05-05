// ========== TEMA (CLARO/ESCURO) ==========
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

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
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('usuarios').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById('userName').textContent = userData.nome;
                    document.getElementById('userRole').textContent = userData.cargo;
                    document.getElementById('welcomeText').textContent = `Bem-vindo, ${userData.nome}!`;
                    
                    const names = userData.nome.split(' ');
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
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch(error => console.error("Erro no logout:", error));
});

// ========== DATA ATUAL ==========
function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('pt-BR', options);
}
updateDate();

// ========== CARREGAR ANIVERSARIANTES (exemplo estático, mas pode vir do Firestore) ==========
// Aqui você pode substituir por uma consulta ao Firestore futuramente.
const birthdays = [
    { name: "Gil", department: "Filial", date: "07 de Novembro" },
    { name: "Nakewellyn", department: "Departamento Pessoal (GRU)", date: "19 de Dezembro" },
    { name: "Felipe", department: "Supervisão (GRU)", date: "19 de Dezembro" },
    { name: "Tatiane", department: "Comercial (GRU)", date: "27 de Dezembro" }
];

const container = document.getElementById('birthdaysContainer');
birthdays.forEach(b => {
    const card = document.createElement('div');
    card.className = 'birthday-card';
    card.innerHTML = `
        <div class="birthday-avatar">
            <i class='bx bx-user'></i>
        </div>
        <div class="birthday-info">
            <div class="birthday-name">${b.name}</div>
            <div class="birthday-department">${b.department}</div>
            <div class="birthday-date">
                <i class='bx bx-calendar'></i> ${b.date}
            </div>
        </div>
    `;
    container.appendChild(card);
});