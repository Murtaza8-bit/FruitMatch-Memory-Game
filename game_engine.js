class FruitGame {
    constructor() {
        // Extended emoji list for Hard mode (needs 10 pairs)
        this.emojis = ["🍎","🍌","🍇","🍊","🍓","🍉","🍍","🥝","🍒","🍑","🥭","🍋"];
        this.boardElement = document.getElementById('board');
        this.movesElement = document.getElementById('moves');
        this.timerElement = document.getElementById('timer');
        
        // Game State
        this.currentRows = 4;
        this.currentCols = 4;
        this.hasFlippedCard = false;
        this.lockBoard = false;
        this.firstCard = null;
        this.secondCard = null;
        this.moves = 0;
        this.matches = 0;
        this.totalPairs = 0;
        this.timerInterval = null;
        
        this.loadLeaderboard();
    }

    startGame(rows, cols) {
        this.currentRows = rows;
        this.currentCols = cols;
        document.getElementById('start-screen').classList.add('hidden');
        
        // Update Grid CSS dynamically
        this.boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        this.restartLevel();
    }

    restartLevel() {
        // Reset State
        this.moves = 0;
        this.matches = 0;
        this.movesElement.innerText = "0";
        this.hasFlippedCard = false;
        this.lockBoard = false;
        this.firstCard = null;
        this.secondCard = null;
        clearInterval(this.timerInterval);
        this.timerElement.innerText = "00:00";

        this.setupBoard();
        this.startTimer();
    }

    setupBoard() {
        const totalCards = this.currentRows * this.currentCols;
        this.totalPairs = totalCards / 2;
        
        // Slice the emoji array to get exactly enough pairs for the level
        const gameEmojis = this.emojis.slice(0, this.totalPairs);
        const deck = [...gameEmojis, ...gameEmojis]; // Duplicate
        this.shuffle(deck);
        
        this.boardElement.innerHTML = ''; // Clear board
        
        deck.forEach(emoji => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.emoji = emoji;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-front">?</div>
                    <div class="card-face card-back">${emoji}</div>
                </div>
            `;

            card.addEventListener('click', () => this.flipCard(card));
            this.boardElement.appendChild(card);
        });
    }

    flipCard(card) {
        if (this.lockBoard) return;
        if (card === this.firstCard) return;

        const audio = document.getElementById('sound-flip');
        if(audio) { audio.currentTime = 0; audio.play(); }

        card.classList.add('flip');

        if (!this.hasFlippedCard) {
            this.hasFlippedCard = true;
            this.firstCard = card;
            this.firstCard = card;
            return;
        }

        this.secondCard = card;
        this.moves++;
        this.movesElement.innerText = this.moves;
        this.checkForMatch();
    }

    checkForMatch() {
        let isMatch = this.firstCard.dataset.emoji === this.secondCard.dataset.emoji;
        isMatch ? this.disableCards() : this.unflipCards();
    }

    disableCards() {
        this.matches++;
        this.firstCard.removeEventListener('click', () => {}); 
        this.secondCard.removeEventListener('click', () => {});

        setTimeout(() => {
            this.firstCard.classList.add('matched');
            this.secondCard.classList.add('matched');
            this.resetBoard();
            
            if(this.matches === this.totalPairs) {
                this.winGame();
            }
        }, 500);
    }

    unflipCards() {
        this.lockBoard = true;
        setTimeout(() => {
            this.firstCard.classList.remove('flip');
            this.secondCard.classList.remove('flip');
            this.resetBoard();
        }, 1000);
    }

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

    startTimer() {
        let seconds = 0;
        this.timerInterval = setInterval(() => {
            seconds++;
            let m = Math.floor(seconds / 60).toString().padStart(2, '0');
            let s = (seconds % 60).toString().padStart(2, '0');
            this.timerElement.innerText = `${m}:${s}`;
        }, 1000);
    }

    winGame() {
        // STOP TIMER
        clearInterval(this.timerInterval);
        const audio = document.getElementById('sound-win');
        if(audio) audio.play();

        // DETERMINE DIFFICULTY
        let diffName = "Medium";
        if(this.currentCols === 3) diffName = "Easy";
        if(this.currentRows === 5) diffName = "Hard";

        // SAVE SCORE
        this.saveScore(diffName);

        // UPDATE MODAL STATS
        document.getElementById('final-moves').innerText = this.moves;
        document.getElementById('final-time').innerText = this.timerElement.innerText;

        // SHOW MODAL
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    saveScore(difficulty) {
        const newScore = { 
            diff: difficulty, 
            moves: this.moves, 
            date: new Date().toLocaleDateString() 
        };
        
        let scores = JSON.parse(localStorage.getItem('fruitScores')) || [];
        scores.push(newScore);
        
        // Keep only last 5 games
        if (scores.length > 5) scores.shift();
        
        localStorage.setItem('fruitScores', JSON.stringify(scores));
    }

    loadLeaderboard() {
        // Using .slice().reverse() to show newest games first
        const scores = JSON.parse(localStorage.getItem('fruitScores')) || [];
        const list = document.getElementById('leaderboard-list');
        
        if(scores.length === 0) {
            list.innerHTML = "<li>No games played yet</li>";
        } else {
            list.innerHTML = scores.slice().reverse().map(score => 
                `<li><b>${score.diff}</b>: ${score.moves} Moves <span style="font-size:0.8rem; color:#888">(${score.date})</span></li>`
            ).join('');
        }
    }
}

const game = new FruitGame();
