const canvas = document.getElementById('cyber-grid');
const ctx = canvas.getContext('2d');

let width, height;
let mouse = { x: -1000, y: -1000 };
let globalPulse = 0;

// Ajustar tamaño del canvas
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Seguir posición del ratón
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Botón superior para lanzar una onda de energía
document.getElementById('pulse-trigger').addEventListener('click', () => {
  globalPulse = 1.0;
  const counter = document.getElementById('counter');
  counter.textContent = Math.floor(Math.random() * (512 - 128) + 128);
});

// Función para dibujar el polígono de una cruz perfecta de 12 vértices
function drawCrossPath(ctx, cx, cy, u, gap) {
  const half = u / 2 - gap;
  const outer = u * 1.5 - gap;

  ctx.beginPath();
  ctx.moveTo(cx - half, cy - outer);
  ctx.lineTo(cx + half, cy - outer);
  ctx.lineTo(cx + half, cy - half);
  ctx.lineTo(cx + outer, cy - half);
  ctx.lineTo(cx + outer, cy + half);
  ctx.lineTo(cx + half, cy + half);
  ctx.lineTo(cx + half, cy + outer);
  ctx.lineTo(cx - half, cy + outer);
  ctx.lineTo(cx - half, cy + half);
  ctx.lineTo(cx - outer, cy + half);
  ctx.lineTo(cx - outer, cy - half);
  ctx.lineTo(cx - half, cy - half);
  ctx.closePath();
}

// Matriz de estados aleatorios para imitar las cruces apagadas y encendidas de la imagen
const cellStates = new Map();

function getCellPhase(i, j) {
  const key = `${i},${j}`;
  if (!cellStates.has(key)) {
    cellStates.set(key, {
      offset: Math.random() * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.02,
      dimmed: Math.random() < 0.18 // Algunas cruces más tenues como en la imagen
    });
  }
  return cellStates.get(key);
}

let time = 0;

function animate() {
  time += 1;
  if (globalPulse > 0) globalPulse -= 0.02;

  // Fondo negro profundo
  ctx.fillStyle = '#040604';
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  // Transformación de perspectiva isométrica/inclinada igual a la imagen
  ctx.translate(width * 0.5, height * 0.5);
  ctx.rotate(-0.14); // Inclinación diagonal
  ctx.transform(1, -0.08, 0.05, 0.92, 0, 0); // Perspectiva 3D sutil
  ctx.translate(-width * 0.5, -height * 0.5);

  const u = 42; // Tamaño base del brazo de la cruz
  const gap = 3.5; // Separación entre cruces

  // Vectores base del teselado de cruces (encajan sin dejar huecos)
  // v1 = (2u, u), v2 = (-u, 2u)
  const cols = Math.ceil(width / u) + 6;
  const rows = Math.ceil(height / u) + 6;

  for (let i = -cols; i <= cols; i++) {
    for (let j = -rows; j <= rows; j++) {
      const cx = width * 0.5 + (i * 2 * u - j * u);
      const cy = height * 0.5 + (i * u + j * 2 * u);

      // Optimización: dibujar solo lo visible en pantalla
      if (cx < -200 || cx > width + 200 || cy < -200 || cy > height + 200) continue;

      const state = getCellPhase(i, j);
      const wave = Math.sin(time * state.speed + state.offset);

      // Distancia al cursor para interactividad
      const dx = cx - mouse.x;
      const dy = cy - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hoverBoost = Math.max(0, 1 - dist / 220);

      // Calcular intensidad luminosa
      let alpha = state.dimmed ? 0.12 : 0.45 + wave * 0.35;
      alpha = Math.min(1, alpha + hoverBoost * 0.8 + globalPulse * 0.7);

      drawCrossPath(ctx, cx, cy, u, gap);

      // Relleno sutil oscuro o blanco al pasar el cursor
      if (hoverBoost > 0.4) {
        ctx.fillStyle = `rgba(255, 255, 255, ${hoverBoost * 0.08})`;
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(10, 18, 10, 0.65)';
        ctx.fill();
      }

      // Borde neón verde (o destello blanco en el centro del cursor)
      if (hoverBoost > 0.75) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
      } else {
        ctx.strokeStyle = `rgba(34, 255, 34, ${alpha})`;
        ctx.shadowColor = '#22ff22';
        ctx.shadowBlur = alpha > 0.6 ? 14 : 4;
      }

      ctx.lineWidth = alpha > 0.7 ? 2.2 : 1.3;
      ctx.stroke();
    }
  }

  ctx.restore();
  requestAnimationFrame(animate);
}

animate();
