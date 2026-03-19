const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 1. Core Data
const ELEMENT_TYPES = {
    WOOD:  { color: '#2ecc71', beats: 'EARTH' },
    FIRE:  { color: '#e74c3c', beats: 'METAL' },
    EARTH: { color: '#f1c40f', beats: 'WATER' },
    METAL: { color: '#bdc3c7', beats: 'WOOD' },
    WATER: { color: '#3498db', beats: 'FIRE' }
};

let qi = 50;
let hp = 100;
let enemies = [];
let activeTalismans = [];
let selectedElement = 'WOOD';

// 2. Element Selection
function selectElement(type) {
    selectedElement = type;
}

// 3. Game Objects
class Enemy {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 50) + 25;
        this.type = Object.keys(ELEMENT_TYPES)[Math.floor(Math.random() * 5)];
        this.speed = 1.5;
        this.radius = 15;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = ELEMENT_TYPES[this.type].color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x -= this.speed;
    }
}

// 4. Input: Clicking the canvas to place a "Talisman Trap"
canvas.addEventListener('click', (e) => {
    if (qi >= 10) {
        const rect = canvas.getBoundingClientRect();
        activeTalismans.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            type: selectedElement,
            life: 100
        });
        qi -= 10;
        document.getElementById('qi').innerText = qi;
    }
});

// 5. Main Game Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn enemies
    if (Math.random() < 0.02) enemies.push(new Enemy());

    // Update/Draw Enemies
    enemies.forEach((enemy, eIndex) => {
        enemy.update();
        enemy.draw();

        // Check for reach mountain (left side)
        if (enemy.x < 0) {
            hp -= 10;
            enemies.splice(eIndex, 1);
            document.getElementById('hp').innerText = hp;
        }

        // Check for collision with Talismans
        activeTalismans.forEach((talisman, tIndex) => {
            let dist = Math.hypot(enemy.x - talisman.x, enemy.y - talisman.y);
            if (dist < 30) {
                // THE CORE LOGIC: Does player beat enemy?
                if (ELEMENT_TYPES[talisman.type].beats === enemy.type) {
                    enemies.splice(eIndex, 1); // Enemy destroyed
                    qi += 15; // Gain Qi
                    document.getElementById('qi').innerText = qi;
                } else {
                    activeTalismans.splice(tIndex, 1); // Talisman breaks
                }
            }
        });
    });

    // Draw Talismans
    activeTalismans.forEach(t => {
        ctx.font = "20px serif";
        ctx.fillText("📜", t.x - 10, t.y + 10);
        ctx.strokeStyle = ELEMENT_TYPES[t.type].color;
        ctx.strokeRect(t.x - 15, t.y - 15, 30, 30);
    });

    if (hp > 0) requestAnimationFrame(gameLoop);
    else alert("Your Cultivation has ended. The mountain is lost.");
}

gameLoop();