let pMapper;
let quadMap1;
let quadMap2;
let quadMapW;

let pg1;
let pg2;
let pgW;

let r = 0;

// Particle system for pg2
// Matter.js variables
let Engine, World, Bodies, Body;
let engine, world;
let ellipses = [];
let ground;
let spawnInterval = 20;
let lastSpawnFrame = 0;

let waitingEllipses = [];

function spawnWaitingEllipse() {
  // Spawn at bottom of pgW, random x
  let radius = random(4, 10);
  let x = random(radius, pgW.width - radius);
  let y = pgW.height - radius;
  let col = [random(255), random(255), random(255), 180];
  waitingEllipses.push({ x, y, radius, col, phase: 'pgW' });
}

function transferEllipseToPg1(waitingEllipse) {
  // Start transition animation from top of pgW to bottom of pg1
  waitingEllipse.phase = 'transition';
  waitingEllipse.t = 0; // progress for animation
}

function finalizeEllipseInPg1(waitingEllipse) {
  // Map x from pgW to pg1, y to bottom of pg1
  let mappedX = map(waitingEllipse.x, 0, pgW.width, 0, pg1.width);
  let mappedY = pg1.height - waitingEllipse.radius;
  let body = Bodies.circle(mappedX, mappedY, waitingEllipse.radius, {
    restitution: 0.5,
    friction: 0.1,
    density: 0.001
  });
  ellipses.push({ body, radius: waitingEllipse.radius, col: waitingEllipse.col });
  World.add(world, body);
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
  pg2 = createGraphics(850, 550);
  pgW = createGraphics(10, 270);

  // Matter.js setup
  Engine = Matter.Engine;
  World = Matter.World;
  Bodies = Matter.Bodies;
  Body = Matter.Body;
  engine = Engine.create();
  world = engine.world;
  // ground at bottom of pg1
  ground = Bodies.rectangle(pg1.width / 2, pg1.height + 20, pg1.width, 40, { isStatic: true });
  World.add(world, ground);
}

function draw() {
  background(0);

  r = abs(sin(frameCount * 0.01) * 100);
  pg1.background(255, 0, 0);
  pg1.fill(0);
  pg1.circle(pg1.width / 2, pg1.height / 2, 2 * r);

  pg2.background(0, 0, 255);
  pg2.fill(255);
  pg2.rectMode(CENTER);
  pg2.rect(pg2.width / 2 , pg2.height / 2, 100,100);

  // Physics update
  Engine.update(engine);

  // Spawn new waiting ellipses at bottom of pgW
  if (frameCount - lastSpawnFrame > spawnInterval) {
    spawnWaitingEllipse();
    lastSpawnFrame = frameCount;
  }

  // Animate waiting ellipses
  pgW.noStroke();
  for (let i = waitingEllipses.length - 1; i >= 0; i--) {
    let e = waitingEllipses[i];
    if (e.phase === 'pgW') {
      // Move up through pgW
      pgW.fill(...e.col);
      pgW.ellipse(e.x, e.y, e.radius * 2, e.radius * 2);
      e.y -= 2;
      if (e.y <= e.radius) {
        // Start transition to pg1
        transferEllipseToPg1(e);
      }
    } else if (e.phase === 'transition') {
      // Animate from top of pgW to bottom of pg1
      // Map x from pgW to pg1
      let mappedX = map(e.x, 0, pgW.width, 0, pg1.width);
      let startY = e.radius;
      let endY = pg1.height - e.radius;
      // Animate t from 0 to 1
      e.t += 0.05;
      let currentY = lerp(startY, endY, e.t);
      pg1.fill(...e.col);
      pg1.ellipse(mappedX, currentY, e.radius * 2, e.radius * 2);
      if (e.t >= 1) {
        // Finalize in pg1 with physics
        finalizeEllipseInPg1(e);
        waitingEllipses.splice(i, 1);
      }
    }
  }

  // Draw ellipses in pg1 (physics bodies)
  pg1.noStroke();
  for (let e of ellipses) {
    let pos = e.body.position;
    pg1.fill(...e.col);
    pg1.ellipse(pos.x, pos.y, e.radius * 2, e.radius * 2);
  }

  quadMap1.displayTexture(pg1);
  quadMap2.displayTexture(pg2);
  quadMapW.displayTexture(pgW);
}

function keyPressed() {
  if (key === "c") {
    pMapper.toggleCalibration();
  } else if (key === "f") {
    fullscreen(true);
  } else if (key === "w") {
    fullscreen(false);
  } else if (key === "l") {
    pMapper.load("maps/map.json");
  } else if (key === "s") {
    pMapper.save("map.json");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
