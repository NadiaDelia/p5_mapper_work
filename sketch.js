let pMapper;
let quadMap1;
let quadMap2;
let quadMapW;

let pg1;
let pg2;
let pgW;

// Tanks: bottom-up fill levels [0..1]
let waterLevel1 = 0;
let waterLevel2 = 0;
// Shared target level so both tanks fill at the same rate
let targetLevel = 0;

// Control: press-and-hold 'W' to pour
let isPouring = false;

// Explosion effects when full
let exploded = false;
let explosion1 = [];
let explosion2 = [];
let rings1 = [];
let rings2 = [];
let flashAlpha = 0;
let draining = false;
let celebration = false;

// Extra explosion layers
let jets1 = [];
let jets2 = [];
let mist1 = [];
let mist2 = [];

// Particle stream in the small inlet (pgW)
let inletParticles = [];
let spawnInterval = 2; // faster stream
let lastSpawnFrame = 0;

// Streams inside the big tanks (visual falling droplets)
let stream1 = [];
let stream2 = [];

// Visual params
// Palette (blue, purple, cyan)
const deepPurple = [45, 25, 85];
const oceanBlue = [25, 70, 160];
const midBlue = [20, 120, 220];
const lightCyan = [120, 220, 255];
const foam = [240, 250, 255];

function spawnInletParticle() {
  // Spawn near top of pgW; bigger and slower
  const r = random(3.5, 4.8); // larger but still fits within 10px width
  const x = random(r, pgW.width - r);
  const y = r + 1;
  const vy = random(3.5, 6.0); // slower initial speed
  const ax = 0;
  const ay = random(0.25, 0.4); // gentler gravity
  inletParticles.push({ x, y, vx: 0.0, vy, ax, ay, r });
}

function pushStreamsIntoTanks() {
  // Create decorative falling droplets in each tank at their inlets
  const count = 1 + floor(random(1, 2));
  for (let i = 0; i < count; i++) {
    // Tank 1 inlet near top-left (relative positioning)
    stream1.push({
  x: pg1.width * 0.055 + random(-4, 4),
  y: pg1.height * 0.006 + random(0, 8),
      vx: random(-0.15, 0.15),
      vy: random(3.0, 6.0),
  r: random(3.5, 5.5),
      life: 1.0
    });
    // Tank 2 inlet near top-left (relative positioning)
    stream2.push({
  x: pg2.width * 0.055 + random(-4, 4),
  y: pg2.height * 0.006 + random(0, 8),
      vx: random(-0.15, 0.15),
      vy: random(3.0, 6.0),
  r: random(3.5, 5.5),
      life: 1.0
    });
  }
}

function drawGradientV(g, y0, y1, cTop, cBottom, alpha = 255) {
  g.noStroke();
  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / max(1, (y1 - y0));
    const r = lerp(cTop[0], cBottom[0], t);
    const gC = lerp(cTop[1], cBottom[1], t);
    const b = lerp(cTop[2], cBottom[2], t);
    g.fill(r, gC, b, alpha);
    g.rect(0, y, g.width, 1);
  }
}

function drawWaterTank(g, level, streams, opts = {}) {
  const { addGlow = true } = opts;
  g.clear();
  g.background(8, 10, 18);

  // Container border
  g.noFill();
  g.stroke(60, 90, 160);
  g.strokeWeight(2);
  g.rect(2, 2, g.width - 4, g.height - 4, 10);

  // Water surface Y (0 at top) — computed by normalized level so it stays consistent
  const surfaceY = g.height * (1 - constrain(level, 0, 1));

  // Draw streams above water line and their mirrored reflections
  g.noStroke();
  for (let i = streams.length - 1; i >= 0; i--) {
    const d = streams[i];
    // update
    d.vy += 0.28; // slower fall
    d.x += d.vx;
    d.y += d.vy;
    // draw droplet above surface
  const alpha = 220;
  // glow halo
  g.noStroke();
  g.fill(150, 230, 255, 110);
  g.ellipse(d.x, d.y, d.r * 3.2, d.r * 2.5);
  // core colors
  const huePick = (i % 3);
  if (huePick === 0) g.fill(lightCyan[0], lightCyan[1], lightCyan[2], alpha);
  else if (huePick === 1) g.fill(midBlue[0], midBlue[1], midBlue[2], alpha);
  else g.fill(190, 140, 255, alpha); // brighter purple
  g.ellipse(d.x, d.y, d.r * 2.2, d.r * 2.2);
    // reflection if above water
    if (d.y < surfaceY) {
      const ry = surfaceY + (surfaceY - d.y) + sin((frameCount + d.x) * 0.15) * 2.0;
      const rx = d.x + sin((frameCount + d.y) * 0.1) * 1.5;
  g.fill(200, 230, 255, 90);
  g.ellipse(rx, ry, d.r * 2.6, d.r * 1.9);
    }
    // remove when hits water
    if (d.y >= surfaceY - d.r * 0.5) {
      streams.splice(i, 1);
    }
  }

  // Water fill (bottom -> surface)
  const waveAmp = 6;
  const waveLen = 50;
  const time = frameCount * 0.05;
  // Gradient body: cyan/blue near surface -> deep purple at bottom
  const topWater = [90, 170, 245];
  drawGradientV(g, floor(surfaceY), g.height, topWater, deepPurple, 225);
  // Surface foam line with subtle waves
  g.noFill();
  g.stroke(210, 235, 255, 230);
  g.strokeWeight(2);
  g.beginShape();
  for (let x = 0; x <= g.width; x += 8) {
    const y = surfaceY + sin((x + time * 20) / waveLen) * waveAmp * 0.6 + noise(x * 0.01, time * 0.1) * 2.0;
    g.vertex(x, y);
  }
  g.endShape();

  // Soft caustics near surface
  if (addGlow) {
    g.blendMode(ADD);
    for (let i = 0; i < 30; i++) {
      const x = (i / 30) * g.width + sin((time + i) * 0.8) * 10;
      const y = surfaceY + sin((time + i) * 1.2) * 4;
      const a = 20;
      g.noStroke();
      // alternate cyan/purple glow for colorfulness
      if (i % 2 === 0) g.fill(130, 210, 255, a);
      else g.fill(170, 120, 240, a * 0.9);
      g.ellipse(x, y, 24, 10);
    }
    g.blendMode(BLEND);
  }
}

function spawnExplosion(gWidth, gHeight, level, particleArr, ringArr) {
  // Origin at water surface center
  const origin = { x: gWidth * 0.5, y: gHeight * (1 - constrain(level, 0, 1)) };
  // Confetti/sparkle particles
  const N = 160;
  for (let i = 0; i < N; i++) {
    const ang = random(TWO_PI);
    const spd = random(2.5, 8.0);
    const vx = cos(ang) * spd;
    const vy = sin(ang) * spd - random(0.5, 2.5);
    const size = random(2.5, 5.0);
    const colPick = i % 4;
    let col;
    if (colPick === 0) col = [150, 230, 255];
    else if (colPick === 1) col = [200, 150, 255];
    else if (colPick === 2) col = [120, 210, 255];
    else col = [255, 255, 255];
    particleArr.push({
      x: origin.x + random(-6, 6),
      y: origin.y + random(-4, 4),
      vx, vy,
      ax: 0,
      ay: 0.22,
      life: 1.0,
      size,
      col,
      rot: random(TWO_PI),
      vr: random(-0.2, 0.2),
      shape: random() < 0.5 ? 'circle' : 'rect'
    });
  }
  // Expanding rings/waves
  for (let i = 0; i < 3; i++) {
    ringArr.push({ x: origin.x, y: origin.y, r: 6 + i * 10, w: 2, a: 255, vr: 6 + i * 2 });
  }
  // Screen flash
  flashAlpha = 200;

  // Upward water jets
  for (let i = 0; i < 40; i++) {
    const ang = random(-PI * 0.85, -PI * 0.15);
    const spd = random(6, 14);
    const vx = cos(ang) * spd * 0.6;
    const vy = sin(ang) * spd;
    const size = random(2.5, 4.0);
    const c = random() < 0.5 ? [140, 220, 255] : [190, 140, 255];
    jets1.push({ x: origin.x, y: origin.y, vx, vy, ay: 0.35, size, col: c, life: 1.0 });
  }
  for (let i = 0; i < 40; i++) {
    const ang = random(-PI * 0.85, -PI * 0.15);
    const spd = random(6, 14);
    const vx = cos(ang) * spd * 0.6;
    const vy = sin(ang) * spd;
    const size = random(2.5, 4.0);
    const c = random() < 0.5 ? [140, 220, 255] : [190, 140, 255];
    jets2.push({ x: origin.x, y: origin.y, vx, vy, ay: 0.35, size, col: c, life: 1.0 });
  }
  // Fine mist
  for (let i = 0; i < 120; i++) {
    const ang = random(TWO_PI);
    const spd = random(0.8, 3);
    const vx = cos(ang) * spd;
    const vy = sin(ang) * spd - random(0.2, 0.8);
    const size = random(0.8, 1.6);
    const c = [200, 240, 255];
    mist1.push({ x: origin.x, y: origin.y, vx, vy, ay: 0.15, size, col: c, life: 0.9 });
  }
  for (let i = 0; i < 120; i++) {
    const ang = random(TWO_PI);
    const spd = random(0.8, 3);
    const vx = cos(ang) * spd;
    const vy = sin(ang) * spd - random(0.2, 0.8);
    const size = random(0.8, 1.6);
    const c = [200, 240, 255];
    mist2.push({ x: origin.x, y: origin.y, vx, vy, ay: 0.15, size, col: c, life: 0.9 });
  }
}

function drawExplosionLayer(g, particleArr, ringArr) {
  // Rings
  g.push();
  g.noFill();
  g.stroke(200, 230, 255, 180);
  for (let i = ringArr.length - 1; i >= 0; i--) {
    const r = ringArr[i];
    g.stroke(200, 230, 255, r.a);
    g.strokeWeight(r.w);
    g.ellipse(r.x, r.y, r.r * 2, r.r * 2);
    r.r += r.vr;
    r.a -= 6;
    r.w = max(0.8, r.w * 0.98);
    if (r.a <= 0) ringArr.splice(i, 1);
  }
  g.pop();

  // Particles (additive glow)
  g.push();
  g.blendMode(ADD);
  for (let i = particleArr.length - 1; i >= 0; i--) {
    const p = particleArr[i];
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.vy += p.ay;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 0.012;
    const a = constrain(p.life, 0, 1) * 255;
    // halo
    g.noStroke();
    g.fill(p.col[0], p.col[1], p.col[2], a * 0.45);
    g.ellipse(p.x, p.y, p.size * 3, p.size * 2.4);
    // core
    g.fill(p.col[0], p.col[1], p.col[2], a);
    if (p.shape === 'circle') {
      g.ellipse(p.x, p.y, p.size * 1.8, p.size * 1.8);
    } else {
      g.push();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.rectMode(CENTER);
      g.rect(0, 0, p.size * 1.6, p.size * 1.1, 2);
      g.pop();
    }
    if (p.life <= 0) particleArr.splice(i, 1);
  }
  g.blendMode(BLEND);
  g.pop();

  // Flash layer (subtle per tank)
  if (flashAlpha > 0) {
    g.noStroke();
    g.fill(255, 255, 255, flashAlpha * 0.5);
    g.rect(0, 0, g.width, g.height);
  }
}

function drawJetsAndMist(g, jets, mist) {
  g.push();
  g.blendMode(ADD);
  // Jets (larger bright droplets)
  for (let i = jets.length - 1; i >= 0; i--) {
    const p = jets[i];
    p.vx *= 0.995;
    p.vy *= 0.995;
    p.vy += p.ay;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.01;
    const a = max(0, p.life) * 255;
    g.noStroke();
    g.fill(p.col[0], p.col[1], p.col[2], a * 0.45);
    g.ellipse(p.x, p.y, p.size * 3.0, p.size * 2.4);
    g.fill(p.col[0], p.col[1], p.col[2], a);
    g.ellipse(p.x, p.y, p.size * 1.9, p.size * 1.9);
    if (p.life <= 0) jets.splice(i, 1);
  }
  // Mist (fine particles)
  for (let i = mist.length - 1; i >= 0; i--) {
    const p = mist[i];
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.vy += p.ay;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.008;
    const a = max(0, p.life) * 255;
    g.noStroke();
    g.fill(p.col[0], p.col[1], p.col[2], a * 0.35);
    g.ellipse(p.x, p.y, p.size * 3.2, p.size * 2.5);
    g.fill(p.col[0], p.col[1], p.col[2], a);
    g.ellipse(p.x, p.y, p.size * 1.2, p.size * 1.2);
    if (p.life <= 0) mist.splice(i, 1);
  }
  g.blendMode(BLEND);
  g.pop();
}

function drawCelebration(g, t) {
  // Colorful swirling ribbons and confetti
  const w = g.width, h = g.height;
  g.push();
  g.blendMode(ADD);
  // Ribbons
  for (let k = 0; k < 4; k++) {
    const phase = t * 0.02 + k * 0.8;
    g.noFill();
    const col = k % 2 === 0 ? [140, 220, 255] : [190, 140, 255];
    g.stroke(col[0], col[1], col[2], 140);
    g.strokeWeight(2.2);
    g.beginShape();
    for (let x = 0; x <= w; x += 10) {
      const y = h * 0.35 + sin((x * 0.015) + phase) * 40 + sin((x * 0.05) + phase * 2) * 15;
      g.vertex(x, y);
    }
    g.endShape();
  }
  // Floating colorful orbs
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TWO_PI + t * 0.01;
    const r = 80 + sin(t * 0.02 + i) * 20;
    const x = w * 0.5 + cos(a) * r;
    const y = h * 0.35 + sin(a * 1.3) * (r * 0.35);
    const col = i % 3 === 0 ? [140, 220, 255] : i % 3 === 1 ? [200, 150, 255] : [120, 210, 255];
    g.noStroke();
    g.fill(col[0], col[1], col[2], 90);
    g.ellipse(x, y, 18, 18);
    g.fill(col[0], col[1], col[2], 180);
    g.ellipse(x, y, 10, 10);
  }
  g.blendMode(BLEND);
  g.pop();
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  // create mapper object
  pMapper = createProjectionMapper(this);
  quadMap1 = pMapper.createQuadMap(550, 850);
  quadMap2 = pMapper.createQuadMap(550, 850);
  quadMapW = pMapper.createQuadMap(10, 270);

  pMapper.load("maps/map.json");

  pg1 = createGraphics(550, 850);
  // Match pg2 to the same dimensions as quadMap2 (and pg1) so fills sync visually
  pg2 = createGraphics(550, 850);
  pgW = createGraphics(10, 270);

  // High-DPI rendering for crisper visuals
  try { pixelDensity(Math.max(2, displayDensity())); } catch (e) { /* ignore */ }
}

function draw() {
  background(0);

  // 1) Inlet: spawn and update particles in pgW
  if (isPouring && targetLevel < 1 && frameCount - lastSpawnFrame > spawnInterval) {
    spawnInletParticle();
    lastSpawnFrame = frameCount;
  }

  pgW.clear();
  // Nice vertical glow gradient in inlet
  drawGradientV(pgW, 0, pgW.height, [35, 20, 70], [20, 35, 90], 255); // purple-blue
  pgW.blendMode(ADD);
  for (let i = inletParticles.length - 1; i >= 0; i--) {
    const p = inletParticles[i];
    p.vx += p.ax;
    p.vy += p.ay;
    p.x += p.vx;
    p.y += p.vy;
    // draw streak
    pgW.noStroke();
  // glow halo
  if (i % 2 === 0) pgW.fill(140, 220, 255, 120); else pgW.fill(190, 140, 255, 110);
  pgW.ellipse(p.x, p.y, p.r * 3.0, p.r * 2.2);
  // core droplet (alternating cyan/purple)
  if (i % 2 === 0) pgW.fill(140, 220, 255, 220); else pgW.fill(190, 140, 255, 210);
  pgW.ellipse(p.x, p.y, p.r * 1.9, p.r * 1.9);
  // small trail highlight
  pgW.fill(120, 180, 255, 160);
  pgW.ellipse(p.x, p.y - p.vy * 0.35, p.r * 0.8, p.r * 0.8);
    // bottom reached -> feed tanks
    if (p.y >= pgW.height - p.r) {
      inletParticles.splice(i, 1);
      // each droplet adds a bit of volume
      targetLevel = min(1, targetLevel + 0.0011); // shared target so both fill identically
      pushStreamsIntoTanks();
    }
  }
  pgW.blendMode(BLEND);

  // 2) Update tank levels with easing (bottom-up fill)
  const k = 0.02; // easing factor
  waterLevel1 += (targetLevel - waterLevel1) * k;
  waterLevel2 += (targetLevel - waterLevel2) * k;
  waterLevel1 = min(1, waterLevel1);
  waterLevel2 = min(1, waterLevel2);

  // Trigger explosion once both tanks are full
  if (!exploded && waterLevel1 >= 0.995 && waterLevel2 >= 0.995) {
    exploded = true;
    isPouring = false; // stop pouring
    // spawn per-tank explosions at their water surfaces
    spawnExplosion(pg1.width, pg1.height, waterLevel1, explosion1, rings1);
    spawnExplosion(pg2.width, pg2.height, waterLevel2, explosion2, rings2);
    // start draining after a brief moment
    draining = true;
  }

  // Draining phase: quickly lower levels to zero, then celebration
  if (draining) {
    targetLevel = max(0, targetLevel - 0.03);
    if (waterLevel1 <= 0.01 && waterLevel2 <= 0.01 && targetLevel <= 0.01) {
      draining = false;
      celebration = true;
    }
  }

  // 3) Draw tanks with water, streams, and reflections
  drawWaterTank(pg1, waterLevel1, stream1, { addGlow: true });
  drawWaterTank(pg2, waterLevel2, stream2, { addGlow: true });

  // 3.1) Explosion overlays and flash decay
  drawExplosionLayer(pg1, explosion1, rings1);
  drawExplosionLayer(pg2, explosion2, rings2);
  drawJetsAndMist(pg1, jets1, mist1);
  drawJetsAndMist(pg2, jets2, mist2);
  if (flashAlpha > 0) flashAlpha = max(0, flashAlpha - 8);

  // 3.2) Celebration visuals after drain completes
  if (celebration) {
    drawCelebration(pg1, frameCount);
    drawCelebration(pg2, frameCount);
  }

  // 4) Display textures on mapped quads
  quadMap1.displayTexture(pg1);
  quadMap2.displayTexture(pg2);
  quadMapW.displayTexture(pgW);
}

function keyPressed() {
  if (key === "c") {
    pMapper.toggleCalibration();
  } else if (key === "f") {
    fullscreen(true);
  } else if (key === "l") {
    pMapper.load("maps/map.json");
  } else if (key === "s") {
    pMapper.save("map.json");
  } 
  // Start pouring while 'W' (or 'w') is held down
  if (key === "W" || key === "w") {
    if (!exploded && targetLevel < 1) isPouring = true;
  }
  // Reset (drain) with 'R'
  if (key === "R" || key === "r") {
    resetAll();
  }
}

function keyReleased() {
  if (key === "W" || key === "w") {
    isPouring = false;
  }
}

function resetAll() {
  isPouring = false;
  exploded = false;
  flashAlpha = 0;
  draining = false;
  celebration = false;
  targetLevel = 0;
  waterLevel1 = 0;
  waterLevel2 = 0;
  inletParticles.length = 0;
  stream1.length = 0;
  stream2.length = 0;
  explosion1.length = 0;
  explosion2.length = 0;
  rings1.length = 0;
  rings2.length = 0;
  jets1.length = 0;
  jets2.length = 0;
  mist1.length = 0;
  mist2.length = 0;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
