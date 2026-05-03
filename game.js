const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const livesEl = document.querySelector("#lives");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const startButton = document.querySelector("#startButton");
const titleButton = document.querySelector("#titleButton");
const helpButton = document.querySelector("#helpButton");
const helpBackButton = document.querySelector("#helpBackButton");
const characterSelect = document.querySelector("#characterSelect");
const characterButtons = document.querySelectorAll(".character-button");
const helpPanel = document.querySelector("#helpPanel");
const professorTip = document.querySelector("#professorTip");
const professorText = document.querySelector("#professorText");
const versionEl = document.querySelector("#version");

const GAME_VERSION = "v0.7.3";
const W = canvas.width;
const H = canvas.height;
const groundY = 440;
const maxLives = 3;
const bestKey = "star-jump-best";
const characterKey = "star-jump-character";

let best = Number(localStorage.getItem(bestKey) || 0);
let score = 0;
let lives = maxLives;
let speed = 5.4;
let running = false;
let gameOver = false;
let showingHelp = false;
let lastTime = 0;
let worldTime = 0;
let spawnTimer = 0;
let starTimer = 0;
let clouds = [];
let stars = [];
let scorePops = [];
let bestPops = [];
let bestFlash = 0;
let feverTimer = 0;
let bestToBeat = best;
let bestCelebrated = false;
let audioContext;
let musicGain;
let musicTimer;
let musicStep = 0;
let musicTheme = "day";
let selectedCharacterId = localStorage.getItem(characterKey) || "star";

const characters = {
  star: {
    name: "スター",
    jumpPower: -15.5,
    airJumpPower: -13.2,
    gravity: 0.78,
    maxJumps: 2,
    bodyColor: "#ffcf54",
    capColor: "#ff8f54",
    description:
      "スターはクセが<ruby>少<rt>すく</rt></ruby>ない<ruby>万能型<rt>ばんのうがた</rt></ruby>じゃ。2<ruby>回<rt>かい</rt></ruby>ジャンプで<ruby>地上雲<rt>ちじょうぐも</rt></ruby>も<ruby>空中雲<rt>くうちゅうぐも</rt></ruby>も<ruby>落<rt>お</rt></ruby>ち<ruby>着<rt>つ</rt></ruby>いてよけられるぞ。",
  },
  sora: {
    name: "ソラ",
    jumpPower: -13.8,
    airJumpPower: -11.8,
    gravity: 0.68,
    maxJumps: 3,
    bodyColor: "#74f2ff",
    capColor: "#39c7ff",
    description:
      "ソラはふわっと<ruby>軽<rt>かる</rt></ruby>くて3<ruby>回<rt>かい</rt></ruby><ruby>跳<rt>と</rt></ruby>べるぞ。<ruby>細<rt>こま</rt></ruby>かく<ruby>高<rt>たか</rt></ruby>さを<ruby>直<rt>なお</rt></ruby>せるから、<ruby>高<rt>たか</rt></ruby>い<ruby>星<rt>ほし</rt></ruby>を<ruby>拾<rt>ひろ</rt></ruby>いやすいんじゃ。",
  },
  bolt: {
    name: "ボルト",
    jumpPower: -21.4,
    airJumpPower: -21.4,
    gravity: 0.86,
    maxJumps: 1,
    bodyColor: "#fff6a8",
    capColor: "#e85d75",
    description:
      "ボルトは<ruby>一撃<rt>いちげき</rt></ruby>で<ruby>高<rt>たか</rt></ruby>く<ruby>跳<rt>と</rt></ruby>ぶ<ruby>勝負型<rt>しょうぶがた</rt></ruby>じゃ。<ruby>早<rt>はや</rt></ruby>めに<ruby>押<rt>お</rt></ruby>すと<ruby>上<rt>うえ</rt></ruby>の<ruby>星<rt>ほし</rt></ruby>にも<ruby>届<rt>とど</rt></ruby>き、<ruby>空中雲<rt>くうちゅうぐも</rt></ruby>も<ruby>越<rt>こ</rt></ruby>えやすいぞ。",
  },
};

if (!characters[selectedCharacterId]) {
  selectedCharacterId = "star";
}

const musicThemes = {
  day: {
    melody: [392, 494, 587, 494, 440, 523, 659, 523],
    bass: [196, 247, 220, 262],
    harmony: [330, 392, 349, 392],
    leadType: "triangle",
    bassType: "sine",
    leadVolume: 0.12,
    bassVolume: 0.08,
    harmonyVolume: 0.045,
  },
  night: {
    melody: [330, 392, 494, 440, 392, 349, 440, 392],
    bass: [165, 196, 147, 175],
    harmony: [247, 294, 262, 220],
    leadType: "sine",
    bassType: "triangle",
    leadVolume: 0.095,
    bassVolume: 0.065,
    harmonyVolume: 0.055,
  },
};

const player = {
  x: 112,
  y: groundY - 62,
  w: 54,
  h: 62,
  vy: 0,
  grounded: true,
  jumpsLeft: 2,
  happyTimer: 0,
  invincibleTimer: 0,
};

bestEl.textContent = best;
renderLives();
versionEl.textContent = GAME_VERSION;
startButton.addEventListener("click", jump);
titleButton.addEventListener("click", showTitleScreen);
helpButton.addEventListener("click", showHelpScreen);
helpBackButton.addEventListener("click", showTitleScreen);
characterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectCharacter(button.dataset.character);
  });
});
canvas.addEventListener("pointerdown", jump);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }
});
safeDraw(drawIntro);
syncCharacterButtons();

function resetGame() {
  score = 0;
  lives = maxLives;
  speed = 5.4;
  running = true;
  gameOver = false;
  showingHelp = false;
  lastTime = performance.now();
  worldTime = 0;
  spawnTimer = 0;
  starTimer = 650;
  clouds = [];
  stars = [];
  scorePops = [];
  bestPops = [];
  bestFlash = 0;
  feverTimer = 0;
  bestToBeat = best;
  bestCelebrated = false;
  startMusic();
  player.y = groundY - player.h;
  player.vy = 0;
  player.grounded = true;
  player.jumpsLeft = getSelectedCharacter().maxJumps;
  player.happyTimer = 0;
  player.invincibleTimer = 0;
  scoreEl.textContent = score;
  renderLives();
  characterSelect.classList.add("hidden");
  helpPanel.classList.add("hidden");
  professorTip.classList.add("hidden");
  helpButton.classList.add("hidden");
  helpBackButton.classList.add("hidden");
  titleButton.classList.add("hidden");
  overlay.classList.add("hidden");
  requestAnimationFrame(loop);
}

function jump() {
  unlockAudio();

  if (showingHelp) {
    return;
  }

  if (!running) {
    resetGame();
    return;
  }

  if (gameOver) {
    resetGame();
    return;
  }

  if (player.jumpsLeft > 0) {
    const character = getSelectedCharacter();
    player.vy = player.grounded ? character.jumpPower : character.airJumpPower;
    player.grounded = false;
    player.jumpsLeft -= 1;
  }
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 16.67, 2);
  lastTime = now;

  update(dt);
  safeDraw(draw);

  if (running) {
    requestAnimationFrame(loop);
  }
}

function update(dt) {
  worldTime += 16.67 * dt;
  speed += 0.0028 * dt;
  spawnTimer -= 16.67 * dt;
  starTimer -= 16.67 * dt;
  feverTimer = Math.max(0, feverTimer - 16.67 * dt);

  player.vy += getSelectedCharacter().gravity * dt;
  player.y += player.vy * dt;
  player.happyTimer = Math.max(0, player.happyTimer - dt);
  player.invincibleTimer = Math.max(0, player.invincibleTimer - 16.67 * dt);

  if (player.y >= groundY - player.h) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
    player.jumpsLeft = getSelectedCharacter().maxJumps;
  }

  if (spawnTimer <= 0) {
    spawnCloud();
    spawnTimer = 1120 + Math.random() * 820;
  }

  if (starTimer <= 0) {
    spawnStar();
    if (isFeverActive() && Math.random() < 0.55) {
      spawnStar();
    }
    starTimer = isFeverActive() ? 170 + Math.random() * 180 : 850 + Math.random() * 950;
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
    if (player.invincibleTimer <= 0 && hitRect(player, cloud)) {
      loseLife(cloud);
      if (lives <= 0) {
        endGame();
      }
      return;
    }
  }

  for (const star of stars) {
    const dx = player.x + player.w / 2 - star.x;
    const dy = player.y + player.h / 2 - star.y;
    if (Math.hypot(dx, dy) < star.r + 34) {
      star.collected = true;
      if (star.fever) {
        startFever(star.x, star.y);
      } else {
        score += star.points;
        scoreEl.textContent = score;
      }
      scorePops.push({
        x: star.x,
        y: star.y,
        points: star.points,
        text: star.fever ? "FEVER!" : `+${star.points}`,
        color: star.popColor,
        age: 0,
      });
      player.happyTimer = Math.max(player.happyTimer, 28);
      if (star.fever) {
        playFeverSound();
      } else {
        playCollectSound(star.points);
      }
      if (score > best) {
        best = score;
        bestEl.textContent = best;
        localStorage.setItem(bestKey, String(best));
      }
      if (!bestCelebrated && score > bestToBeat) {
        celebrateBestScore(star.x, star.y);
        bestCelebrated = true;
      }
    }
  }
}

function spawnCloud() {
  const airborne = worldTime > 9000 && Math.random() < 0.34;
  const size = airborne ? 38 + Math.random() * 18 : 44 + Math.random() * 24;
  clouds.push({
    x: W + 20,
    y: airborne ? 230 + Math.random() * 66 : groundY - size - 4,
    w: size * 1.52,
    h: size,
  });
}

function spawnStar() {
  const feverStar = !isFeverActive() && worldTime > 12000 && Math.random() < 0.07;
  const highStar = Math.random() < 0.34;
  const rarityRoll = Math.random();
  const starType =
    feverStar
      ? {
          points: 0,
          r: 30,
          fill: "#fff6a8",
          stroke: "#ff6bd6",
          popColor: "#ff6bd6",
          fever: true,
        }
      : rarityRoll < 0.06
      ? {
          points: 5,
          r: 24,
          fill: "#ff6bd6",
          stroke: "#8d3cff",
          popColor: "#ff6bd6",
        }
      : rarityRoll < 0.22
        ? {
            points: 2,
            r: 21,
            fill: "#74f2ff",
            stroke: "#248dd4",
            popColor: "#39c7ff",
          }
        : {
            points: 1,
            r: 18,
            fill: "#ffd84d",
            stroke: "#e99b24",
            popColor: "#e85d75",
          };

  stars.push({
    x: W + 34,
    y: highStar ? 108 + Math.random() * 58 : 188 + Math.random() * 130,
    r: starType.r,
    points: starType.points,
    fill: starType.fill,
    stroke: starType.stroke,
    popColor: starType.popColor,
    fever: Boolean(starType.fever),
    spin: Math.random() * Math.PI,
    collected: false,
  });
}

function startFever(x, y) {
  feverTimer = 6000;
  bestFlash = Math.max(bestFlash, 18);
  scorePops.push({
    x,
    y: y - 38,
    text: "BONUS TIME!",
    color: "#8d3cff",
    age: 0,
  });
}

function isFeverActive() {
  return feverTimer > 0;
}

function loseLife(cloud) {
  lives -= 1;
  renderLives();
  player.invincibleTimer = 1400;
  player.happyTimer = 0;
  bestFlash = Math.max(bestFlash, 14);
  scorePops.push({
    x: player.x + player.w / 2,
    y: player.y + 10,
    text: lives > 0 ? "LIFE -1" : "LAST!",
    color: "#e85d75",
    age: 0,
  });
  if (cloud) {
    cloud.x = -cloud.w - 40;
  }
  playDamageSound();
}

function endGame() {
  running = false;
  gameOver = true;
  showingHelp = false;
  stopMusic();
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").innerHTML = "もう<ruby>一回<rt>いっかい</rt></ruby>";
  overlay.querySelector("p").innerHTML = `<ruby>残機<rt>ざんき</rt></ruby>ゼロ。<ruby>星<rt>ほし</rt></ruby> ${score} こ。`;
  startButton.textContent = "リトライ";
  characterSelect.classList.add("hidden");
  helpPanel.classList.add("hidden");
  professorTip.classList.add("hidden");
  helpButton.classList.add("hidden");
  helpBackButton.classList.add("hidden");
  titleButton.classList.remove("hidden");
  playGameOverSound();
  safeDraw(draw);
}

function showTitleScreen() {
  running = false;
  gameOver = false;
  showingHelp = false;
  stopMusic();
  score = 0;
  worldTime = 0;
  clouds = [];
  stars = [];
  scorePops = [];
  bestPops = [];
  bestFlash = 0;
  feverTimer = 0;
  lives = maxLives;
  player.y = groundY - player.h;
  player.vy = 0;
  player.grounded = true;
  player.jumpsLeft = getSelectedCharacter().maxJumps;
  player.happyTimer = 0;
  player.invincibleTimer = 0;
  scoreEl.textContent = score;
  renderLives();
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").innerHTML = "<ruby>星<rt>ほし</rt></ruby>あつめジャンプ";
  overlay.querySelector("p").innerHTML =
    "キャラを<ruby>選<rt>えら</rt></ruby>んで、<ruby>星<rt>ほし</rt></ruby>を<ruby>集<rt>あつ</rt></ruby>めよう。";
  startButton.textContent = "スタート";
  startButton.classList.remove("hidden");
  characterSelect.classList.remove("hidden");
  helpPanel.classList.add("hidden");
  professorTip.classList.remove("hidden");
  helpButton.classList.remove("hidden");
  helpBackButton.classList.add("hidden");
  titleButton.classList.add("hidden");
  syncCharacterButtons();
  safeDraw(drawIntro);
}

function showHelpScreen() {
  running = false;
  gameOver = false;
  showingHelp = true;
  stopMusic();
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").innerHTML = "あそびかた";
  overlay.querySelector("p").innerHTML =
    "<ruby>博士<rt>はかせ</rt></ruby>が<ruby>基本<rt>きほん</rt></ruby>ルールを<ruby>教<rt>おし</rt></ruby>えるぞ。";
  startButton.classList.add("hidden");
  characterSelect.classList.add("hidden");
  professorTip.classList.add("hidden");
  helpPanel.classList.remove("hidden");
  helpButton.classList.add("hidden");
  helpBackButton.classList.remove("hidden");
  titleButton.classList.add("hidden");
  safeDraw(drawIntro);
}

function selectCharacter(characterId) {
  if (!characters[characterId]) {
    return;
  }

  selectedCharacterId = characterId;
  localStorage.setItem(characterKey, selectedCharacterId);
  player.jumpsLeft = getSelectedCharacter().maxJumps;
  syncCharacterButtons();
  safeDraw(drawIntro);
}

function getSelectedCharacter() {
  return characters[selectedCharacterId] || characters.star;
}

function syncCharacterButtons() {
  characterButtons.forEach((button) => {
    const selected = button.dataset.character === selectedCharacterId;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  professorText.innerHTML = getSelectedCharacter().description;
}

function renderLives() {
  livesEl.innerHTML = "";
  livesEl.setAttribute("aria-label", `残機 ${lives}`);
  for (let i = 0; i < maxLives; i += 1) {
    const heart = document.createElement("span");
    heart.className = i < lives ? "heart" : "heart empty";
    livesEl.appendChild(heart);
  }
}

function hitRect(a, b) {
  const playerPadX = 14;
  const playerPadY = 12;
  const cloudPadX = 18;
  const cloudPadY = 14;
  return (
    a.x + playerPadX < b.x + b.w - cloudPadX &&
    a.x + a.w - playerPadX > b.x + cloudPadX &&
    a.y + playerPadY < b.y + b.h - cloudPadY &&
    a.y + a.h - playerPadY > b.y + cloudPadY
  );
}

function drawIntro() {
  drawSky();
  drawGround();
  drawPlayer();
  drawCloudShape(650, groundY - 70, 98, 58);
  drawStar(500, 240, 23, 0.2, "#ffd84d", "#e99b24");
}

function safeDraw(drawFn) {
  try {
    drawFn();
  } catch (error) {
    drawFallback();
  }
}

function drawFallback() {
  ctx.fillStyle = "#72c7ff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#54bf62";
  ctx.fillRect(0, groundY, W, H - groundY);
  drawPlayer();
}

function draw() {
  drawSky();
  drawGround();
  stars.forEach((star) => drawStar(star.x, star.y, star.r, star.spin, star.fill, star.stroke));
  clouds.forEach((cloud) => drawCloudShape(cloud.x, cloud.y, cloud.w, cloud.h));
  drawPlayer();
  drawBestFlash();
  drawFeverHud();
  drawScorePops();
  drawBestPops();
}

function drawSky() {
  const colors = getWorldColors();
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, colors.skyTop);
  sky.addColorStop(0.62, colors.skyMid);
  sky.addColorStop(1, colors.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  drawFeverSky();
  drawSunAndMoon(colors);
  drawNightStars(colors.progress);

  ctx.fillStyle = colors.cloud;
  drawCloudPuff(118, 86, 34);
  drawCloudPuff(156, 82, 43);
  drawCloudPuff(200, 92, 31);
  drawCloudPuff(692, 115, 30);
  drawCloudPuff(730, 108, 39);
  drawCloudPuff(773, 118, 28);
}

function drawGround() {
  const colors = getWorldColors();
  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = colors.grass;
  for (let x = -20; x < W; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 18);
    ctx.lineTo(x + 18, groundY);
    ctx.lineTo(x + 36, groundY + 18);
    ctx.fill();
  }
}

function drawPlayer() {
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 110) % 2 === 0) {
    return;
  }

  const x = player.x;
  const y = player.y;
  const character = getSelectedCharacter();
  const happy = player.happyTimer > 0;
  const bounce = happy ? Math.sin(player.happyTimer * 0.45) * 1.5 : 0;
  ctx.fillStyle = character.bodyColor;
  ctx.beginPath();
  drawRoundRect(x, y + 7 + bounce, player.w, player.h - 7, 16);
  ctx.fill();

  ctx.fillStyle = character.capColor;
  ctx.beginPath();
  ctx.arc(x + player.w * 0.5, y + 10 + bounce, 24, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = "#17324d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (happy) {
    ctx.arc(x + 21, y + 29 + bounce, 5, Math.PI * 0.08, Math.PI * 0.92);
    ctx.moveTo(x + 42, y + 29 + bounce);
    ctx.arc(x + 37, y + 29 + bounce, 5, Math.PI * 0.08, Math.PI * 0.92);
    ctx.moveTo(x + 42, y + 36 + bounce);
    ctx.arc(x + 29, y + 36 + bounce, 13, 0.18, Math.PI - 0.18);
  } else {
    ctx.fillStyle = "#17324d";
    ctx.arc(x + 21, y + 28 + bounce, 4, 0, Math.PI * 2);
    ctx.arc(x + 37, y + 28 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 29, y + 37 + bounce, 10, 0.15, Math.PI - 0.15);
  }
  ctx.stroke();
}

function drawRoundRect(x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function drawCloudShape(x, y, w, h) {
  ctx.fillStyle = getWorldColors().cloud;
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

function getWorldColors() {
  const progress = Math.min(worldTime / 45000, 1);
  const sunset = smoothStep(0.22, 0.58, progress);
  const night = smoothStep(0.56, 1, progress);
  const eveningTop = mixRgb([114, 199, 255], [255, 154, 106], sunset);
  const eveningMid = mixRgb([223, 247, 255], [255, 208, 132], sunset);
  const eveningHorizon = mixRgb([255, 241, 187], [255, 180, 107], sunset);
  const eveningGround = mixRgb([84, 191, 98], [78, 168, 80], sunset);
  const eveningGrass = mixRgb([58, 162, 78], [52, 141, 69], sunset);

  return {
    progress,
    skyTop: rgbString(mixRgb(eveningTop, [21, 34, 79], night)),
    skyMid: rgbString(mixRgb(eveningMid, [48, 54, 109], night)),
    horizon: rgbString(mixRgb(eveningHorizon, [91, 75, 137], night)),
    ground: rgbString(mixRgb(eveningGround, [36, 97, 59], night)),
    grass: rgbString(mixRgb(eveningGrass, [28, 78, 53], night)),
    cloud: mixRgba([255, 255, 255, 0.82], [170, 178, 220, 0.68], night),
  };
}

function drawSunAndMoon(colors) {
  const progress = colors.progress;
  const sunset = smoothStep(0.08, 0.68, progress);
  const night = smoothStep(0.56, 1, progress);

  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - night * 1.25);
  ctx.fillStyle = "#fff2a8";
  ctx.beginPath();
  ctx.arc(730 - sunset * 260, 100 + sunset * 160, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = night;
  ctx.fillStyle = "#fff7cf";
  ctx.beginPath();
  ctx.arc(690, 98, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.skyTop;
  ctx.beginPath();
  ctx.arc(704, 88, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNightStars(progress) {
  const night = smoothStep(0.62, 1, progress);
  if (night <= 0) {
    return;
  }

  const points = [
    [86, 78, 2],
    [242, 54, 1.6],
    [354, 112, 1.9],
    [522, 72, 1.4],
    [806, 145, 2.1],
    [612, 180, 1.5],
  ];

  ctx.save();
  ctx.globalAlpha = night * 0.9;
  ctx.fillStyle = "#fff9d7";
  points.forEach((point) => {
    const x = point[0];
    const y = point[1];
    const r = point[2];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawFeverSky() {
  if (!isFeverActive()) {
    return;
  }

  const pulse = 0.5 + Math.sin(worldTime / 120) * 0.5;
  const colors = ["#ff6bd6", "#fff6a8", "#74f2ff", "#8d3cff", "#7dff92"];

  ctx.save();
  ctx.globalAlpha = 0.16 + pulse * 0.08;
  for (let i = 0; i < colors.length; i += 1) {
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(W * 0.5, -40);
    ctx.lineTo(i * 190 - 120 + pulse * 35, H);
    ctx.lineTo(i * 190 + 120 + pulse * 35, H);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fffef4";
  for (let i = 0; i < 16; i += 1) {
    const x = (i * 143 + worldTime * 0.08) % (W + 80) - 40;
    const y = 34 + ((i * 67 + worldTime * 0.05) % 220);
    drawStar(x, y, 7 + (i % 3) * 2, worldTime / 250 + i, "#fffef4", "#fff6a8");
  }
  ctx.restore();
}

function smoothStep(edge0, edge1, value) {
  const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return x * x * (3 - 2 * x);
}

function mixRgb(from, to, amount) {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ];
}

function rgbString(color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function mixRgba(from, to, amount) {
  const r = Math.round(from[0] + (to[0] - from[0]) * amount);
  const g = Math.round(from[1] + (to[1] - from[1]) * amount);
  const b = Math.round(from[2] + (to[2] - from[2]) * amount);
  const a = from[3] + (to[3] - from[3]) * amount;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function drawStar(x, y, r, rotation, fill, stroke) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
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

function drawFeverHud() {
  if (!isFeverActive()) {
    return;
  }

  const seconds = Math.ceil(feverTimer / 1000);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 34px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#8d3cff";
  ctx.fillStyle = "#fff6a8";
  ctx.strokeText(`FEVER ${seconds}`, W / 2, 64);
  ctx.fillText(`FEVER ${seconds}`, W / 2, 64);

  const barW = 260;
  const barH = 10;
  const progress = feverTimer / 6000;
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  drawRoundRect(W / 2 - barW / 2, 92, barW, barH, 5);
  ctx.fill();
  ctx.fillStyle = "#ff6bd6";
  ctx.beginPath();
  drawRoundRect(W / 2 - barW / 2, 92, barW * progress, barH, 5);
  ctx.fill();
  ctx.restore();
}

function drawScorePops() {
  scorePops.forEach((pop) => {
    pop.age += 1;
    const progress = pop.age / 42;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.fillStyle = "#fffef4";
    ctx.strokeStyle = pop.color;
    ctx.lineWidth = 5;
    ctx.font = "800 32px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(pop.text || `+${pop.points}`, pop.x, pop.y - progress * 42);
    ctx.fillText(pop.text || `+${pop.points}`, pop.x, pop.y - progress * 42);
    ctx.restore();
  });

  scorePops = scorePops.filter((pop) => pop.age < 42);
}

function drawBestPops() {
  bestPops.forEach((pop) => {
    pop.age += 1;
    const progress = pop.age / 72;
    const scale = 1 + Math.sin(progress * Math.PI) * 0.22;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.translate(pop.x, pop.y - progress * 64);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#fff6a8";
    ctx.strokeStyle = "#e85d75";
    ctx.lineWidth = 7;
    ctx.font = "900 42px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("BEST!", 0, 0);
    ctx.fillText("BEST!", 0, 0);
    ctx.restore();
  });

  bestPops = bestPops.filter((pop) => pop.age < 72);
}

function drawBestFlash() {
  if (bestFlash <= 0) {
    return;
  }

  const alpha = bestFlash / 22;
  ctx.save();
  ctx.globalAlpha = alpha * 0.32;
  ctx.fillStyle = "#fff6a8";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  bestFlash -= 1;
}

function celebrateBestScore(x, y) {
  bestPops.push({ x, y: y - 26, age: 0 });
  bestFlash = 22;
  playBestSound();
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function unlockAudio() {
  const audio = getAudioContext();
  if (audio && audio.state === "suspended") {
    audio.resume();
  }
}

function startMusic() {
  stopMusic();
  const gain = getMusicGain();
  if (gain) {
    gain.gain.setValueAtTime(0.2, getAudioContext().currentTime);
  }
  musicStep = 0;
  musicTheme = getMusicThemeName();
  scheduleMusicBar();
  musicTimer = setInterval(scheduleMusicBar, 1920);
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = undefined;
  }
  const gain = getMusicGain();
  if (gain) {
    gain.gain.setValueAtTime(0, getAudioContext().currentTime);
  }
}

function scheduleMusicBar() {
  if (!running) {
    return;
  }

  const nextTheme = getMusicThemeName();
  if (nextTheme !== musicTheme) {
    musicTheme = nextTheme;
    musicStep = 0;
  }

  const theme = musicThemes[musicTheme];
  for (let i = 0; i < 8; i += 1) {
    const step = musicStep + i;
    const start = i * 0.24;
    playMusicTone(theme.melody[step % theme.melody.length], start, 0.16, theme.leadType, theme.leadVolume);
    if (i % 2 === 0) {
      playMusicTone(theme.bass[Math.floor(step / 2) % theme.bass.length], start, 0.22, theme.bassType, theme.bassVolume);
    }
    if (i % 4 === 0) {
      playMusicTone(
        theme.harmony[Math.floor(step / 4) % theme.harmony.length],
        start + 0.04,
        0.5,
        "sine",
        theme.harmonyVolume,
      );
    }
  }
  musicStep += 8;
}

function getMusicThemeName() {
  const progress = Math.min(worldTime / 45000, 1);
  return progress >= 0.62 ? "night" : "day";
}

function getMusicGain() {
  const audio = getAudioContext();
  if (!audio) {
    return null;
  }

  if (!musicGain) {
    musicGain = audio.createGain();
    musicGain.gain.setValueAtTime(0, audio.currentTime);
    musicGain.connect(audio.destination);
  }

  return musicGain;
}

function playMusicTone(frequency, start, duration, type, volume) {
  const audio = getAudioContext();
  const gain = getMusicGain();
  if (!audio || !gain) {
    return;
  }

  const oscillator = audio.createOscillator();
  const noteGain = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime + start);
  noteGain.gain.setValueAtTime(0, audio.currentTime + start);
  noteGain.gain.linearRampToValueAtTime(volume, audio.currentTime + start + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + duration);

  oscillator.connect(noteGain);
  noteGain.connect(gain);
  oscillator.start(audio.currentTime + start);
  oscillator.stop(audio.currentTime + start + duration);
}

function playTone(frequency, start, duration, type, volume) {
  const audio = getAudioContext();
  if (!audio) {
    return;
  }

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audio.currentTime + start);
  gain.gain.setValueAtTime(0, audio.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + duration);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(audio.currentTime + start);
  oscillator.stop(audio.currentTime + start + duration);
}

function playCollectSound(points) {
  if (points >= 5) {
    playTone(660, 0, 0.08, "sine", 0.13);
    playTone(990, 0.06, 0.1, "sine", 0.12);
    playTone(1480, 0.14, 0.18, "sine", 0.11);
    return;
  }

  if (points >= 2) {
    playTone(660, 0, 0.09, "sine", 0.12);
    playTone(1100, 0.07, 0.14, "sine", 0.1);
    return;
  }

  playTone(660, 0, 0.09, "sine", 0.12);
  playTone(990, 0.06, 0.12, "sine", 0.1);
}

function playBestSound() {
  playTone(660, 0, 0.08, "sine", 0.13);
  playTone(880, 0.07, 0.1, "sine", 0.12);
  playTone(1320, 0.16, 0.18, "sine", 0.11);
}

function playFeverSound() {
  playTone(523, 0, 0.08, "triangle", 0.13);
  playTone(659, 0.07, 0.08, "triangle", 0.12);
  playTone(784, 0.14, 0.1, "triangle", 0.12);
  playTone(1046, 0.24, 0.18, "sine", 0.11);
}

function playDamageSound() {
  playTone(330, 0, 0.1, "sawtooth", 0.09);
  playTone(220, 0.08, 0.16, "sawtooth", 0.075);
}

function playGameOverSound() {
  playTone(220, 0, 0.18, "triangle", 0.12);
  playTone(146, 0.14, 0.24, "triangle", 0.1);
}
