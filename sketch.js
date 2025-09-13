let pMapper;
let quadMap1;
let quadMap2;

let pg1;
let pg2;

let r = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  // create mapper object
  pMapper = createProjectionMapper(this);
  quadMap1 = pMapper.createQuadMap(600, 800);
  quadMap2 = pMapper.createQuadMap(800, 600);

  pMapper.load("maps/map.json");

  pg1 = createGraphics(600, 800);
  pg2 = createGraphics(800, 600);
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

  
  quadMap1.displayTexture(pg1);
  quadMap2.displayTexture(pg2);


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
