const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");

const W = canvas.width;
const H = canvas.height;
const groundY = 440;
const bestKey = "star-jump-best";

let best = Number(localStorage.getItem(bestKey) || 0);
let score = 0;
let speed = 5.4;
let running = false;
let gameOver = false;
let lastTime = 0;
let spawnTimer = 0;
let starTimer = 0;
let clouds = [];
let stars = [];

const player = {
  x: 112,
  y: groundY - 62,
  w: 54,
  h: 62,
  vy: 0,
  grounded: true,
  jumpsLeft: 2,
};

bestEl.textContent = best;
drawIntro();

function resetGame() {
  score = 0;
  speed = 5.4;
  running = true;
  gameOver = false;
  lastTime = performance.now();
  spawnTimer = 0;
  starTimer = 650;
  clouds = [];
  stars = [];
  player.y = groundY - player.h;
  player.vy = 0;
  player.grounded = true;
  player.jumpsLeft = 2;
  scoreEl.textContent = score;
  overlay.classList.add("hidden");
  requestAnimationFrame(loop);
}

function jump() {
  if (!running) {
    resetGame();
    return;
  }

  if (gameOver) {
    resetGame();
    return;
  }

  if (player.jumpsLeft > 0) {
    player.vy = player.grounded ? -15.5 : -13.2;
    player.grounded = false;
    player.jumpsLeft -= 1;
  }
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 16.67, 2);
  lastTime = now;

  update(dt);
  draw();

  if (running) {
    requestAnimationFrame(loop);
  }
}

function update(dt) {
  speed += 0.0028 * dt;
  spawnTimer -= 16.67 * dt;
  starTimer -= 16.67 * dt;

  player.vy += 0.78 * dt;
  player.y += player.vy * dt;

  if (player.y >= groundY - player.h) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
    player.jumpsLeft = 2;
  }

  if (spawnTimer <= 0) {
    spawnCloud();
    spawnTimer = 1120 + Math.random() * 820;
  }

  if (starTimer <= 0) {
    spawnStar();
    starTimer = 850 + Math.random() * 950;
  }

  clouds.forEach((cloud) => {
    cloud.x -= speed * dt;
  });
  stars.forEach((star) => {
    star.x -= speed * dt;
    star.spin += 0.06 * dt;
  });

  clouds = clouds.filter((cloud) => cloud.x > -cloud.w - 20);
  stars = stars.filter((star) => !star.collected && star.x > -50);

  for (const cloud of clouds) {
    if (hitRect(player, cloud)) {
      endGame();
      return;
    }
  }

  for (const star of stars) {
    const dx = player.x + player.w / 2 - star.x;
    const dy = player.y + player.h / 2 - star.y;
    if (Math.hypot(dx, dy) < star.r + 34) {
      star.collected = true;
      score += 1;
      scoreEl.textContent = score;
      if (score > best) {
        best = score;
        bestEl.textContent = best;
        localStorage.setItem(bestKey, String(best));
      }
    }
  }
}

function spawnCloud() {
  const size = 44 + Math.random() * 24;
  clouds.push({
    x: W + 20,
    y: groundY - size - 4,
    w: size * 1.52,
    h: size,
  });
}

function spawnStar() {
  const highStar = Math.random() < 0.34;
  stars.push({
    x: W + 34,
    y: highStar ? 108 + Math.random() * 58 : 188 + Math.random() * 130,
    r: 18,
    spin: Math.random() * Math.PI,
    collected: false,
  });
}

function endGame() {
  running = false;
  gameOver = true;
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").textContent = "もう一回?";
  overlay.querySelector("p").textContent = `星 ${score} こ。タップでリトライ。`;
  startButton.textContent = "リトライ";
  draw();
}

function hitRect(a, b) {
  const pad = 10;
  return (
    a.x + pad < b.x + b.w &&
    a.x + a.w - pad > b.x &&
    a.y + pad < b.y + b.h &&
    a.y + a.h - pad > b.y
  );
}

function drawIntro() {
  drawSky();
  drawGround();
  drawPlayer();
  drawCloudShape(650, groundY - 70, 98, 58);
  drawStar(500, 240, 23, 0.2);
}

function draw() {
  drawSky();
  drawGround();
  stars.forEach((star) => drawStar(star.x, star.y, star.r, star.spin));
  clouds.forEach((cloud) => drawCloudShape(cloud.x, cloud.y, cloud.w, cloud.h));
  drawPlayer();
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#72c7ff");
  sky.addColorStop(0.62, "#dff7ff");
  sky.addColorStop(1, "#fff1bb");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  drawCloudPuff(118, 86, 34);
  drawCloudPuff(156, 82, 43);
  drawCloudPuff(200, 92, 31);
  drawCloudPuff(692, 115, 30);
  drawCloudPuff(730, 108, 39);
  drawCloudPuff(773, 118, 28);
}

function drawGround() {
  ctx.fillStyle = "#54bf62";
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = "#3aa24e";
  for (let x = -20; x < W; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 18);
    ctx.lineTo(x + 18, groundY);
    ctx.lineTo(x + 36, groundY + 18);
    ctx.fill();
  }
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;
  ctx.fillStyle = "#ffcf54";
  ctx.beginPath();
  ctx.roundRect(x, y + 7, player.w, player.h - 7, 16);
  ctx.fill();

  ctx.fillStyle = "#ff8f54";
  ctx.beginPath();
  ctx.arc(x + player.w * 0.5, y + 10, 24, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = "#17324d";
  ctx.beginPath();
  ctx.arc(x + 21, y + 28, 4, 0, Math.PI * 2);
  ctx.arc(x + 37, y + 28, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#17324d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x + 29, y + 37, 10, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function drawCloudShape(x, y, w, h) {
  ctx.fillStyle = "#ffffff";
  drawCloudPuff(x + w * 0.25, y + h * 0.54, h * 0.34);
  drawCloudPuff(x + w * 0.48, y + h * 0.38, h * 0.44);
  drawCloudPuff(x + w * 0.72, y + h * 0.56, h * 0.32);
  ctx.fillRect(x + w * 0.18, y + h * 0.48, w * 0.66, h * 0.38);
}

function drawCloudPuff(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(x, y, r, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = "#ffd84d";
  ctx.strokeStyle = "#e99b24";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
    const radius = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

startButton.addEventListener("click", jump);
canvas.addEventListener("pointerdown", jump);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }
});
