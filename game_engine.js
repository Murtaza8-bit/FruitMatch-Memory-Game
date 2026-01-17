class SoundManager{
    constructor(){
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration){
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);}

    flip(){ this.playTone(400, 'sine', 0.1); }
    match(){ 
        this.playTone(600, 'sine', 0.1); 
        setTimeout(() => this.playTone(800, 'sine', 0.2), 100);
    }
    win(){
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'triangle', 0.3), i*150));
}
}

class ConfettiSystem{
    constructor(){
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    resize(){this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight;}
    
    fire(){
        for(let i=0; i<100; i++){
            this.particles.push({
                x: this.canvas.width/2, y: this.canvas.height/2,
                vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10 - 5,
                color: `hsl(${Math.random()*360}, 100%, 50%)`, size: Math.random()*8 + 2
            });
    }
        this.animate();
    }

    animate(){
        if(this.particles.length === 0) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.2; // Gravity
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            if(p.y > this.canvas.height) this.particles.splice(i, 1);
        });
        requestAnimationFrame(() => this.animate());}}

class FruitGame{
    constructor(){
        this.emojis = ["🍎","🍌","🍇","🍊","🍓","🍉","🍍","🥝","🍒","🍑","🥭","🍋"];
        this.sound = new SoundManager();
        this.confetti = new ConfettiSystem();
        
        this.boardElement = document.getElementById('board');
        this.timerElement = document.getElementById('timer');
        this.movesElement = document.getElementById('moves');
        
        this.currentRows = 4;
        this.currentCols = 4;
        this.cards = [];
        this.hasFlippedCard = false;
        this.lockBoard = false;
        this.firstCard = null;
        this.secondCard = null;
        this.moves = 0;
        this.matchesFound = 0;
        this.totalPairs = 0;
        this.timerInterval = null;
        this.seconds = 0;

        this.loadLeaderboard();
        
        document.body.addEventListener('click', () => {
            if(this.sound.ctx.state === 'suspended') this.sound.ctx.resume();
        }, {once:true});}
    startGame(rows, cols){
        this.currentRows = rows; this.currentCols = cols;
        document.getElementById('start-screen').classList.add('hidden');
        this.resetState();
        
        const totalCards = rows * cols;
        this.totalPairs = totalCards / 2;
        this.boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        const gameEmojis = this.emojis.slice(0, this.totalPairs);
        const deck = [...gameEmojis, ...gameEmojis];
        this.shuffle(deck);

        this.boardElement.innerHTML = '';
        deck.forEach(emoji => {
            const card = this.createCard(emoji);
            this.boardElement.appendChild(card);
        });
        this.startTimer();
        console.log("Game Started: Grid " + rows + "x" + cols);
    }

    restartLevel(){ this.startGame(this.currentRows, this.currentCols); }

    createCard(emoji){
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.innerHTML = `
            <div class="card-face card-front">${emoji}</div>
            <div class="card-face card-back"><span class="material-icons-round">eco</span></div>
        `;
        card.addEventListener('click', () => this.flipCard(card));
        return card;
    }

    flipCard(card){
        if (this.lockBoard) return;
        if (card === this.firstCard) return;

        this.sound.flip();
        card.classList.add('flip');

        if (!this.hasFlippedCard){
            this.hasFlippedCard = true;
            this.firstCard = card;
            return;}
        this.secondCard = card;
        this.moves++;
        this.movesElement.innerText = this.moves;
        this.checkForMatch();}
    
checkForMatch(){
        let isMatch = this.firstCard.dataset.emoji === this.secondCard.dataset.emoji;
        isMatch ? this.processMatch() : this.unflipCards();}

processMatch(){
        this.matchesFound++;
        this.sound.match();

        this.firstCard.removeEventListener('click', () => {}); 
        this.secondCard.removeEventListener('click', () => {});

        setTimeout(() => {
            this.firstCard.classList.add('matched');
            this.secondCard.classList.add('matched');
            this.resetBoard();
            if (this.matchesFound === this.totalPairs) this.endGame();
        }, 400);
    }

    unflipCards() {
        this.lockBoard = true;
        setTimeout(() => {
            this.firstCard.classList.remove('flip');
            this.secondCard.classList.remove('flip');
            this.resetBoard();
        }, 1000);}

    resetBoard() {
        [this.hasFlippedCard, this.lockBoard] = [false, false];
        [this.firstCard, this.secondCard] = [null, null];
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
    }
    }

    startTimer(){
        clearInterval(this.timerInterval);
        this.seconds = 0;
        this.timerElement.innerText = "00:00";
        this.timerInterval = setInterval(() => {
            this.seconds++;
            const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
            const s = (this.seconds % 60).toString().padStart(2, '0');
            this.timerElement.innerText = `${m}:${s}`;
        }, 1000);}
    resetState(){
        this.moves = 0; this.matchesFound = 0;
        this.movesElement.innerText = '0';
        this.hasFlippedCard = false; this.lockBoard = false;
        this.firstCard = null; this.secondCard = null;
        clearInterval(this.timerInterval);
}

    endGame(){
        clearInterval(this.timerInterval);
        this.saveScore(this.moves);
        this.sound.win();
        this.confetti.fire(); 
        
        document.getElementById('final-stats-text').innerHTML = 
            `Finished in <b>${this.moves} moves</b><br>Time: ${this.timerElement.innerText}`;
        document.getElementById('game-over-screen').classList.remove('hidden');
}
    saveScore(newScore){
        let scores = JSON.parse(localStorage.getItem('fruitMatchScores')) || [];
        scores.push(newScore);
        scores.sort((a, b) => a - b);
        scores = scores.slice(0, 5);
        localStorage.setItem('fruitMatchScores', JSON.stringify(scores));
}

    loadLeaderboard(){
        const scores = JSON.parse(localStorage.getItem('fruitMatchScores')) || [];
        const list = document.getElementById('leaderboard-list');
        if (scores.length > 0){
            list.innerHTML = scores.map((score, index) => 
                `<li><span>#${index + 1} Best</span> <span>${score} Moves</span></li>`
            ).join('');
        } 
        else{
            list.innerHTML = `<li>No harvest yet...</li>`;
        }}}
const game = new FruitGame();