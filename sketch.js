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
let spawnInterval = 5; // spawn more frequently
let lastSpawnFrame = 0;

let waitingEllipses = [];

function spawnWaitingEllipse() {
  // Spawn at top of pgW, random x
  let radius = random(10, 30); // bigger ellipses
  let x = random(radius, pgW.width - radius);
  let y = radius;
  let col = [random(255), random(255), random(255), 180];
  waitingEllipses.push({ x, y, radius, col });
}

function transferEllipseToPg1(waitingEllipse) {
  // Start transition animation from bottom of pgW to top of pg1
  waitingEllipse.phase = 'transition';
  waitingEllipse.t = 0; // progress for animation
}

function finalizeEllipseInPg1(waitingEllipse) {
  // Always enter at upper left corner of pg1
  let mappedX = waitingEllipse.radius;
  let mappedY = waitingEllipse.radius;
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

  // Spawn new waiting ellipses at top of pgW
  if (frameCount - lastSpawnFrame > spawnInterval) {
    spawnWaitingEllipse();
    lastSpawnFrame = frameCount;
  }

  // Animate waiting ellipses moving down through pgW
  pgW.noStroke();
  for (let i = waitingEllipses.length - 1; i >= 0; i--) {
    let e = waitingEllipses[i];
    pgW.fill(...e.col);
    pgW.ellipse(e.x, e.y, e.radius * 2, e.radius * 2);
    e.y += 2;
    if (e.y >= pgW.height - e.radius) {
      // Enter pg1 at upper left corner and fall down
      finalizeEllipseInPg1(e);
      waitingEllipses.splice(i, 1);
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
