// ===== VARIÁVEIS GERAIS =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const endButton = document.getElementById("endButton");
const tileSize = 20;
const rows = 17;
const cols = 19;

canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

let jogoRodando = false;
let pausado = false;
let lastTime = 0;
let ultimasPosicoesPredador = [];
const MAX_MEMORIA_PREDADOR = 5;

// ===== MENSAGEM VISUAL =====
const mensagem = document.createElement("div");
mensagem.style.position = "absolute";
mensagem.style.top = "50%";
mensagem.style.left = "50%";
mensagem.style.transform = "translate(-50%, -50%)";
mensagem.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
mensagem.style.color = "#fff";
mensagem.style.padding = "20px 40px";
mensagem.style.borderRadius = "10px";
mensagem.style.fontSize = "24px";
mensagem.style.fontFamily = "Poppins, sans-serif";
mensagem.style.zIndex = 999;
mensagem.style.display = "none";
document.body.appendChild(mensagem);

function exibirMensagem(texto) {
  mensagem.textContent = texto;
  mensagem.style.display = "block";
}

// ===== MAPA DO JOGO =====
const map = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

let pacman = { x: 1, y: 1, dx: 0, dy: 0, direction: "right" };
let predador = { x: cols - 2, y: rows - 2, dx: 0, dy: -1, direction: "up" };
let moedas = [];

function criarMoedas() {
  moedas = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (map[y][x] === 1) {
        moedas.push({ x, y });
      }
    }
  }
}

function updatePredador() {
  const direcoes = [
    { dx: 0, dy: -1, direction: "up" },
    { dx: 0, dy: 1, direction: "down" },
    { dx: -1, dy: 0, direction: "left" },
    { dx: 1, dy: 0, direction: "right" },
  ];

  const opcoes = [];

  for (const dir of direcoes) {
    const nx = predador.x + dir.dx;
    const ny = predador.y + dir.dy;
    const destino = `${nx},${ny}`;

    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && map[ny][nx] === 1) {
      const distancia = Math.abs(pacman.x - nx) + Math.abs(pacman.y - ny);

      let penalidade = 0;
      for (let i = 0; i < ultimasPosicoesPredador.length; i++) {
        if (ultimasPosicoesPredador[i] === destino) {
          penalidade += (ultimasPosicoesPredador.length - i) * 2;
        }
      }

      const pontuacao = distancia + penalidade;

      opcoes.push({ ...dir, nx, ny, distancia, pontuacao });
    }
  }

  if (opcoes.length > 0) {
    opcoes.sort((a, b) => a.pontuacao - b.pontuacao);
    const melhor = opcoes[0];

    const posicaoAtual = `${predador.x},${predador.y}`;
    ultimasPosicoesPredador.unshift(posicaoAtual);
    if (ultimasPosicoesPredador.length > MAX_MEMORIA_PREDADOR) {
      ultimasPosicoesPredador.pop();
    }

    predador.x = melhor.nx;
    predador.y = melhor.ny;
    predador.dx = melhor.dx;
    predador.dy = melhor.dy;
    predador.direction = melhor.direction;
  }

  if (predador.x === pacman.x && predador.y === pacman.y) {
    jogoRodando = false;
    exibirMensagem("Você foi capturado!");
    draw();
  }
}

function update() {
  const nextX = pacman.x + pacman.dx;
  const nextY = pacman.y + pacman.dy;

  if (
    nextX >= 0 &&
    nextX < cols &&
    nextY >= 0 &&
    nextY < rows &&
    map[nextY][nextX] === 1
  ) {
    pacman.x = nextX;
    pacman.y = nextY;
    moedas = moedas.filter((m) => m.x !== pacman.x || m.y !== pacman.y);
  }

  if (moedas.length === 0) {
    jogoRodando = false;
    exibirMensagem("🎉 Congratulations! Você venceu o jogo! 🎉");
    draw();
  }

  updatePredador();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawMoedas();
  drawPacman();
  drawPredador();
}

function drawMap() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = map[y][x] === 0 ? "blue" : "black";
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}

function drawMoedas() {
  ctx.fillStyle = "yellow";
  moedas.forEach((moeda) => {
    ctx.beginPath();
    ctx.arc(
      moeda.x * tileSize + tileSize / 2,
      moeda.y * tileSize + tileSize / 2,
      5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
}

function drawPacman() {
  let startAngle = 0.25;
  let endAngle = 1.75;
  let rotation = 0;

  switch (pacman.direction) {
    case "right":
      rotation = 0;
      break;
    case "left":
      rotation = Math.PI;
      break;
    case "up":
      rotation = -Math.PI / 2;
      break;
    case "down":
      rotation = Math.PI / 2;
      break;
  }

  ctx.save();
  ctx.translate(
    pacman.x * tileSize + tileSize / 2,
    pacman.y * tileSize + tileSize / 2
  );
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, tileSize / 2 - 2, Math.PI * startAngle, Math.PI * endAngle);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.restore();
}

function drawPredador() {
  let startAngle = 0.25;
  let endAngle = 1.75;
  let rotation = 0;

  switch (predador.direction) {
    case "right":
      rotation = 0;
      break;
    case "left":
      rotation = Math.PI;
      break;
    case "up":
      rotation = -Math.PI / 2;
      break;
    case "down":
      rotation = Math.PI / 2;
      break;
  }

  ctx.save();
  ctx.translate(
    predador.x * tileSize + tileSize / 2,
    predador.y * tileSize + tileSize / 2
  );
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, tileSize / 2 - 2, Math.PI * startAngle, Math.PI * endAngle);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.restore();
}

function gameLoop(timestamp) {
  if (!jogoRodando || pausado) return;
  const deltaTime = timestamp - lastTime;
  if (deltaTime >= 200) {
    update();
    lastTime = timestamp;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  jogoRodando = true;
  pausado = false;
  pacman = { x: 1, y: 1, dx: 0, dy: 0, direction: "right" };
  predador = { x: cols - 2, y: rows - 2, dx: 0, dy: -1, direction: "up" };
  ultimasPosicoesPredador = [];
  criarMoedas();
  lastTime = performance.now();
  mensagem.style.display = "none";
  requestAnimationFrame(gameLoop);
}

pauseButton.addEventListener("click", () => {
  if (!jogoRodando) return;
  pausado = !pausado;
  pauseButton.textContent = pausado ? "Continuar" : "Pausar";
  if (!pausado) {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
});

function endGame() {
  jogoRodando = false;
  pausado = false;
  pacman = { x: 1, y: 1, dx: 0, dy: 0, direction: "right" };
  predador = { x: cols - 2, y: rows - 2, dx: 0, dy: -1, direction: "up" };
  ultimasPosicoesPredador = [];
  moedas = [];
  pauseButton.textContent = "Pausar";
  mensagem.style.display = "none";
  draw();
}

document.addEventListener("keydown", (e) => {
  if (!jogoRodando || pausado) return;
  switch (e.key) {
    case "ArrowUp":
      pacman.dx = 0;
      pacman.dy = -1;
      pacman.direction = "up";
      break;
    case "ArrowDown":
      pacman.dx = 0;
      pacman.dy = 1;
      pacman.direction = "down";
      break;
    case "ArrowLeft":
      pacman.dx = -1;
      pacman.dy = 0;
      pacman.direction = "left";
      break;
    case "ArrowRight":
      pacman.dx = 1;
      pacman.dy = 0;
      pacman.direction = "right";
      break;
  }
});

startButton.addEventListener("click", startGame);
endButton.addEventListener("click", endGame);
draw();
