let players = [];
let currentPlayerIdx = 0;
let targetScore = 5000;
let currentPhrase = "";
let questions = [
    {"category": "كرة قدم", "phrase": "ريال مدريد نادي القرن"},
    {"category": "أمثال شعبية", "phrase": "الوقت كالسيف إن لم تقطعه قطعك"},
    {"category": "معلومات عامة", "phrase": "المملكة العربية السعودية"}
    // أضف الـ 200 جملة التي أعطيتك إياها سابقاً هنا
];
let usedLetters = [];
let wheelValue = 0;

// إعداد الأسماء
const playerCountSelect = document.getElementById('player-count');
const nameInputsDiv = document.getElementById('name-inputs');

function updateNameInputs() {
    nameInputsDiv.innerHTML = '';
    for (let i = 1; i <= playerCountSelect.value; i++) {
        nameInputsDiv.innerHTML += `<input type="text" placeholder="اسم المتسابق ${i}" id="p-name-${i}" value="متسابق ${i}">`;
    }
}
playerCountSelect.addEventListener('change', updateNameInputs);
updateNameInputs();

document.getElementById('start-btn').onclick = () => {
    targetScore = parseInt(document.getElementById('target-score').value);
    players = [];
    for (let i = 1; i <= playerCountSelect.value; i++) {
        players.push({
            name: document.getElementById(`p-name-${i}`).value,
            score: 0
        });
    }
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('goal-display').innerText = targetScore;
    initRound();
};

function initRound() {
    const q = questions[Math.floor(Math.random() * questions.length)];
    currentPhrase = q.phrase;
    usedLetters = [];
    document.getElementById('category-name').innerText = q.category;
    renderPhrase();
    updateSidebar();
}

function renderPhrase() {
    const container = document.getElementById('phrase-display');
    container.innerHTML = '';
    currentPhrase.split('').forEach(char => {
        const div = document.createElement('div');
        div.className = char === ' ' ? 'letter-box space' : 'letter-box';
        div.textContent = char;
        container.appendChild(div);
    });
}

function updateSidebar() {
    const sidebar = document.getElementById('players-sidebar');
    sidebar.innerHTML = '';
    players.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = `player-tag ${i === currentPlayerIdx ? 'active' : ''}`;
        div.innerHTML = `<div>${p.name}</div><div style="font-size:1.5rem"><strong>${p.score}</strong></div>`;
        sidebar.appendChild(div);
    });
    document.getElementById('buy-vowel-btn').disabled = players[currentPlayerIdx].score < 250;
}

document.getElementById('spin-btn').onclick = () => {
    const values = [100, 200, 500, 1000, 2000, "إفلاس", 400, "راحت عليك"];
    wheelValue = values[Math.floor(Math.random() * values.length)];
    
    if (wheelValue === "إفلاس") {
        alert("إفلاس! رصيدك صفر.");
        players[currentPlayerIdx].score = 0;
        nextTurn();
    } else if (wheelValue === "راحت عليك") {
        alert("راحت عليك! انتقل الدور.");
        nextTurn();
    } else {
        alert(`العجلة: ${wheelValue} نقطة. اختر حرفاً صامتاً!`);
        showKeyboard(false);
    }
};

document.getElementById('buy-vowel-btn').onclick = () => {
    if (players[currentPlayerIdx].score >= 250) showKeyboard(true);
};

function showKeyboard(isVowel) {
    const box = document.getElementById('interaction-box');
    const kb = document.getElementById('keyboard');
    box.classList.remove('hidden');
    kb.innerHTML = '';
    
    const letters = isVowel ? ['أ','و','ي'] : ['ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','هـ'];
    
    letters.forEach(l => {
        const btn = document.createElement('button');
        btn.innerText = l;
        btn.className = `key ${usedLetters.includes(l) ? 'used' : ''}`;
        if (!usedLetters.includes(l)) {
            btn.onclick = () => handleChoice(l, isVowel);
        }
        kb.appendChild(btn);
    });
}

function handleChoice(letter, isVowel) {
    usedLetters.push(letter);
    document.getElementById('interaction-box').classList.add('hidden');
    
    let count = 0;
    const boxes = document.querySelectorAll('.letter-box');
    currentPhrase.split('').forEach((char, i) => {
        if (char === letter) {
            boxes[i].classList.add('revealed');
            count++;
        }
    });

    if (isVowel) {
        players[currentPlayerIdx].score -= 250;
        if (count === 0) { alert("الحرف غير موجود!"); nextTurn(); return; }
    } else {
        if (count > 0) {
            players[currentPlayerIdx].score += (wheelValue * count);
            alert(`وجدنا ${count} حرف! ربحت ${wheelValue * count} نقطة.`);
        } else {
            alert("خطأ! انتقل الدور.");
            nextTurn();
            return;
        }
    }
    updateSidebar();
    if (players[currentPlayerIdx].score >= targetScore) showWinner();
}

function nextTurn() {
    currentPlayerIdx = (currentPlayerIdx + 1) % players.length;
    updateSidebar();
}

function showWinner() {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('winner-screen').classList.add('active');
    document.getElementById('winner-text').innerText = `البطل هو ${players[currentPlayerIdx].name}`;
    document.getElementById('final-score').innerText = `${players[currentPlayerIdx].score} نقطة`;
}
