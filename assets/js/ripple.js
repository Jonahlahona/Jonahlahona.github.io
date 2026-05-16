/**
 * Coffee Mug Ripple Effect
 * ========================
 * Renders circular ripple rings on a transparent Canvas overlay
 * positioned over the coffee liquid area in the header.
 *
 * Ripple rings spawn wherever the cursor drags within the liquid ellipse,
 * expand outward, fade quickly, and stay clipped to the ellipse boundary.
 *
 * Image source: jonah-tangreen-cup.jpg (approx 1600 × 900 at "large" CDN)
 * Liquid surface ellipse measured from the image.
 */

(function () {
  'use strict';

  // ── Liquid ellipse as fractions of the SOURCE IMAGE ──────────────────────
  // These describe where the dark coffee surface sits in the raw image.
  // MODIFIERS:
  // - Increase/Decrease FRAC values to move the area (CX: left/right, CY: up/down)
  // - Increase/Decrease RX/RY to change the width and height of the interactive area
  const LIQUID_CX_FRAC = 0.500;   // centre X (0.5 is horizontal center)
  const LIQUID_CY_FRAC = 0.450;   // centre Y (Decreasing moves it UP, Increasing moves it DOWN)
  const LIQUID_RX_FRAC = 0.050;   // half-width of the interactive area (Smaller = tighter)
  const LIQUID_RY_FRAC = 0.045;   // half-height of the interactive area (Smaller = tighter)

  // Source image natural dimensions (px) — "large" CDN size
  const IMG_W = 1920;
  const IMG_H = 1200;

  // ── Ripple visual settings ────────────────────────────────────────────────
  const MAX_RIPPLES = 60;   // max simultaneous rings
  const RIPPLE_SPEED = 0.6;  // px/frame growth (in canvas-pixel space)
  const RIPPLE_LIFE = 55;   // frames until fully gone
  // MODIFIER: Change this to adjust the color of the ripples (R, G, B)
  const RIPPLE_COLOR = '40, 24, 16'; // Darker coffee color
  const LINE_WIDTH = 1.2;
  const SPAWN_INTERVAL = 3;    // spawn a ripple every N frames while dragging
  const MIN_DRAG_DIST = 6;    // minimum mouse movement (px) to spawn

  // ── State ─────────────────────────────────────────────────────────────────
  let header, canvas, ctx;
  let canvasW, canvasH;
  let liquidRect = {};   // { cx, cy, rx, ry } in canvas-pixel coords
  let ripples = [];   // array of { x, y, r, age, maxR }
  let mouseX = -1, mouseY = -1;
  let targetX = -1, targetY = -1; // For smoothing
  let prevX = -1, prevY = -1;     // For interpolation
  let prevSpawnX = -1, prevSpawnY = -1;
  let frameCount = 0;
  let isDragging = false;

  // ── Coordinate mapping ───────────────────────────────────────────────────
  function computeLiquidRect() {
    const hRect = header.getBoundingClientRect();
    const hW = hRect.width;
    const hH = hRect.height;

    const scale = Math.max(hW / IMG_W, hH / IMG_H);
    const scaledW = IMG_W * scale;
    const scaledH = IMG_H * scale;

    // background-position: 50% center
    const offX = (hW - scaledW) / 2;
    const offY = (hH - scaledH) / 2;

    liquidRect = {
      cx: offX + LIQUID_CX_FRAC * scaledW,
      cy: offY + LIQUID_CY_FRAC * scaledH,
      rx: LIQUID_RX_FRAC * scaledW,
      ry: LIQUID_RY_FRAC * scaledH,
    };
  }

  function insideLiquid(px, py) {
    const dx = (px - liquidRect.cx) / liquidRect.rx;
    const dy = (py - liquidRect.cy) / liquidRect.ry;
    return dx * dx + dy * dy <= 1.0;
  }

  // ── Ripple management ────────────────────────────────────────────────────
  function spawnRipple(x, y) {
    if (ripples.length >= MAX_RIPPLES) ripples.shift();
    ripples.push({ x, y, r: 1, age: 0 });
  }

  function updateRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += RIPPLE_SPEED;
      rp.age++;
      if (rp.age >= RIPPLE_LIFE) ripples.splice(i, 1);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, canvasW, canvasH);

    if (ripples.length === 0) return;

    // Clip all drawing to the liquid ellipse
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      liquidRect.cx, liquidRect.cy,
      liquidRect.rx, liquidRect.ry,
      0, 0, Math.PI * 2
    );
    ctx.clip();

    for (const rp of ripples) {
      const progress = rp.age / RIPPLE_LIFE;  // 0 → 1
      const alpha = Math.pow(1 - progress, 2) * 0.55;  // ease-out fade, max ~55% opacity

      // Scale the circular radius to an elliptical arc matching the mug shape
      // by applying a transform that stretches Y
      const scaleY = liquidRect.ry / liquidRect.rx;

      ctx.save();
      ctx.translate(rp.x, rp.y);
      ctx.scale(1, scaleY);
      ctx.beginPath();
      ctx.arc(0, 0, rp.r, 0, Math.PI * 2);
      ctx.restore();

      ctx.strokeStyle = `rgba(${RIPPLE_COLOR}, ${alpha})`;
      ctx.lineWidth = LINE_WIDTH;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Animation loop ───────────────────────────────────────────────────────
  function tick() {
    frameCount++;

    // Smoothing: Gradually move mouse position towards target
    if (targetX >= 0) {
      if (mouseX < 0) {
        mouseX = targetX;
        mouseY = targetY;
      } else {
        // Subtle lerp for smoother pathing
        mouseX += (targetX - mouseX) * 0.3;
        mouseY += (targetY - mouseY) * 0.3;
      }
    }

    // Spawn ripples while cursor is active
    if (isDragging && mouseX >= 0) {
      // If we have a previous position, interpolate to fill gaps
      if (prevX >= 0) {
        const dist = Math.hypot(mouseX - prevX, mouseY - prevY);
        const steps = Math.min(10, Math.floor(dist / 3)); // More steps for fast movement

        for (let i = 0; i <= steps; i++) {
          const t = steps === 0 ? 1 : i / steps;
          const ix = prevX + (mouseX - prevX) * t;
          const iy = prevY + (mouseY - prevY) * t;

          // Check if the interpolated point is still within bounds
          if (insideLiquid(ix, iy)) {
            const distFromLastSpawn = prevSpawnX < 0 ? Infinity : Math.hypot(ix - prevSpawnX, iy - prevSpawnY);

            // Spawn exactly every MIN_DRAG_DIST pixels of movement along the path
            if (distFromLastSpawn >= MIN_DRAG_DIST) {
              spawnRipple(ix, iy);
              prevSpawnX = ix;
              prevSpawnY = iy;
            }
          }
        }
      } else {
        if (insideLiquid(mouseX, mouseY)) {
          spawnRipple(mouseX, mouseY);
          prevSpawnX = mouseX;
          prevSpawnY = mouseY;
        }
      }
    }

    prevX = mouseX;
    prevY = mouseY;

    updateRipples();
    draw();
    requestAnimationFrame(tick);
  }

  // ── Resize ───────────────────────────────────────────────────────────────
  function resize() {
    const hRect = header.getBoundingClientRect();
    canvasW = hRect.width;
    canvasH = hRect.height;
    canvas.width = canvasW;
    canvas.height = canvasH;
    computeLiquidRect();
  }

  // ── Mouse events ─────────────────────────────────────────────────────────
  function toHeaderCoords(e) {
    const hRect = header.getBoundingClientRect();
    return {
      x: e.clientX - hRect.left,
      y: e.clientY - hRect.top,
    };
  }

  function onMouseMove(e) {
    const { x, y } = toHeaderCoords(e);
    if (insideLiquid(x, y)) {
      targetX = x;
      targetY = y;
      isDragging = true;
    } else {
      targetX = -1;
      targetY = -1;
      mouseX = -1;
      mouseY = -1;
      isDragging = false;
      prevSpawnX = -1;
      prevSpawnY = -1;
    }
  }

  function onMouseLeave() {
    targetX = -1;
    targetY = -1;
    mouseX = -1;
    mouseY = -1;
    isDragging = false;
    prevSpawnX = -1;
    prevSpawnY = -1;
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    header = document.querySelector('header');
    if (!header) return;

    canvas = document.createElement('canvas');
    canvas.id = 'ripple-canvas';
    canvas.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:2',
    ].join(';');
    header.appendChild(canvas);
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize);

    // Listen on the header itself (pointer-events:auto is already set)
    header.addEventListener('mousemove', onMouseMove);
    header.addEventListener('mouseleave', onMouseLeave);

    tick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
