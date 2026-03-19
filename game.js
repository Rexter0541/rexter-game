const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State ---
let hp = 100;
let qi = 100;
let score = 0;
let selectedElement = 'WOOD';
let enemies = [];
let talismans = [];
let userAddress = null;

const ELEMENTS = {
    WOOD:  { color: '#40916c', beats: 'EARTH', icon: '🌿' },
    FIRE:  { color: '#ff4d4d', beats: 'METAL', icon: '🔥' },
    EARTH: { color: '#b07d62', beats: 'WATER', icon: '🪨' },
    METAL: { color: '#d3d3d3', beats: 'WOOD',  icon: '⚔️' },
    WATER: { color: '#00b4d8', beats: 'FIRE',  icon: '💧' }
};

// --- Web3 Logic ---
const connectBtn = document.getElementById('connectBtn');
const saveBtn = document.getElementById('saveBtn');

async function connectWallet() {
    if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        userAddress = await signer.getAddress();
        connectBtn.innerText = `Connected: ${userAddress.substring(0,6)}...`;
        saveBtn.style.display = 'inline-block';
    } else {
        alert("Please install MetaMask!");
    }
}
connectBtn.onclick = connectWallet;

// --- Gameplay Logic ---
function setElement(type) {
    selectedElement = type;
}

canvas.addEventListener('mousedown', (e) => {
    if (qi >= 20) {
        const rect = canvas.getBoundingClientRect();
        talismans.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            type: selectedElement,
            timer: 200 // Talisman lasts for 200 frames
        });
        qi -= 20;
        updateUI();
    }
});

class Enemy {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 60) + 30;
        this.type = Object.keys(ELEMENTS)[Math.floor(Math.random() * 5)];
        this.speed = 1 + (score / 100);
        this.radius = 15;
    }
    update() { this.x -= this.speed; }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = ELEMENTS[this.type].color;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
    }
}

function updateUI() {
    document.getElementById('hp-val').innerText = hp;
    document.getElementById('qi-val').innerText = qi;
    document.getElementById('wave-val').innerText = Math.floor(score/10) + 1;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn Logic
    if (Math.random() < 0.02) enemies.push(new Enemy());

    // Update Talismans
    talismans.forEach((t, i) => {
        ctx.font = "24px serif";
        ctx.fillText(ELEMENTS[t.type].icon, t.x - 12, t.y + 10);
        t.timer--;
        if (t.timer <= 0) talismans.splice(i, 1);
    });

    // Update Enemies
    enemies.forEach((enemy, ei) => {
        enemy.update();
        enemy.draw();

        // Check Mountain Breach
        if (enemy.x < 0) {
            hp -= 10;
            enemies.splice(ei, 1);
            updateUI();
        }

        // Check Talisman Collision
        talismans.forEach((tali, ti) => {
            let dist = Math.hypot(enemy.x - tali.x, enemy.y - tali.y);
            if (dist < 30) {
                if (ELEMENTS[tali.type].beats === enemy.type) {
                    enemies.splice(ei, 1);
                    score++;
                    qi += 10;
                    updateUI();
                } else {
                    // Wrong element: Talisman breaks instantly
                    talismans.splice(ti, 1);
                }
            }
        });
    });

    if (hp > 0) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "gold";
        ctx.font = "40px Palatino";
        ctx.fillText("Cultivation Ended", canvas.width/2 - 150, canvas.height/2);
    }
}

gameLoop();