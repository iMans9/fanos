let questions = [];
let currentPhrase = "";
let currentPlayer = 0;
let scores = [0, 0, 0];
let usedLetters = [];
let wheelValue = 0;
let isVowelMode = false;

const vowels = ['أ', 'ا', 'و', 'ي'];
const alphabet = ['ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','هـ'];

// تحميل الأسئلة
window.onload = async () => {
    const res = await fetch('questions.json');
    questions = await res.json();
    initGame();
};

function initGame() {
    const q = questions[Math.floor(Math.random() * questions.length)];
    currentPhrase = q.phrase;
    document.getElementById('category-name').innerText = q.category;
    renderPhrase();
    updateUI();
}

function renderPhrase() {
    const display = document.getElementById('phrase-display');
    display.innerHTML = '';
    currentPhrase.split('').forEach(char => {
        const div = document.createElement('div');
        div.className = char === ' ' ? 'letter-box space' : 'letter-box';
        div.textContent = char;
        display.appendChild(div);
    });
}

// دوران العجلة
document.getElementById('spin-btn').onclick = () => {
    const values = [100, 200, 500, 1000, "إفلاس", 250];
    wheelValue = values[Math.floor(Math.random() * values.length)];
    
    if (wheelValue === "إفلاس") {
        alert("إفلاس! خسرت نقاط الجولة.");
        scores[currentPlayer] = 0;
        nextTurn();
    } else {
        document.getElementById('status-msg').innerText = `وقفت العجلة على: ${wheelValue}. اختر حرفاً!`;
        showKeyboard(false);
    }
};

// شراء حرف مساعدة (أ، و، ي)
document.getElementById('buy-vowel-btn').onclick = () => {
    if (scores[currentPlayer] >= 250) {
        isVowelMode = true;
        showKeyboard(true);
    }
};

function showKeyboard(vowelsOnly) {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = '';
    document.getElementById('interaction-area').classList.remove('hidden');
    
    const list = vowelsOnly ? vowels : alphabet;
    list.forEach(let => {
        const btn = document.createElement('div');
        btn.className = usedLetters.includes(let) ? 'key used' : 'key';
        btn.innerText = let;
        if (!usedLetters.includes(let)) {
            btn.onclick = () => handleLetter(let);
        }
        kb.appendChild(btn);
    });
}

function handleLetter(letter) {
    usedLetters.push(letter);
    let count = 0;
    const boxes = document.querySelectorAll('.letter-box');

    currentPhrase.split('').forEach((char, i) => {
        if (char === letter) {
            boxes[i].classList.add('revealed');
            count++;
        }
    });

    if (isVowelMode) {
        scores[currentPlayer] -= 250; // خصم المساعدة دائماً
        isVowelMode = false;
        if (count > 0) alert(`صحيح! وجدنا ${count} حرف مساعد.`);
        else { alert("للأسف الحرف غير موجود."); nextTurn(); return; }
    } else {
        if (count > 0) {
            const win = wheelValue * count;
            scores[currentPlayer] += win;
            alert(`رائع! حرف (${letter}) تكرر ${count} مرات. ربحت ${win} نقطة.`);
        } else {
            alert("خطأ! الحرف غير موجود.");
            nextTurn();
            return;
        }
    }
    updateUI();
    document.getElementById('interaction-area').classList.add('hidden');
}

function nextTurn() {
    currentPlayer = (currentPlayer + 1) % 3;
    usedLetters = []; // أو اتركها إذا أردت الحروف مستخدمة طوال الجولة
    updateUI();
    document.getElementById('interaction-area').classList.add('hidden');
    alert(`انتقل الدور إلى ${document.getElementById('p'+currentPlayer).querySelector('.p-name').innerText}`);
}

function updateUI() {
    for (let i = 0; i < 3; i++) {
        document.getElementById(`p${i}`).classList.toggle('active', i === currentPlayer);
        document.getElementById(`p${i}`).querySelector('.p-score').innerText = scores[i];
    }
    // تفعيل زر شراء الحروف فقط إذا كان الرصيد يسمح
    document.getElementById('buy-vowel-btn').disabled = scores[currentPlayer] < 250;
}
