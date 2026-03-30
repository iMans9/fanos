let questions = [];
let currentPhrase = "";
let currentPlayer = 0;
let scores = [0, 0, 0];

// 1. جلب الأسئلة عند تحميل الصفحة
async function loadQuestions() {
    const response = await fetch('questions.json');
    questions = await response.json();
    startGame();
}

function startGame() {
    // اختيار سؤال عشوائي من الـ 1000 سؤال
    const randomIdx = Math.floor(Math.random() * questions.length);
    const q = questions[randomIdx];
    
    document.getElementById('category-name').innerText = q.category;
    renderPhrase(q.phrase);
}

function renderPhrase(phrase) {
    const container = document.getElementById('phrase-display');
    container.innerHTML = '';
    
    phrase.split('').forEach(char => {
        const box = document.createElement('div');
        box.className = char === ' ' ? 'letter-box space' : 'letter-box';
        box.textContent = char;
        container.appendChild(box);
    });
}

// 2. منطق دوران العجلة (بشكل مبسط)
document.getElementById('spin-btn').addEventListener('click', () => {
    const values = [150, 500, "إفلاس", 1000, "راحت عليك", 2000];
    const result = values[Math.floor(Math.random() * values.length)];
    
    alert("وقفت العجلة على: " + result);
    handleWheelResult(result);
});

function handleWheelResult(result) {
    if (result === "إفلاس") {
        scores[currentPlayer] = 0;
        nextTurn();
    } else if (result === "راحت عليك") {
        nextTurn();
    } else {
        // اطلب من اللاعب إدخال حرف
    }
}
