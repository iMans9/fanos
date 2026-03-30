// Game State
let gameState = {
    questions: [],
    currentPhrase: "",
    revealedPhrase: [], // Array indicating which letters are visible
    players: [],
    currentPlayerIndex: 0,
    currentRound: 1, // 1: Base, 2: Catch, 3: Base, 4: Catch
    totalRounds: 4,
    currentWheelValue: 0,
    isVowelMode: false,
    usedLetters: [],
    catchRoundInterval: null,
    catchRoundLetterIndices: []
};

// Configuration
const CATCH_ROUND_POINTS = 100;
const VOWEL_COST = 250;
const vowels = ['أ', 'ا', 'و', 'ي'];
const alphabet = ['أ', 'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];

// UI Elements
const ui = {
    screens: document.querySelectorAll('.screen'),
    lobbyNameInputs: [document.getElementById('p1-name'), document.getElementById('p2-name'), document.getElementById('p3-name')],
    playerCards: [document.getElementById('player-0'), document.getElementById('player-1'), document.getElementById('player-2')],
    phraseDisplay: document.getElementById('phrase-display'),
    categoryName: document.getElementById('category-name'),
    roundNumber: document.getElementById('round-number'),
    gameMessage: document.getElementById('game-message'),
    wheelArea: document.getElementById('wheel-area'),
    catchArea: document.getElementById('catch-area'),
    spinBtn: document.getElementById('spin-btn'),
    buyVowelBtn: document.getElementById('buy-vowel-btn'),
    solveBtn: document.getElementById('solve-btn'),
    interactionBox: document.getElementById('interaction-box'),
    interactionPrompt: document.getElementById('interaction-prompt'),
    keyboard: document.getElementById('keyboard'),
    solveInput: document.getElementById('solve-input'),
    submitSolve: document.getElementById('submit-solve'),
    canvas: document.getElementById('wheelCanvas')
};

// 1. Initialization & Loading
window.onload = async () => {
    try {
        const response = await fetch('questions.json');
        gameState.questions = await response.json();
        console.log(`${gameState.questions.length} questions loaded.`);
    } catch (error) {
        alert("فشل تحميل الأسئلة. تأكد من تشغيل السيرفر المحلي.");
    }
    initWheelDrawing();
};

document.getElementById('start-game-btn').addEventListener('click', setupPlayers);

function setupPlayers() {
    ui.lobbyNameInputs.forEach((input, index) => {
        gameState.players.push({
            name: input.value || `لاعب ${index + 1}`,
            totalScore: 0,
            currentRoundScore: 0
        });
        ui.playerCards[index].querySelector('.name').innerText = gameState.players[index].name;
    });

    switchScreen('game-screen');
    startRound();
}

// 2. Round Management Logic
function startRound() {
    gameState.usedLetters = [];
    resetBoard();
    
    // Pick random question
    const randomIdx = Math.floor(Math.random() * gameState.questions.length);
    const question = gameState.questions[randomIdx];
    gameState.currentPhrase = question.phrase;
    gameState.revealedPhrase = Array(question.phrase.length).fill(false);
    
    // Update UI
    ui.categoryName.innerText = question.category;
    ui.roundNumber.innerText = gameState.currentRound;
    renderPhrasePlaceholder();
    resetPlayerRoundScores();

    if (gameState.currentRound % 2 !== 0) {
        // Basic Round
        setupBasicRound();
    } else {
        // Catch Round
        setupCatchRound();
    }
}

function nextTurn() {
    // Basic Round logic
    disableInteraction();
    ui.playerCards[gameState.currentPlayerIndex].classList.remove('active');
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 3;
    ui.playerCards[gameState.currentPlayerIndex].classList.add('active');
    
    ui.gameMessage.innerText = `دور ${gameState.players[gameState.currentPlayerIndex].name}`;
    ui.spinBtn.disabled = false;
    ui.buyVowelBtn.disabled = gameState.players[gameState.currentPlayerIndex].currentRoundScore < VOWEL_COST;
}

function endRound(winnerIndex = null, isCatchWinner = false) {
    clearInterval(gameState.catchRoundInterval); // stop catch round if running

    if (winnerIndex !== null) {
        if (isCatchWinner) {
            alert(`${gameState.players[winnerIndex].name} حل الجملة وحصل على ${CATCH_ROUND_POINTS} نقطة!`);
        } else {
            alert(`${gameState.players[winnerIndex].name} حل الجملة بنجاح!`);
        }
    }

    // Add round scores to total scores
    gameState.players.forEach(p => p.totalScore += p.currentRoundScore);
    updateTotalScoresUI();

    gameState.currentRound++;
    if (gameState.currentRound > gameState.totalRounds) {
        showGameOver();
    } else {
        startRound();
    }
}

// 3. Core Logic: Phrase Rendering & Logic
function renderPhrasePlaceholder() {
    ui.phraseDisplay.innerHTML = '';
    for (let i = 0; i < gameState.currentPhrase.length; i++) {
        const char = gameState.currentPhrase[i];
        const box = document.createElement('div');
        box.className = char === ' ' ? 'letter-box space' : 'letter-box';
        box.textContent = char;
        ui.phraseDisplay.appendChild(box);
    }
}

function updateDisplayedPhrase() {
    const boxes = ui.phraseDisplay.querySelectorAll('.letter-box');
    boxes.forEach((box, index) => {
        if (gameState.revealedPhrase[index]) {
            box.classList.add('revealed');
        }
    });
}

function checkLetter(letter) {
    letter = letter.toUpperCase();
    if (gameState.usedLetters.includes(letter)) return { count: 0, isUsed: true };
    
    gameState.usedLetters.push(letter);
    let count = 0;
    
    // Compare handles different Arabic forms roughly (not perfect, but works for basic game)
    for (let i = 0; i < gameState.currentPhrase.length; i++) {
        if (gameState.currentPhrase[i].toUpperCase() === letter) {
            gameState.revealedPhrase[i] = true;
            count++;
        }
    }
    
    return { count, isUsed: false };
}

function isPhraseComplete() {
    for (let i = 0; i < gameState.currentPhrase.length; i++) {
        if (gameState.currentPhrase[i] !== ' ' && !gameState.revealedPhrase[i]) {
            return false;
        }
    }
    return true;
}

// 4. Basic Round Logic (Wheel based)
function setupBasicRound() {
    ui.wheelArea.classList.remove('hidden-area');
    ui.catchArea.classList.add('hidden-area');
    ui.playerCards[gameState.currentPlayerIndex].classList.add('active');
    nextTurn(); // actually sets p1 as first
}

// Wheel logic (Basic implementation)
ui.spinBtn.addEventListener('click', spinWheel);

const wheelValues = [150, 300, 500, "إفلاس", 700, 1000, 2000, "راحت عليك", 400, "إفلاس"];
let isSpinning = false;
let currentRotation = 0;

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    ui.spinBtn.disabled = true;
    disableInteraction();

    const spins = 5; // number of full rotations
    const degrees = 1440 + Math.random() * 360;
    currentRotation += degrees;
    
    ui.canvas.style.transition = 'transform 4s ease-out';
    ui.canvas.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        const actualDeg = currentRotation % 360;
        const segmentDeg = 360 / wheelValues.length;
        // Pointer is at top (-90deg), so adjust calculation
        const winningSegmentIndex = Math.floor((360 - actualDeg + 90) % 360 / segmentDeg);
        gameState.currentWheelValue = wheelValues[winningSegmentIndex];
        
        handleWheelResult();
    }, 4000);
}

function handleWheelResult() {
    ui.gameMessage.innerText = `وقفت العجلة على: ${gameState.currentWheelValue}`;
    
    if (gameState.currentWheelValue === "إفلاس") {
        gameState.players[gameState.currentPlayerIndex].currentRoundScore = 0;
        updatePlayerScoresUI();
        alert("إفلاس! خسرت نقاط الجولة.")
        nextTurn();
    } else if (gameState.currentWheelValue === "راحت عليك") {
        alert("راحت عليك الدور!")
        nextTurn();
    } else {
        // Request Consonant
        promptForLetter(false);
    }
}

// Interacting with keyboard
function createKeyboard(isVowelsOnly = false) {
    ui.keyboard.innerHTML = '';
    const keysToDraw = isVowelsOnly ? vowels : alphabet.filter(l => !vowels.includes(l));
    
    keysToDraw.forEach(letter => {
        const key = document.createElement('div');
        key.className = 'key';
        if (isVowelsOnly) key.classList.add('vowel');
        key.textContent = letter;
        
        if (gameState.usedLetters.includes(letter)) {
            key.classList.add('used');
        } else {
            key.addEventListener('click', () => handleKeyClick(letter));
        }
        
        ui.keyboard.appendChild(key);
    });
}

function promptForLetter(isVowel) {
    gameState.isVowelMode = isVowel;
    ui.interactionBox.classList.remove('hidden');
    ui.interactionPrompt.innerText = isVowel ? "اختر حرف علة (خصم 250):" : `اختر حرفاً صامتاً (قيمة: ${gameState.currentWheelValue}):`;
    ui.solveInput.classList.add('hidden');
    ui.submitSolve.classList.add('hidden');
    ui.keyboard.classList.remove('hidden');
    createKeyboard(isVowel);
}

function handleKeyClick(letter) {
    const result = checkLetter(letter);
    disableInteraction();

    if (result.count > 0) {
        updateDisplayedPhrase();
        
        if (gameState.isVowelMode) {
            gameState.players[gameState.currentPlayerIndex].currentRoundScore -= VOWEL_COST;
        } else {
            const points = gameState.currentWheelValue * result.count;
            gameState.players[gameState.currentPlayerIndex].currentRoundScore += points;
            alert(`نعم! يوجد ${result.count} حرف ${letter}. ربحت ${points} نقطة. يمكنك اللف مرة أخرى.`);
        }
        updatePlayerScoresUI();

        if (isPhraseComplete()) {
            endRound(gameState.currentPlayerIndex);
        } else {
            // Player keeps turn
            ui.spinBtn.disabled = false;
            ui.buyVowelBtn.disabled = gameState.players[gameState.currentPlayerIndex].currentRoundScore < VOWEL_COST;
            ui.gameMessage.innerText = `دور ${gameState.players[gameState.currentPlayerIndex].name} مجدداً.`;
        }
    } else {
        if (gameState.isVowelMode) {
            gameState.players[gameState.currentPlayerIndex].currentRoundScore -= VOWEL_COST;
            updatePlayerScoresUI();
        }
        alert(`لأسف، لا يوجد حرف ${letter}.`);
        nextTurn();
    }
}

// Buying Vowels
ui.buyVowelBtn.addEventListener('click', () => {
    if (gameState.players[gameState.currentPlayerIndex].currentRoundScore >= VOWEL_COST) {
        ui.spinBtn.disabled = true;
        ui.buyVowelBtn.disabled = true;
        promptForLetter(true);
    }
});

// Solving Puzzle (In basic round)
ui.solveBtn.addEventListener('click', () => {
    ui.interactionBox.classList.remove('hidden');
    ui.interactionPrompt.innerText = "اكتب الجملة كاملة (تأكد من الإملاء الصحيح):";
    ui.keyboard.classList.add('hidden');
    ui.solveInput.classList.remove('hidden');
    ui.submitSolve.classList.remove('hidden');
    ui.solveInput.value = '';
    ui.solveInput.focus();
    ui.spinBtn.disabled = true;
});

ui.submitSolve.addEventListener('click', handleSolveAttempt);

function handleSolveAttempt() {
    const attempt = ui.solveInput.value.trim();
    if (attempt === gameState.currentPhrase) {
        // Revealed everything
        gameState.revealedPhrase = Array(gameState.currentPhrase.length).fill(true);
        updateDisplayedPhrase();
        endRound(gameState.currentPlayerIndex);
    } else {
        alert("حل خاطئ! راحت عليك الدور.");
        nextTurn();
    }
}

// 5. Catch Round Logic
function setupCatchRound() {
    ui.wheelArea.classList.add('hidden-area');
    ui.catchArea.classList.remove('hidden-area');
    disableMainControls(); // Solve and buy vowel disabled
    
    // Determine the sequence of indices to reveal randomly
    gameState.catchRoundLetterIndices = [];
    for(let i=0; i<gameState.currentPhrase.length; i++){
        if(gameState.currentPhrase[i] !== ' ') gameState.catchRoundLetterIndices.push(i);
    }
    // Shuffle indices
    gameState.catchRoundLetterIndices.sort(() => Math.random() - 0.5);

    alert("انتبهوا! جولة صيد الجملة ستبدأ الآن. حروف عشوائية ستظهر كل ثانيتين.");
    
    startCatchReveal();
}

function startCatchReveal() {
    clearInterval(gameState.catchRoundInterval);
    
    gameState.catchRoundInterval = setInterval(() => {
        if (gameState.catchRoundLetterIndices.length > 0) {
            const indexToReveal = gameState.catchRoundLetterIndices.pop();
            gameState.revealedPhrase[indexToReveal] = true;
            updateDisplayedPhrase();
            
            // Auto check if complete (unlikely in catch without pressing button, but safety)
            if (isPhraseComplete()) {
                clearInterval(gameState.catchRoundInterval);
                alert("جولة الصيد انتهت بدون فائز واضح.");
                endRound();
            }
        } else {
            clearInterval(gameState.catchRoundInterval);
        }
    }, 2000); // 2 seconds
}

// Catch buttons logic
document.getElementById('catch-p1').addEventListener('click', () => attemptCatch(0));
document.getElementById('catch-p2').addEventListener('click', () => attemptCatch(1));
document.getElementById('catch-p3').addEventListener('click', () => attemptCatch(2));

function attemptCatch(playerIdx) {
    if (gameState.currentRound % 2 !== 0) return; // not in catch round

    clearInterval(gameState.catchRoundInterval); // pause reveal
    const playersAnswer = prompt(`${gameState.players[playerIdx].name}، ماذا تعتقد أن الجملة هي؟`);
    
    if (playersAnswer && playersAnswer.trim() === gameState.currentPhrase) {
        gameState.players[playerIdx].currentRoundScore = CATCH_ROUND_POINTS;
        updatePlayerScoresUI();
        // Reveal all
        gameState.revealedPhrase = Array(gameState.currentPhrase.length).fill(true);
        updateDisplayedPhrase();
        endRound(playerIdx, true);
    } else {
        if (playersAnswer) alert("خطأ! تفقد فرصتك في الصيد لهذه الجولة.");
        // Disable that player's catch button
        document.getElementById(`catch-p${playerIdx+1}`).disabled = true;
        // Resume reveal
        startCatchReveal();
    }
}

// 6. UI Helper Functions
function switchScreen(screenId) {
    ui.screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function updatePlayerScoresUI() {
    gameState.players.forEach((p, i) => {
        ui.playerCards[i].querySelector('.current-round-score span').innerText = p.currentRoundScore;
    });
}

function updateTotalScoresUI() {
    gameState.players.forEach((p, i) => {
        ui.playerCards[i].querySelector('.total-score').innerText = `الإجمالي: ${p.totalScore}`;
    });
}

function resetPlayerRoundScores() {
    gameState.players.forEach(p => p.currentRoundScore = 0);
    updatePlayerScoresUI();
}

function resetBoard() {
    disableInteraction();
    ui.spinBtn.disabled = true;
    ui.solveBtn.disabled = false;
    ui.buyVowelBtn.disabled = true;
    
    // Enable catch buttons for potential catch rounds
    document.querySelectorAll('.catch-btn').forEach(btn => btn.disabled = false);
}

function disableInteraction() {
    ui.interactionBox.classList.add('hidden');
    ui.keyboard.innerHTML = '';
}

function disableMainControls() {
    ui.spinBtn.disabled = true;
    ui.solveBtn.disabled = true;
    ui.buyVowelBtn.disabled = true;
}

function showGameOver() {
    switchScreen('game-over-screen');
    // Find winner
    let winner = gameState.players[0];
    gameState.players.forEach(p => {
        if (p.totalScore > winner.totalScore) winner = p;
    });
    
    document.getElementById('winner-name').innerText = winner.name;
    document.getElementById('winner-score').innerText = `النتيجة الإجمالية: ${winner.totalScore}`;
}

// 7. Drawing the Wheel (Canvas)
function initWheelDrawing() {
    const ctx = ui.canvas.getContext('2d');
    const colors = ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b", "#858796", "#5a5c69", "#f4f6f9", "#ff9900", "#000"];
    const numSegments = wheelValues.length;
    const radius = 200;
    const segmentDeg = 360 / numSegments;

    ctx.clearRect(0, 0, 400, 400);
    
    for (let i = 0; i < numSegments; i++) {
        const startDeg = i * segmentDeg;
        const endDeg = startDeg + segmentDeg;
        const startRad = startDeg * (Math.PI / 180);
        const endRad = endDeg * (Math.PI / 180);

        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, startRad, endRad);
        ctx.fillStyle = colors[i % colors.length];
        
        // Special color for special values
        if (wheelValues[i] === "إفلاس") ctx.fillStyle = "#000";
        if (wheelValues[i] === "راحت عليك") ctx.fillStyle = "#5a5c69";
        if (wheelValues[i] >= 1000) ctx.fillStyle = "#ffd700";

        ctx.fill();
        ctx.stroke();

        // Add text
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(startRad + (segmentDeg / 2) * (Math.PI / 180));
        ctx.textAlign = "right";
        ctx.fillStyle = (ctx.fillStyle === "#ffd700" || ctx.fillStyle === "#f4f6f9") ? "#000" : "#fff";
        ctx.font = "bold 20px Cairo";
        ctx.fillText(wheelValues[i], radius - 10, 5);
        ctx.restore();
    }
}