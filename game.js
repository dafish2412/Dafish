(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const overlay = document.querySelector('#overlay');
  const scoreNode = document.querySelector('#score');
  const bestNode = document.querySelector('#best');
  const startButton = document.querySelector('#start');
  const size = 20, cell = canvas.width / size;
  const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  let snake, direction, queue, food, score, timer, state = 'ready', best = 0;
  try { best = Number(localStorage.getItem('snake-best')) || 0; } catch {}
  bestNode.textContent = best;

  function placeFood() {
    const free = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (!snake.some(p => p.x === x && p.y === y)) free.push({ x, y });
    }
    return free[Math.floor(Math.random() * free.length)];
  }
  function draw() {
    ctx.fillStyle = '#17231c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#203027'; ctx.lineWidth = 1;
    for (let i = 1; i < size; i++) {
      ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke();
    }
    if (food) {
      ctx.fillStyle = '#f2a777'; ctx.beginPath();
      ctx.arc((food.x + .5) * cell, (food.y + .5) * cell, cell * .28, 0, Math.PI * 2); ctx.fill();
    }
    snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#d1ff9d' : '#96c85c';
      ctx.beginPath(); ctx.roundRect(p.x * cell + 2, p.y * cell + 2, cell - 4, cell - 4, 6); ctx.fill();
      if (i === 0) {
        ctx.fillStyle = '#25391c';
        for (const side of [-1, 1]) {
          const x = (p.x + .5) * cell + direction[0] * 6 + direction[1] * side * 5;
          const y = (p.y + .5) * cell + direction[1] * 6 + direction[0] * side * 5;
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
  }
  function show(title, description, button, label) {
    document.querySelector('#message').textContent = title;
    document.querySelector('#description').textContent = description;
    document.querySelector('#status-label').textContent = label;
    startButton.textContent = button;
    overlay.hidden = false;
    document.querySelector('#announcement').textContent = `${title} ${description}`;
  }
  function stop(won = false) {
    clearInterval(timer); state = 'over';
    show(won ? 'You filled the board!' : 'One more bite?', `Final score: ${score}. ${won ? 'Perfect game.' : 'Ready for another round?'}`, 'Play again ↗', won ? 'YOU WIN' : 'GAME OVER');
  }
  function tick() {
    if (queue.length) direction = queue.shift();
    const head = { x: snake[0].x + direction[0], y: snake[0].y + direction[1] };
    const eating = head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);
    if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size || body.some(p => p.x === head.x && p.y === head.y)) return stop();
    snake.unshift(head);
    if (eating) {
      score += 10; scoreNode.textContent = score;
      if (score > best) {
        best = score; bestNode.textContent = best;
        try { localStorage.setItem('snake-best', String(best)); } catch {}
      }
      food = placeFood();
      if (!food) { draw(); stop(true); return; }
    } else snake.pop();
    draw();
  }
  function reset() {
    clearInterval(timer); snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    direction = [1, 0]; queue = []; score = 0; scoreNode.textContent = score; food = placeFood(); draw();
  }
  function start() {
    reset(); state = 'running'; overlay.hidden = true; timer = setInterval(tick, 130);
    document.querySelector('#announcement').textContent = 'Game started. Use arrow keys to move.';
  }
  function pause() {
    if (state !== 'running') return;
    clearInterval(timer); state = 'paused';
    show('Take a breather.', 'Your next bite can wait.', 'Resume ↗', 'PAUSED');
  }
  function resume() { state = 'running'; overlay.hidden = true; timer = setInterval(tick, 130); }
  startButton.addEventListener('click', () => state === 'paused' ? resume() : start());
  document.querySelector('#restart').addEventListener('click', start);
  document.addEventListener('keydown', event => {
    if (directions[event.key]) {
      event.preventDefault();
      if (state === 'ready') start();
      if (state !== 'running') return;
      const next = directions[event.key], previous = queue.at(-1) || direction;
      if (queue.length < 2 && (next[0] !== previous[0] || next[1] !== previous[1]) && (next[0] !== -previous[0] || next[1] !== -previous[1])) queue.push(next);
    } else if (event.code === 'Space' && event.target.tagName !== 'BUTTON') {
      event.preventDefault();
      if (event.repeat) return;
      if (state === 'running') pause(); else if (state === 'paused') resume(); else start();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);
  reset();
})();
