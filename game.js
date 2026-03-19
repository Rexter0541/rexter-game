const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants & Stats
let hp = 100, qi = 100, score = 0, frame = 0;
let gameState = 'GACHA'; 
let keys = {};
let enemies = [], projectiles = [];

const ELEMENTS = {
    WOOD:  { color: '#2ecc71', beats: 'EARTH', icon: '🌿' },
    FIRE:  { color: '#e74c3c', beats: 'METAL', icon: '🔥' },
    EARTH: { color: '#f1c40f', beats: 'WATER', icon: '🪨' },
    METAL: { color: '#bdc3c7', beats: 'WOOD',  icon: '⚔️' },
    WATER: { color: '#3498db', beats: 'FIRE',  icon: '💧' }
};

const HERO_TYPES = [
    { name: "Willow Spirit", type: "WOOD" },
    { name: "Inferno Monk", type: "FIRE" },
    { name: "Jade Guardian", type: "EARTH" },
    { name: "Silver Blade", type: "METAL" },
    { name: "Azure Sage", type: "WATER" }
];

let player = {
    x: 100, y: 250, 
    type: 'WOOD', 
    speed: 4, 
    size: 25,
    name: ""
};

// --- Gacha Logic ---
function pullGacha() {
    if (qi >= 20) {
        qi -= 20;
        const hero = HERO_TYPES[Math.floor(Math.random() * HERO_TYPES.length)];
        player.type = hero.type;
        player.name = hero.name;
        document.getElementById('summon-result').innerHTML = 
            `<span style="color:${ELEMENTS[hero.type].color}">${hero.name} [${hero.type}]</span>`;
        document.getElementById('start-btn').style.display = 'inline-block';
        updateUI();
    } else {
        alert("Not enough Qi!");
    }
}

function startGame() {
    gameState = 'BATTLE';
    document.getElementById('gacha-overlay').style.display = 'none';
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('hp-txt').innerText = hp;
    document.getElementById('qi-txt').innerText = qi;
    document.getElementById('score-txt').innerText = score;
}

// --- Inputs ---
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// --- Game Functions ---
function spawnEnemy() {
    if (frame % 60 === 0) {
        enemies.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 40) + 20,
            type: Object.keys(ELEMENTS)[Math.floor(Math.random() * 5)],
            hp: 1,
            speed: 1.5 + (score / 20)
        });
    }
}

function gameLoop() {
    if (gameState !== 'BATTLE' || hp <= 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    // 1. Player Movement
    if (keys['w'] && player.y > 20) player.y -= player.speed;
    if (keys['s'] && player.y < canvas.height - 20) player.y += player.speed;
    if (keys['a'] && player.x > 20) player.x -= player.speed;
    if (keys['d'] && player.x < canvas.width - 20) player.x += player.speed;

    // Draw Player
    ctx.font = "30px Arial";
    ctx.shadowBlur = 10;
    ctx.shadowColor = ELEMENTS[player.type].color;
    ctx.fillText("🧙‍♂️", player.x - 15, player.y + 10);
    ctx.shadowBlur = 0;

    // 2. Auto-Attack Logic
    if (frame % 25 === 0 && enemies.length > 0) {
        // Find nearest enemy
        let nearest = enemies.reduce((prev, curr) => {
            let d1 = Math.hypot(player.x - prev.x, player.y - prev.y);
            let d2 = Math.hypot(player.x - curr.x, player.y - curr.y);
            return d1 < d2 ? prev : curr;
        });

        projectiles.push({
            x: player.x, y: player.y,
            tx: nearest.x, ty: nearest.y,
            type: player.type,
            speed: 6
        });
    }

    // 3. Update Projectiles
    projectiles.forEach((p, pi) => {
        let angle = Math.atan2(p.ty - p.y, p.tx - p.x);
        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;

        ctx.fillStyle = ELEMENTS[p.type].color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fill();

        if (p.x > canvas.width || p.x < 0) projectiles.splice(pi, 1);
    });

    // 4. Update Enemies
    spawnEnemy();
    enemies.forEach((en, ei) => {
        en.x -= en.speed;
        
        // Draw Enemy
        ctx.fillStyle = ELEMENTS[en.type].color;
        ctx.beginPath();
        ctx.arc(en.x, en.y, 12, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();

        // Collision with Projectile
        projectiles.forEach((proj, pi) => {
            if (Math.hypot(proj.x - en.x, proj.y - en.y) < 20) {
                // Elemental Check
                if (ELEMENTS[proj.type].beats === en.type) {
                    enemies.splice(ei, 1);
                    score++;
                    qi += 2;
                    updateUI();
                }
                projectiles.splice(pi, 1);
            }
        });

        // Breach Mountain
        if (en.x < 0) {
            hp -= 10;
            enemies.splice(ei, 1);
            updateUI();
        }
    });

    if (hp > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        alert("Game Over! Final Score: " + score);
        location.reload();
    }
}