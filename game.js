(() => {
  'use strict';

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30;

  const COLORS = {
    I: '#00d4ff',
    O: '#ffd700',
    T: '#b44dff',
    S: '#00ff88',
    Z: '#ff4d6a',
    J: '#4d8bff',
    L: '#ff8c00',
    ghost: 'rgba(255,255,255,0.08)',
    grid: 'rgba(255,255,255,0.03)',
  };

  const SHAPES = {
    I: [[0,0],[1,0],[2,0],[3,0]],
    O: [[0,0],[1,0],[0,1],[1,1]],
    T: [[0,0],[1,0],[2,0],[1,1]],
    S: [[1,0],[2,0],[0,1],[1,1]],
    Z: [[0,0],[1,0],[1,1],[2,1]],
    J: [[0,0],[0,1],[1,1],[2,1]],
    L: [[2,0],[0,1],[1,1],[2,1]],
  };

  const PIECE_NAMES = Object.keys(SHAPES);

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next-piece');
  const nextCtx = nextCanvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMsg = document.getElementById('overlay-msg');
  const btnStart = document.getElementById('btn-start');

  let board, piece, nextPiece, score, level, lines, gameOver, paused, dropTimer, lastTime;
  let animatingRows = [];
  let animFrame = null;

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function randomPiece() {
    const name = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    const cells = SHAPES[name].map(([x, y]) => [x, y]);
    const startX = Math.floor((COLS - 4) / 2);
    return { name, cells, x: startX, y: 0 };
  }

  function rotate(cells) {
    const xs = cells.map(c => c[0]);
    const ys = cells.map(c => c[1]);
    const mx = Math.max(...xs);
    const my = Math.max(...ys);
    const cx = mx / 2;
    const cy = my / 2;
    return cells.map(([x, y]) => [
      Math.round(cx + cy - y),
      Math.round(cy - cx + x),
    ]);
  }

  function valid(cells, offX, offY) {
    return cells.every(([cx, cy]) => {
      const nx = cx + offX;
      const ny = cy + offY;
      return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && board[ny][nx] === 0;
    });
  }

  function lock() {
    piece.cells.forEach(([cx, cy]) => {
      const bx = cx + piece.x;
      const by = cy + piece.y;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        board[by][bx] = piece.name;
      }
    });

    const fullRows = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(c => c !== 0)) fullRows.push(r);
    }

    if (fullRows.length > 0) {
      clearRows(fullRows);
    } else {
      spawnNext();
    }
  }

  function clearRows(rows) {
    animatingRows = rows;
    let flashes = 0;
    const flashInterval = setInterval(() => {
      flashes++;
      if (flashes >= 6) {
        clearInterval(flashInterval);
        animatingRows = [];
        rows.sort((a, b) => a - b).forEach(r => {
          board.splice(r, 1);
          board.unshift(Array(COLS).fill(0));
        });
        const cleared = rows.length;
        const points = [0, 100, 300, 500, 800];
        score += (points[cleared] || 0) * level;
        lines += cleared;
        level = Math.floor(lines / 10) + 1;
        updateUI();
        spawnNext();
      }
      draw();
    }, 60);
  }

  function spawnNext() {
    piece = nextPiece || randomPiece();
    nextPiece = randomPiece();
    drawNext();

    if (!valid(piece.cells, piece.x, piece.y)) {
      gameOver = true;
      showOverlay('GAME OVER', `Score: ${score}`, 'RESTART');
    }
  }

  function ghostY() {
    let gy = piece.y;
    while (valid(piece.cells, piece.x, gy + 1)) gy++;
    return gy;
  }

  function drawBlock(context, x, y, color, size) {
    const s = size || BLOCK;
    const pad = 1;
    context.fillStyle = color;
    context.fillRect(x * s + pad, y * s + pad, s - pad * 2, s - pad * 2);
    context.fillStyle = 'rgba(255,255,255,0.15)';
    context.fillRect(x * s + pad, y * s + pad, s - pad * 2, 3);
    context.fillRect(x * s + pad, y * s + pad, 3, s - pad * 2);
    context.fillStyle = 'rgba(0,0,0,0.2)';
    context.fillRect(x * s + pad, y * s + s - 3, s - pad * 2, 2);
    context.fillRect(x * s + s - 3, y * s + pad, 2, s - pad * 2);
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const scaleX = w / (COLS * BLOCK);
    const scaleY = h / (ROWS * BLOCK);

    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, COLS * BLOCK, ROWS * BLOCK);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = COLORS.grid;
        ctx.fillRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);
      }
    }

    for (let r = 0; r < ROWS; r++) {
      if (animatingRows.includes(r)) {
        const flash = (Date.now() / 80) | 0;
        if (flash % 2 === 0) {
          for (let c = 0; c < COLS; c++) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2);
          }
        }
        continue;
      }
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) {
          drawBlock(ctx, c, r, COLORS[board[r][c]]);
        }
      }
    }

    if (piece && !gameOver) {
      const gy = ghostY();
      piece.cells.forEach(([cx, cy]) => {
        drawBlock(ctx, cx + piece.x, cy + gy, COLORS.ghost);
      });

      piece.cells.forEach(([cx, cy]) => {
        drawBlock(ctx, cx + piece.x, cy + piece.y, COLORS[piece.name]);
      });
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function drawNext() {
    const nw = nextCanvas.width;
    const nh = nextCanvas.height;
    nextCtx.clearRect(0, 0, nw, nh);
    if (!nextPiece) return;

    const cells = nextPiece.cells;
    const xs = cells.map(c => c[0]);
    const ys = cells.map(c => c[1]);
    const pw = Math.max(...xs) - Math.min(...xs) + 1;
    const ph = Math.max(...ys) - Math.min(...ys) + 1;
    const blockSize = Math.min(nw / 5, nh / 5);
    const offX = (nw - pw * blockSize) / 2;
    const offY = (nh - ph * blockSize) / 2;

    nextCtx.save();
    nextCtx.translate(offX, offY);
    cells.forEach(([cx, cy]) => {
      const pad = 1;
      nextCtx.fillStyle = COLORS[nextPiece.name];
      nextCtx.fillRect(cx * blockSize + pad, cy * blockSize + pad, blockSize - pad * 2, blockSize - pad * 2);
      nextCtx.fillStyle = 'rgba(255,255,255,0.15)';
      nextCtx.fillRect(cx * blockSize + pad, cy * blockSize + pad, blockSize - pad * 2, 3);
      nextCtx.fillRect(cx * blockSize + pad, cy * blockSize + pad, 3, blockSize - pad * 2);
    });
    nextCtx.restore();
  }

  function updateUI() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
  }

  function getSpeed() {
    return Math.max(50, 500 - (level - 1) * 40);
  }

  function moveLeft() {
    if (valid(piece.cells, piece.x - 1, piece.y)) {
      piece.x--;
      draw();
    }
  }

  function moveRight() {
    if (valid(piece.cells, piece.x + 1, piece.y)) {
      piece.x++;
      draw();
    }
  }

  function moveDown() {
    if (valid(piece.cells, piece.x, piece.y + 1)) {
      piece.y++;
      draw();
      return true;
    }
    lock();
    return false;
  }

  function hardDrop() {
    while (valid(piece.cells, piece.x, piece.y + 1)) {
      piece.y++;
      score += 2;
    }
    updateUI();
    lock();
    draw();
  }

  function rotatePiece() {
    const rotated = rotate(piece.cells);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (valid(rotated, piece.x + kick, piece.y)) {
        piece.cells = rotated;
        piece.x += kick;
        draw();
        return;
      }
    }
  }

  function showOverlay(title, msg, btnText) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    btnStart.textContent = btnText || 'START';
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function startGame() {
    board = createBoard();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = false;
    piece = null;
    nextPiece = null;
    animatingRows = [];
    updateUI();
    spawnNext();
    hideOverlay();
    draw();
    lastTime = performance.now();
    dropTimer = 0;
    if (animFrame) cancelAnimationFrame(animFrame);
    loop();
  }

  function loop() {
    if (gameOver) return;
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    if (!paused && animatingRows.length === 0) {
      dropTimer += delta;
      if (dropTimer >= getSpeed()) {
        dropTimer = 0;
        moveDown();
      }
    }

    draw();
    animFrame = requestAnimationFrame(loop);
  }

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    if (paused) {
      showOverlay('PAUSED', 'Press P or tap Start to resume', 'RESUME');
    } else {
      hideOverlay();
      lastTime = performance.now();
    }
  }

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (gameOver || !piece) return;
    if (e.key === 'p' || e.key === 'P') {
      togglePause();
      return;
    }
    if (paused) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveLeft();
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveRight();
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveDown();
        score += 1;
        updateUI();
        break;
      case 'ArrowUp':
        e.preventDefault();
        rotatePiece();
        break;
      case ' ':
        e.preventDefault();
        hardDrop();
        break;
    }
  });

  // Button start/restart
  btnStart.addEventListener('click', () => {
    if (paused) {
      togglePause();
    } else {
      startGame();
    }
  });

  // Touch controls
  function bindTouch(id, fn) {
    const el = document.getElementById(id);
    let interval = null;

    const start = (e) => {
      e.preventDefault();
      fn();
      interval = setInterval(fn, 120);
    };
    const stop = () => {
      clearInterval(interval);
      interval = null;
    };

    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', stop);
    el.addEventListener('touchcancel', stop);
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', stop);
    el.addEventListener('mouseleave', stop);
  }

  bindTouch('btn-left', () => { if (!paused && !gameOver && piece) moveLeft(); });
  bindTouch('btn-right', () => { if (!paused && !gameOver && piece) moveRight(); });
  bindTouch('btn-down', () => {
    if (!paused && !gameOver && piece) {
      moveDown();
      score += 1;
      updateUI();
    }
  });

  document.getElementById('btn-rotate').addEventListener('click', (e) => {
    e.preventDefault();
    if (!paused && !gameOver && piece) rotatePiece();
  });

  document.getElementById('btn-drop').addEventListener('click', (e) => {
    e.preventDefault();
    if (!paused && !gameOver && piece) hardDrop();
  });

  // Swipe support
  let touchStartX = null;
  let touchStartY = null;

  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < 15 && absDy < 15) {
      rotatePiece();
    } else if (absDy > absDx && dy > 30) {
      hardDrop();
    }
    touchStartX = null;
    touchStartY = null;
  }, { passive: true });

  // Prevent scroll on canvas
  canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  // Service Worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // Init
  draw();
})();
