// ==================== GAME CONFIGURATION ====================
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 600;
const FPS = 60;
// ==================== OVERLAYS ====================



// Expose setRocketType globally
function setRocketType(type) {
  rocketType = type;
}
window.setRocketType = setRocketType;

function cycleShape(dir) {
    rocketShape = (rocketShape + dir + 2) % 2; // +2 handles negative wrap
}
window.cycleShape = cycleShape;

function cycleType(dir) {
    rocketType = (rocketType + dir + 3) % 3; // +3 handles negative wrap
}
window.cycleType = cycleType;

function startGame() {
    page = 3;
}
window.startGame = startGame;

function startNavigation() {
    page = 4;
    rocketX = 300;
    rocketY = 0;
    flightTimer = 0;
    maxFlightTime = flightDurations[rocketType] * 60;
    asteroids.length = 0; // Clear existing asteroids
}
window.startNavigation = startNavigation;




// ROCKET SPEED SETTINGS
const SMALL_ROCKET_SPEED = 5.0;
const MEDIUM_ROCKET_SPEED = 3.5;
const LARGE_ROCKET_SPEED = 2.5;
const NAV_ROCKET_MOVE_SPEED = 5.0;

// ASTEROID SETTINGS
const ASTEROIDS_PER_SPAWN = 10;
const ASTEROID_SPAWN_RATE = 20;
const ASTEROID_MIN_SPEED = 3.0;
const ASTEROID_MAX_SPEED = 6.0;
const COLLISION_DISTANCE = 40.0;

// LANDING PHYSICS
const BASE_WIND_FORCE = -0.015;
const MARS_GRAVITY = 0.0025;

const SMALL_WIND_PERCENT = 1.75;
const MEDIUM_WIND_PERCENT = 1.25;
const LARGE_WIND_PERCENT = 1.05;
const ROUND_WIND_BONUS = 0.1;
const RECT_WIND_BONUS = 0.02;

const SMALL_GRAVITY_MULT = 0.7;
const MEDIUM_GRAVITY_MULT = 5.0;
const LARGE_GRAVITY_MULT = 10.3;

const ROUND_CONTROL_RESPONSE = 0.06;
const RECT_CONTROL_RESPONSE = 0.04;
const RECT_DRAG = 0.98;

// SCORING SETTINGS
const PERFECT_SCORE = 100;
const VELOCITY_Y_PENALTY_THRESHOLD = 5.0;
const VELOCITY_Y_PENALTY = 20;
const VELOCITY_X_PENALTY_THRESHOLD = 3.0;
const VELOCITY_X_PENALTY = 10;

// ==================== GAME STATE ====================
let canvas, ctx, uiOverlay;
let page = 1;
let rocketShape = 0;
const shapeNames = ["Round", "Rectangular"];
let rocketType = 0;
const typeNames = ["Small", "Medium", "Large"];
const flightDurations = [5, 10, 15];

let rocketX, rocketY;
let cameraOffsetY = 0;
let flightTimer = 0;
let maxFlightTime = 0;
let showMars = false;
const asteroids = [];
let asteroidSpawnTimer = 0;

let landingVelocityY = 0;
let landingVelocityX = 0;
const LANDING_ZONE_X = CANVAS_WIDTH / 2;
const TARGET_Y = CANVAS_HEIGHT - 150;
let landed = false;
let finalLandingX = 0;

let score = 0;
let resultMessage = "";

let mouseX = CANVAS_WIDTH / 2;
const windParticles = [];
let animationFrameId;

const keysPressed = {};

let randomSeed = 3540;
function seededRandom() {
  randomSeed = (randomSeed * 9301 + 49297) % 233280;
  return randomSeed / 233280;
}

// ==================== ROCKET DRAWING ====================

function drawRoundRocket(ctx, x, y, s) {
  const bodyWidth = 40 * s;
  const bodyHeight = 60 * s;
  const noseHeight = 25 * s;
  const windowSize = 20 * s;

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5 * s;

  ctx.fillStyle = "#E6E6F0";
  ctx.beginPath();
  ctx.moveTo(-bodyWidth / 2, bodyHeight / 2);
  ctx.bezierCurveTo(
    -bodyWidth / 2 - 5 * s,
    bodyHeight / 2 - 20 * s,
    -bodyWidth / 2 - 5 * s,
    -bodyHeight / 2 + 20 * s,
    0,
    -bodyHeight / 2 - noseHeight
  );
  ctx.bezierCurveTo(
    bodyWidth / 2 + 5 * s,
    -bodyHeight / 2 + 20 * s,
    bodyWidth / 2 + 5 * s,
    bodyHeight / 2 - 20 * s,
    bodyWidth / 2,
    bodyHeight / 2
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#C8C8D2";
  ctx.beginPath();
  ctx.moveTo(-bodyWidth / 2 + 5 * s, bodyHeight / 2 - 5 * s);
  ctx.bezierCurveTo(
    -bodyWidth / 2,
    bodyHeight / 2 - 20 * s,
    -bodyWidth / 2,
    -bodyHeight / 2 + 20 * s,
    0,
    -bodyHeight / 2 - noseHeight + 5 * s
  );
  ctx.bezierCurveTo(
    bodyWidth / 2,
    -bodyHeight / 2 + 20 * s,
    bodyWidth / 2,
    bodyHeight / 2 - 20 * s,
    bodyWidth / 2 - 5 * s,
    bodyHeight / 2 - 5 * s
  );
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  ctx.fillStyle = "#64646E";
  ctx.beginPath();
  ctx.ellipse(
    0,
    -bodyHeight / 2 - noseHeight + 15 * s,
    (bodyWidth - 10 * s) / 2,
    5 * s,
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#96B4FF";
  ctx.beginPath();
  ctx.arc(0, -10 * s, windowSize / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#C8C8D2";
  const finHeight = 35 * s;
  const finWidth = 25 * s;

  ctx.beginPath();
  ctx.moveTo(-bodyWidth / 2, bodyHeight / 2 - 10 * s);
  ctx.bezierCurveTo(
    -bodyWidth / 2 - finWidth,
    bodyHeight / 2 + finHeight - 20 * s,
    -bodyWidth / 2 - finWidth + 5 * s,
    bodyHeight / 2 + finHeight - 5 * s,
    -bodyWidth / 2 + 10 * s,
    bodyHeight / 2 + 10 * s
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bodyWidth / 2, bodyHeight / 2 - 10 * s);
  ctx.bezierCurveTo(
    bodyWidth / 2 + finWidth,
    bodyHeight / 2 + finHeight - 20 * s,
    bodyWidth / 2 + finWidth - 5 * s,
    bodyHeight / 2 + finHeight - 5 * s,
    bodyWidth / 2 - 10 * s,
    bodyHeight / 2 + 10 * s
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#B4B4C0";
  ctx.fillRect(
    -(bodyWidth + 5 * s) / 2,
    bodyHeight / 2,
    bodyWidth + 5 * s,
    10 * s
  );
  ctx.strokeRect(
    -(bodyWidth + 5 * s) / 2,
    bodyHeight / 2,
    bodyWidth + 5 * s,
    10 * s
  );

  ctx.fillStyle = "#FF9600";
  ctx.beginPath();
  ctx.moveTo(0, bodyHeight / 2 + 10 * s);
  ctx.lineTo(-15 * s, bodyHeight / 2 + 25 * s);
  ctx.lineTo(15 * s, bodyHeight / 2 + 25 * s);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawRectRocket(ctx, x, y, s) {
  const bodyWidth = 30 * s;
  const bodyHeight = 60 * s;
  const topConeHeight = 25 * s;
  const finWidth = 35 * s;
  const finHeight = 35 * s;
  const windowSize = 20 * s;
  const bodyBaseSegmentHeight = 15 * s;

  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5 * s;

  ctx.fillStyle = "#E6E6F0";
  ctx.fillRect(
    -bodyWidth / 2,
    -bodyHeight / 2,
    bodyWidth,
    bodyHeight - bodyBaseSegmentHeight
  );
  ctx.strokeRect(
    -bodyWidth / 2,
    -bodyHeight / 2,
    bodyWidth,
    bodyHeight - bodyBaseSegmentHeight
  );

  ctx.fillStyle = "#DEDEDE";
  ctx.beginPath();
  ctx.moveTo(0, -bodyHeight / 2 - topConeHeight);
  ctx.lineTo(-bodyWidth / 2, -bodyHeight / 2);
  ctx.lineTo(bodyWidth / 2, -bodyHeight / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#96B4FF";
  ctx.beginPath();
  ctx.arc(0, -10 * s, windowSize / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#E6E6F0";
  ctx.fillRect(
    -(bodyWidth + 5 * s) / 2,
    bodyHeight / 2 - bodyBaseSegmentHeight,
    bodyWidth + 5 * s,
    bodyBaseSegmentHeight
  );
  ctx.strokeRect(
    -(bodyWidth + 5 * s) / 2,
    bodyHeight / 2 - bodyBaseSegmentHeight,
    bodyWidth + 5 * s,
    bodyBaseSegmentHeight
  );

  ctx.fillStyle = "#FF9600";
  ctx.beginPath();
  ctx.moveTo(0, bodyHeight / 2 + bodyBaseSegmentHeight);
  ctx.lineTo(-10 * s, bodyHeight / 2 + bodyBaseSegmentHeight + 15 * s);
  ctx.lineTo(10 * s, bodyHeight / 2 + bodyBaseSegmentHeight + 15 * s);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawRocketOnMiniCanvas(canvasId, rocketType, rocketShape, scale) {
  const miniCanvas = document.getElementById(canvasId);
  if (!miniCanvas) return;
  const miniCtx = miniCanvas.getContext("2d");
  
  // Use explicit width/height to ensure visibility even if layout isn't finished
  const width = parseInt(miniCanvas.getAttribute("width")) || miniCanvas.offsetWidth || 100;
  const height = parseInt(miniCanvas.getAttribute("height")) || miniCanvas.offsetHeight || 100;
  
  miniCanvas.width = width;
  miniCanvas.height = height;
  
  miniCtx.clearRect(0, 0, width, height);
  const drawX = width / 2;
  const drawY = height / 2;
  if (rocketShape === 0) drawRoundRocket(miniCtx, drawX, drawY, scale);
  else drawRectRocket(miniCtx, drawX, drawY, scale);
}

// ==================== GAME PHASES ====================

function page1_ShapeSelection() {
  ctx.fillStyle = "#eff0ff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function page2_TypeSelection() {
  ctx.fillStyle = "#eff0ff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function page3_LaunchPrep() {
  ctx.fillStyle = "rgb(20, 40, 80)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "rgb(50, 180, 50)";
  ctx.beginPath();
  ctx.ellipse(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT + 100,
    CANVAS_WIDTH * 2,
    400,
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();
  const scale = rocketType === 0 ? 1.2 : rocketType === 1 ? 1.5 : 1.8;
  if (rocketShape === 0)
    drawRoundRocket(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200, scale);
  else drawRectRocket(ctx, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200, scale);
}

function page4_Navigation() {
  ctx.fillStyle = "rgb(5, 5, 15)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Stars
  ctx.fillStyle = "rgb(255, 255, 255)";
  randomSeed = 3540;
  for (let i = 0; i < 150; i++) {
    const starX = seededRandom() * CANVAS_WIDTH;
    let starY = seededRandom() * 8000 + cameraOffsetY * 0.3;
    while (starY > CANVAS_HEIGHT + 10) starY -= 8000;
    while (starY < -10) starY += 8000;
    ctx.beginPath();
    ctx.arc(starX, starY, 1, 0, 2 * Math.PI);
    ctx.fill();
  }
  if (showMars) {
    let marsSize = map(
      flightTimer,
      maxFlightTime - 180,
      maxFlightTime,
      80,
      200
    );
    ctx.fillStyle = "rgb(200, 100, 50)";
    ctx.beginPath();
    ctx.arc(
      CANVAS_WIDTH / 2,
      -rocketY + 300 + cameraOffsetY,
      marsSize / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
  asteroids.forEach((a) => {
    if (a.active) {
      ctx.fillStyle = "rgb(120, 100, 80)";
      ctx.beginPath();
      ctx.arc(a.x, a.y + cameraOffsetY, COLLISION_DISTANCE / 2, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  const scale = rocketType === 0 ? 1.0 : rocketType === 1 ? 1.2 : 1.5;
  if (rocketShape === 0)
    drawRoundRocket(ctx, rocketX, CANVAS_HEIGHT - 200, scale);
  else drawRectRocket(ctx, rocketX, CANVAS_HEIGHT - 200, scale);
}

function page5_Landing() {
  ctx.fillStyle = "rgb(150, 80, 60)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "rgb(180, 100, 70)";
  ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  ctx.fillStyle = "rgba(100, 255, 100, 0.4)";
  ctx.fillRect(LANDING_ZONE_X - 50, CANVAS_HEIGHT - 100, 100, 10);
  const scale = rocketType === 0 ? 1.0 : rocketType === 1 ? 1.2 : 1.5;
  if (rocketShape === 0) drawRoundRocket(ctx, rocketX, rocketY, scale);
  else drawRectRocket(ctx, rocketX, rocketY, scale);
}

function page6_Results() {
  ctx.fillStyle = "rgb(150, 80, 60)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "rgb(180, 100, 70)";
  ctx.fillRect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  if (score >= 30) {
    const scale = rocketType === 0 ? 1.0 : rocketType === 1 ? 1.2 : 1.5;
    if (rocketShape === 0)
      drawRoundRocket(ctx, finalLandingX, CANVAS_HEIGHT - 120, scale);
    else drawRectRocket(ctx, finalLandingX, CANVAS_HEIGHT - 120, scale);
  } else {
    ctx.font = "40px Inter";
    ctx.textAlign = "center";
    ctx.fillText("💥", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
  }
}

// ==================== LOGIC UPDATES ====================

function updateNavigation() {
  flightTimer++;
  const rocketSpeed =
    rocketType === 0
      ? SMALL_ROCKET_SPEED
      : rocketType === 1
      ? MEDIUM_ROCKET_SPEED
      : LARGE_ROCKET_SPEED;
  rocketY -= rocketSpeed;
  cameraOffsetY = -rocketY + CANVAS_HEIGHT - 200;

  if (keysPressed["ArrowLeft"] || keysPressed["a"])
    rocketX -= NAV_ROCKET_MOVE_SPEED;
  if (keysPressed["ArrowRight"] || keysPressed["d"])
    rocketX += NAV_ROCKET_MOVE_SPEED;
  rocketX = constrain(rocketX, 30, CANVAS_WIDTH - 30);

  asteroidSpawnTimer++;
  if (asteroidSpawnTimer >= ASTEROID_SPAWN_RATE) {
    asteroidSpawnTimer = 0;
    asteroids.push({
      active: true,
      x: Math.random() * (CANVAS_WIDTH - 100) + 50,
      y: rocketY - 600,
      speed:
        Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) +
        ASTEROID_MIN_SPEED,
    });
  }

  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    if (!a.active) continue;
    a.y += a.speed;
    const dist = Math.sqrt(
      (a.x - rocketX) ** 2 + (a.y + cameraOffsetY - (CANVAS_HEIGHT - 200)) ** 2
    );
    if (dist < COLLISION_DISTANCE) {
      page = 6;
      score = 0;
      resultMessage = "Mission failed. Destroyed by asteroid!";
      return;
    }
  }
  if (flightTimer > maxFlightTime - 180) showMars = true;
  if (flightTimer >= maxFlightTime) {
    page = 5;
    rocketX = CANVAS_WIDTH / 2;
    rocketY = 50;
    landingVelocityY = 1;
    landingVelocityX = 0;
    landed = false;
  }
  page4_Navigation();
}

function updateLanding() {
  if (landed) return;
  const gravityMult =
    rocketType === 0
      ? SMALL_GRAVITY_MULT
      : rocketType === 1
      ? MEDIUM_GRAVITY_MULT
      : LARGE_GRAVITY_MULT;
  landingVelocityY += MARS_GRAVITY * gravityMult;
  const totalWind =
    (rocketType === 0
      ? SMALL_WIND_PERCENT
      : rocketType === 1
      ? MEDIUM_WIND_PERCENT
      : LARGE_WIND_PERCENT) +
    (rocketShape === 0 ? ROUND_WIND_BONUS : RECT_WIND_BONUS);
  landingVelocityX += BASE_WIND_FORCE * totalWind;
  landingVelocityX +=
    (mouseX - rocketX) *
    (rocketShape === 0 ? ROUND_CONTROL_RESPONSE : RECT_CONTROL_RESPONSE);

  if (rocketShape === 1) {
    landingVelocityX *= RECT_DRAG;
    landingVelocityY *= RECT_DRAG;
  }
  rocketY += landingVelocityY;
  rocketX += landingVelocityX;
  if (rocketY >= TARGET_Y) {
    landed = true;
    finalLandingX = rocketX;
    calculateScore();
    page = 6;
  }
}

function calculateScore() {
  const distance = Math.abs(finalLandingX - LANDING_ZONE_X);
  let scoreValue = PERFECT_SCORE - distance * 0.7;
  if (landingVelocityY > VELOCITY_Y_PENALTY_THRESHOLD)
    scoreValue -= VELOCITY_Y_PENALTY;
  if (Math.abs(landingVelocityX) > VELOCITY_X_PENALTY_THRESHOLD)
    scoreValue -= VELOCITY_X_PENALTY;
  score = constrain(Math.floor(scoreValue), 0, PERFECT_SCORE);
  if (score >= 90) resultMessage = "PERFECT LANDING! Mission Success!";
  else if (score >= 60) resultMessage = "Great job! Mission Success!";
  else resultMessage = "Mission failed. Impact too hard or off target.";
}

// ==================== OVERLAYS ====================

function setRocketShape(shape) {
  rocketShape = shape;
}
window.setRocketShape = setRocketShape;

function handleKeyDown(e) {
  const key = e.key;
  keysPressed[key] = true;
  if (page === 1) {
    if (key === "Enter") page = 2;
    if (key === "ArrowLeft") rocketShape = 0;
    if (key === "ArrowRight") rocketShape = 1;
  }
  else if (page === 2) {
    if (key === "Enter") page = 3;
    if (key === "ArrowLeft") rocketType = Math.max(0, rocketType - 1);
    if (key === "ArrowRight") rocketType = Math.min(2, rocketType + 1);
  } else if (page === 3 && key === "Enter") {
    startNavigation();
  } else if (page === 6 && (key === "r" || key === "R")) page = 1;
}

function handleKeyUp(e) {
  keysPressed[e.key] = false;
}
function constrain(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function map(v, s1, st1, s2, st2) {
  return s2 + (st2 - s2) * ((v - s1) / (st1 - s1));
}

// ==================== OVERLAYS ====================

let lastOverlayHash = "";

function renderOverlay() {
  // Construct the desired HTML based on current state
  let newHTML = "";
  
  if (page === 1) {
    newHTML = `
            <div class="text-center"><h1 class="text-4xl font-extrabold text-gray-700 text-shadow">LandonMarz Mission</h1></div>
            <div class="absolute inset-x-0 top-40 flex justify-center gap-4 pointer-events-auto">
                <div id="shape-0-card" class="p-2 rounded-xl card-glass ${
                  rocketShape === 0 ? "bg-[#5A78FF] text-white" : "bg-white"
                } cursor-pointer transition-all hover:scale-105" onclick="window.setRocketShape(0)">
                    <canvas id="canvas-shape-0" width="80" height="100"></canvas>
                    <p class="text-center font-bold text-sm">Round</p>
                </div>
                <div id="shape-1-card" class="p-2 rounded-xl card-glass ${
                  rocketShape === 1 ? "bg-[#5A78FF] text-white" : "bg-white"
                } cursor-pointer transition-all hover:scale-105" onclick="window.setRocketShape(1)">
                    <canvas id="canvas-shape-1" width="80" height="100"></canvas>
                    <p class="text-center font-bold text-sm">Rectangular</p>
                </div>
            </div>
            
             <!-- Controls -->
            <div class="absolute bottom-4 inset-x-0 flex justify-center gap-8 pointer-events-auto">
                <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-[#5A78FF] text-2xl font-bold border-2 border-[#5A78FF]/50 active:scale-95 shadow-lg" 
                    onclick="window.cycleShape(-1)">←</button>
                    
                <button class="px-8 h-16 bg-[#5A78FF] text-white rounded-full font-bold shadow-lg hover:bg-[#4a68ef] active:scale-95 transition-all" onclick="page=2">Next Step</button>
                
                <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-[#5A78FF] text-2xl font-bold border-2 border-[#5A78FF]/50 active:scale-95 shadow-lg" 
                    onclick="window.cycleShape(1)">→</button>
            </div>
            <div class="absolute bottom-24 w-full text-center pointer-events-none">
                <p class="text-gray-500 font-bold text-sm mb-2 opacity-60">Use Arrow Keys | Buttons | Click</p>
            </div>`;
  } else if (page === 2) {
    // Added visual feedback for size selection
    newHTML = `
        <div class="text-center text-[#5A78FF]"><h1 class="text-3xl font-bold">Select Size</h1></div>
        <div class="absolute inset-x-0 top-32 flex justify-center gap-2 pointer-events-auto">
            ${typeNames.map((name, idx) => `
                <div class="p-2 rounded-xl card-glass ${rocketType === idx ? "bg-[#5A78FF] text-white" : "bg-white text-gray-800"} cursor-pointer transition-all hover:scale-105" onclick="window.setRocketType(${idx})">
                    <canvas id="canvas-size-${idx}" width="80" height="120"></canvas>
                    <h2 class="text-center font-bold text-sm">${name}</h2>
                </div>
            `).join('')}
        </div>
        
         <!-- Controls -->
        <div class="absolute bottom-4 inset-x-0 flex justify-center gap-8 pointer-events-auto">
            <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-[#5A78FF] text-2xl font-bold border-2 border-[#5A78FF]/50 active:scale-95 shadow-lg" 
                onclick="window.cycleType(-1)">←</button>
                
            <button class="px-8 h-16 bg-[#5A78FF] text-white rounded-full font-bold shadow-lg hover:bg-[#4a68ef] active:scale-95 transition-all" onclick="window.startGame()">Launch</button>
            
            <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-[#5A78FF] text-2xl font-bold border-2 border-[#5A78FF]/50 active:scale-95 shadow-lg" 
                onclick="window.cycleType(1)">→</button>
        </div>
        <div class="absolute bottom-24 w-full text-center pointer-events-none">
             <p class="text-[#5A78FF] font-bold mb-2 opacity-80">Impacts Speed & Gravity!</p>
             <p class="text-[#5A78FF] font-bold text-sm opacity-60">Use Arrow Keys | Buttons | Click</p>
        </div>`;
  } else if (page === 3) {
      newHTML = `
        <div class="w-full text-center mt-12">
            <h1 class="text-4xl font-extrabold text-white text-shadow">Ready to Launch?</h1>
             <p class="text-white font-bold mt-2 text-shadow">Destination: Mars</p>
        </div>
        <div class="w-full flex justify-center pointer-events-auto mb-4">
             <button class="px-10 py-4 bg-red-600 text-white rounded-full font-bold text-xl shadow-lg hover:bg-red-500 active:scale-95 transition-all animate-pulse" onclick="window.startNavigation()">LAUNCH MISSION 🚀</button>
        </div>`;
  } else if (page === 4) {
      // NAVIGATION PHASE
      const progress = Math.min(100, Math.floor((flightTimer / maxFlightTime) * 100));
      newHTML = `
        <div class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div class="bg-black/50 p-2 rounded text-white text-sm">
                <p>🚀 Time: ${Math.floor(flightTimer/60)}s / ${Math.floor(maxFlightTime/60)}s</p>
                <p>⚠️ AVOID ASTEROIDS</p>
            </div>
            <div class="bg-black/50 p-2 rounded text-white text-sm">
                <p>Mars Distance</p>
                <div class="w-32 h-2 bg-gray-700 rounded overflow-hidden mt-1">
                    <div class="h-full bg-green-500" style="width: ${progress}%"></div>
                </div>
            </div>
        </div>
        
        <!-- Controls -->
        <div class="absolute bottom-4 inset-x-0 flex justify-center gap-8 pointer-events-auto">
            <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-white text-2xl font-bold border-2 border-white/50 active:scale-95" 
                onmousedown="keysPressed['ArrowLeft']=true" onmouseup="keysPressed['ArrowLeft']=false"
                ontouchstart="keysPressed['ArrowLeft']=true" ontouchend="keysPressed['ArrowLeft']=false">←</button>
            <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-white text-2xl font-bold border-2 border-white/50 active:scale-95" 
                onmousedown="keysPressed['ArrowRight']=true" onmouseup="keysPressed['ArrowRight']=false"
                ontouchstart="keysPressed['ArrowRight']=true" ontouchend="keysPressed['ArrowRight']=false">→</button>
        </div>
      `;
  } else if (page === 5) {
      // LANDING PHASE
      newHTML = `
        <div class="absolute top-4 inset-x-0 text-center pointer-events-none">
            <div class="inline-block bg-black/50 p-2 rounded text-white">
                <p class="font-bold text-yellow-400">LANDING PROCEDURE</p>
                <p class="text-xs">Guide to the Green Zone!</p>
                <p class="text-xs">Wind: ${BASE_WIND_FORCE.toFixed(3)}</p>
            </div>
        </div>
        
        <!-- Controls -->
        <div class="absolute bottom-4 inset-x-0 flex justify-center gap-8 pointer-events-auto">
            <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-white text-2xl font-bold border-2 border-white/50 active:scale-95" 
                onmousedown="keysPressed['ArrowLeft']=true" onmouseup="keysPressed['ArrowLeft']=false"
                ontouchstart="keysPressed['ArrowLeft']=true" ontouchend="keysPressed['ArrowLeft']=false">←</button>
            <button class="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur text-white text-2xl font-bold border-2 border-white/50 active:scale-95" 
                onmousedown="keysPressed['ArrowRight']=true" onmouseup="keysPressed['ArrowRight']=false"
                ontouchstart="keysPressed['ArrowRight']=true" ontouchend="keysPressed['ArrowRight']=false">→</button>
        </div>
      `;
  } else if (page === 6) {
    newHTML = `<div class="text-center mt-20">
        <h1 class="text-4xl font-bold text-white">Score: ${score}</h1>
        <p class="text-white mt-4 text-lg px-4">${resultMessage}</p>
        <button class="mt-8 px-6 py-3 bg-white text-blue-600 rounded-full font-bold shadow-lg hover:bg-gray-100 pointer-events-auto" onclick="page=1">Play Again</button>
    </div>`;
  }

  // Only update DOM if something changed
  if (newHTML !== lastOverlayHash) {
    uiOverlay.innerHTML = newHTML;
    lastOverlayHash = newHTML;
    
    // Post-render steps (canvas drawing)
    if (page === 1) {
       drawRocketOnMiniCanvas("canvas-shape-0", 0, 0, 0.7);
       drawRocketOnMiniCanvas("canvas-shape-1", 0, 1, 0.7);
    } else if (page === 2) {
       drawRocketOnMiniCanvas("canvas-size-0", 0, rocketShape, 0.6); // Small
       drawRocketOnMiniCanvas("canvas-size-1", 1, rocketShape, 0.8); // Medium
       drawRocketOnMiniCanvas("canvas-size-2", 2, rocketShape, 0.9); // Large
    }
  }
}

// ==================== ENGINE ====================

function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (page === 1) page1_ShapeSelection();
  else if (page === 2) page2_TypeSelection();
  else if (page === 3) page3_LaunchPrep();
  else if (page === 4) updateNavigation();
  else if (page === 5) {
    updateLanding();
    page5_Landing();
  } else if (page === 6) page6_Results();
  renderOverlay();
  requestAnimationFrame(gameLoop);
}

window.onload = () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  uiOverlay = document.getElementById("uiOverlay");
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (e.clientX - rect.left) * scaleX;
  });
  gameLoop();
};
