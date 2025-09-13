let pMapper;
let quadMap1;
let quadMap2;
let quadMapW;

let pg1;
let pg2;
let pgW;

let angle = 0;
let r = 0;

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

  pgW.background(0, 255, 0);
  pgW.fill(255);
  pgW.rectMode(CENTER);
  pgW.rect(pgW.width / 2 , pgW.height / 2, 100,100);

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
