/**
 * Synesthesia Evolution Tree
 * Full-screen, draggable, zoomable color family tree visualization.
 * Reads color data from localStorage('synesthesia_colors').
 *
 * API:
 *   window.openEvolutionTree()  — opens the overlay
 *   window.closeEvolutionTree() — closes it
 */

(function () {
  'use strict';

  /* ───────── constants ───────── */
  var NODE_RADIUS      = 30;
  var GLOW_BLUR        = 22;
  var LAYER_SPACING_Y  = 140;
  var NODE_SPACING_X   = 120;
  var LINE_WIDTH       = 1.5;
  var LINE_ALPHA       = 0.3;
  var LINE_ALPHA_HI    = 0.85;
  var ZOOM_MIN         = 0.2;
  var ZOOM_MAX         = 3.0;
  var ZOOM_SENSITIVITY = 0.001;
  var GOLD             = '#D4AF37';
  var FONT_LABEL       = 'italic 13px "Playfair Display", "Georgia", serif';
  var FONT_HEX         = '11px "Inter", "Helvetica Neue", sans-serif';
  var ANIM_STAGGER     = 80;   // ms between layers
  var ANIM_DURATION    = 420;  // ms per node fade-in
  var Z_INDEX          = 500;

  /* ───────── state ───────── */
  var overlay   = null;
  var canvas    = null;
  var ctx       = null;
  var dpr       = 1;
  var W         = 0;
  var H         = 0;

  var nodes     = [];   // { id, name, hex, isBase, parents, depth, x, y, animProgress }
  var nodeMap   = {};   // id → node
  var maxDepth  = 0;
  var hasDiscovered = false;

  // transform
  var camX = 0, camY = 0, zoom = 1;

  // interaction
  var dragging   = false;
  var dragStartX = 0, dragStartY = 0;
  var dragCamX   = 0, dragCamY   = 0;
  var hoveredNode = null;
  var tooltipNode = null;
  var mouseX = 0, mouseY = 0;
  var animStartTime = 0;
  var animRunning   = false;
  var rafId = null;

  // touch
  var lastTouchDist = 0;
  var touchDragging = false;
  var touchStartX   = 0, touchStartY = 0;
  var touchCamX     = 0, touchCamY   = 0;

  /* ═══════════════════════════════════
     Data loading & layout
     ═══════════════════════════════════ */

  function loadColors() {
    try {
      var raw = localStorage.getItem('synesthesia_colors');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function buildTree() {
    var colors = loadColors();
    nodes = [];
    nodeMap = {};
    maxDepth = 0;
    hasDiscovered = false;

    // Build a name→color lookup (case-insensitive)
    var nameMap = {};
    colors.forEach(function (c) {
      nameMap[c.name.toLowerCase()] = c;
      nameMap[c.id.toLowerCase()]   = c;
    });

    // Create nodes
    colors.forEach(function (c) {
      var n = {
        id: c.id,
        name: c.name,
        hex: c.hex || '#888888',
        isBase: !!c.isBase,
        parentNames: c.parents || [],
        parentIds: [],
        depth: 0,
        x: 0,
        y: 0,
        animProgress: 0
      };
      nodes.push(n);
      nodeMap[c.id.toLowerCase()] = n;
      nodeMap[c.name.toLowerCase()] = n;
    });

    // Resolve parent references
    nodes.forEach(function (n) {
      n.parentIds = [];
      (n.parentNames || []).forEach(function (pName) {
        var key = (pName || '').toLowerCase();
        if (nodeMap[key]) {
          n.parentIds.push(nodeMap[key].id);
        }
      });
    });

    // Assign depths
    nodes.forEach(function (n) {
      if (n.isBase) n.depth = 0;
    });

    // Iterative depth assignment
    var changed = true;
    var safety = 0;
    while (changed && safety < 100) {
      changed = false;
      safety++;
      nodes.forEach(function (n) {
        if (n.isBase) return;
        var d = 1;
        n.parentIds.forEach(function (pid) {
          var p = nodeMap[pid.toLowerCase()];
          if (p) d = Math.max(d, p.depth + 1);
        });
        if (d !== n.depth) {
          n.depth = d;
          changed = true;
        }
      });
    }

    // Max depth
    nodes.forEach(function (n) {
      if (n.depth > maxDepth) maxDepth = n.depth;
      if (!n.isBase) hasDiscovered = true;
    });

    // Group by depth
    var layers = [];
    for (var i = 0; i <= maxDepth; i++) layers.push([]);
    nodes.forEach(function (n) { layers[n.depth].push(n); });

    // Assign positions
    layers.forEach(function (layer, depth) {
      var count = layer.length;
      var totalWidth = (count - 1) * NODE_SPACING_X;
      var startX = -totalWidth / 2;
      layer.forEach(function (n, idx) {
        // Small jitter to avoid perfect grid
        var jitter = (idx % 3 - 1) * 8;
        n.x = startX + idx * NODE_SPACING_X + jitter;
        n.y = depth * LAYER_SPACING_Y;
      });
    });
  }

  /* ═══════════════════════════════════
     Coordinate helpers
     ═══════════════════════════════════ */

  function worldToScreen(wx, wy) {
    return {
      x: (wx + camX) * zoom + W / 2,
      y: (wy + camY) * zoom + H / 2
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - W / 2) / zoom - camX,
      y: (sy - H / 2) / zoom - camY
    };
  }

  function nodeAtScreen(sx, sy) {
    var w = screenToWorld(sx, sy);
    var best = null;
    var bestDist = Infinity;
    for (var i = nodes.length - 1; i >= 0; i--) {
      var n = nodes[i];
      if (n.animProgress < 0.1) continue;
      var dx = w.x - n.x;
      var dy = w.y - n.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < NODE_RADIUS * 1.3 && d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  }

  /* ═══════════════════════════════════
     Drawing
     ═══════════════════════════════════ */

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var v = parseInt(hex, 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }

  function draw() {
    var now = performance.now();

    // Update animation
    if (animRunning) {
      var elapsed = now - animStartTime;
      var allDone = true;
      nodes.forEach(function (n) {
        var nodeDelay = n.depth * ANIM_STAGGER;
        var t = Math.max(0, Math.min(1, (elapsed - nodeDelay) / ANIM_DURATION));
        // ease-out cubic
        t = 1 - Math.pow(1 - t, 3);
        n.animProgress = t;
        if (t < 1) allDone = false;
      });
      if (allDone) animRunning = false;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Empty state
    if (!hasDiscovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = 'italic 22px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Mix colors to grow your tree', W / 2, H / 2);
      ctx.restore();
      rafId = requestAnimationFrame(draw);
      return;
    }

    // Apply camera transform
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(camX, camY);

    // ── Draw connection lines ──
    nodes.forEach(function (child) {
      if (child.isBase) return;
      if (child.animProgress < 0.05) return;

      child.parentIds.forEach(function (pid) {
        var parent = nodeMap[pid.toLowerCase()];
        if (!parent) return;
        if (parent.animProgress < 0.05) return;

        var isHighlighted = (hoveredNode === child);
        var alpha = isHighlighted ? LINE_ALPHA_HI : LINE_ALPHA;
        alpha *= Math.min(child.animProgress, parent.animProgress);

        var x1 = parent.x, y1 = parent.y + NODE_RADIUS;
        var x2 = child.x,  y2 = child.y - NODE_RADIUS;
        var cy1 = y1 + (y2 - y1) * 0.4;
        var cy2 = y1 + (y2 - y1) * 0.6;

        // Gradient line
        var grad = ctx.createLinearGradient(x1, y1, x2, y2);
        var pRgb = hexToRgb(parent.hex);
        var cRgb = hexToRgb(child.hex);
        grad.addColorStop(0, 'rgba(' + pRgb.r + ',' + pRgb.g + ',' + pRgb.b + ',' + alpha + ')');
        grad.addColorStop(1, 'rgba(' + cRgb.r + ',' + cRgb.g + ',' + cRgb.b + ',' + alpha + ')');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, cy1, x2, cy2, x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth = isHighlighted ? 2.5 : LINE_WIDTH;
        ctx.stroke();
      });
    });

    // ── Draw nodes ──
    nodes.forEach(function (n) {
      if (n.animProgress < 0.01) return;

      var a = n.animProgress;
      var s = 0.5 + 0.5 * a; // scale from 0.5 → 1
      var isHovered = (hoveredNode === n);

      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(s, s);
      ctx.globalAlpha = a;

      // Glow
      var rgb = hexToRgb(n.hex);
      ctx.shadowColor = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.6)';
      ctx.shadowBlur = isHovered ? GLOW_BLUR * 1.8 : GLOW_BLUR;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Circle fill
      ctx.beginPath();
      ctx.arc(0, 0, NODE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = n.hex;
      ctx.fill();

      // Gold ring for base
      if (n.isBase) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, NODE_RADIUS + 2, 0, Math.PI * 2);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Hover ring
      if (isHovered) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, NODE_RADIUS + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Label below
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = FONT_LABEL;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(n.name, 0, NODE_RADIUS + 8);

      ctx.restore();
    });

    ctx.restore(); // pop camera transform

    // ── Tooltip ──
    if (hoveredNode && hoveredNode.animProgress > 0.5) {
      drawTooltip(hoveredNode);
    }

    rafId = requestAnimationFrame(draw);
  }

  function drawTooltip(n) {
    var s = worldToScreen(n.x, n.y);
    var tx = s.x;
    var ty = s.y - NODE_RADIUS * zoom - 18;

    var lines = [n.name, n.hex.toUpperCase()];
    if (n.parentNames && n.parentNames.length > 0) {
      lines.push(n.parentNames.join(' + '));
    }

    // Measure
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '13px "Inter", sans-serif';
    var maxW = 0;
    lines.forEach(function (l) {
      var m = ctx.measureText(l).width;
      if (m > maxW) maxW = m;
    });

    var padX = 14, padY = 10;
    var boxW = maxW + padX * 2;
    var lineH = 20;
    var boxH = lines.length * lineH + padY * 2;
    var bx = tx - boxW / 2;
    var by = ty - boxH;

    // Keep within viewport
    if (bx < 8) bx = 8;
    if (bx + boxW > W - 8) bx = W - boxW - 8;
    if (by < 8) by = ty + NODE_RADIUS * zoom + 18;

    // Background
    ctx.fillStyle = 'rgba(10, 14, 20, 0.88)';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    roundRect(ctx, bx, by, boxW, boxH, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, boxW, boxH, 8);
    ctx.stroke();

    // Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var cx = bx + boxW / 2;
    lines.forEach(function (l, i) {
      if (i === 0) {
        ctx.font = 'italic 14px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#fff';
      } else if (i === 1) {
        ctx.font = FONT_HEX;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
      } else {
        ctx.font = '12px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
      }
      ctx.fillText(l, cx, by + padY + i * lineH);
    });
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ═══════════════════════════════════
     Resize
     ═══════════════════════════════════ */

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
  }

  /* ═══════════════════════════════════
     Input handlers
     ═══════════════════════════════════ */

  function onMouseDown(e) {
    if (e.button !== 0) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragCamX = camX;
    dragCamY = camY;
    canvas.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (dragging) {
      camX = dragCamX + (e.clientX - dragStartX) / zoom;
      camY = dragCamY + (e.clientY - dragStartY) / zoom;
      return;
    }

    hoveredNode = nodeAtScreen(e.clientX, e.clientY);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  }

  function onMouseUp(e) {
    if (dragging) {
      var dx = Math.abs(e.clientX - dragStartX);
      var dy = Math.abs(e.clientY - dragStartY);
      // Click detection (small drag threshold)
      if (dx < 4 && dy < 4) {
        var clicked = nodeAtScreen(e.clientX, e.clientY);
        if (clicked && typeof window.selectColorById === 'function') {
          window.selectColorById(clicked.id);
        }
      }
    }
    dragging = false;
    canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  }

  function onWheel(e) {
    e.preventDefault();
    var delta = -e.deltaY * ZOOM_SENSITIVITY;
    var newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * (1 + delta)));

    // Zoom toward cursor position
    var wx = (e.clientX - W / 2) / zoom - camX;
    var wy = (e.clientY - H / 2) / zoom - camY;

    zoom = newZoom;

    camX = (e.clientX - W / 2) / zoom - wx;
    camY = (e.clientY - H / 2) / zoom - wy;
  }

  /* ── Touch ── */

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchDragging = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchCamX = camX;
      touchCamY = camY;
    } else if (e.touches.length === 2) {
      touchDragging = false;
      lastTouchDist = touchDistance(e.touches);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && touchDragging) {
      camX = touchCamX + (e.touches[0].clientX - touchStartX) / zoom;
      camY = touchCamY + (e.touches[0].clientY - touchStartY) / zoom;
    } else if (e.touches.length === 2) {
      var dist = touchDistance(e.touches);
      var ratio = dist / lastTouchDist;
      zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * ratio));
      lastTouchDist = dist;
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length === 0) {
      if (touchDragging) {
        // Check for tap (small movement)
        var ce = e.changedTouches[0];
        var dx = Math.abs(ce.clientX - touchStartX);
        var dy = Math.abs(ce.clientY - touchStartY);
        if (dx < 10 && dy < 10) {
          var tapped = nodeAtScreen(ce.clientX, ce.clientY);
          if (tapped && typeof window.selectColorById === 'function') {
            window.selectColorById(tapped.id);
          }
        }
      }
      touchDragging = false;
    }
  }

  function touchDistance(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ═══════════════════════════════════
     Open / Close
     ═══════════════════════════════════ */

  window.openEvolutionTree = function () {
    if (overlay) return; // already open

    buildTree();

    // ── Overlay container ──
    overlay = document.createElement('div');
    overlay.id = 'evo-tree-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100vw', 'height:100vh',
      'z-index:' + Z_INDEX,
      'background:rgba(1,5,10,0.92)',
      'backdrop-filter:blur(30px)', '-webkit-backdrop-filter:blur(30px)',
      'display:flex', 'align-items:center', 'justify-content:center'
    ].join(';');

    // ── Canvas ──
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;cursor:grab;';
    overlay.appendChild(canvas);

    // ── Close button ──
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.setAttribute('aria-label', 'Close evolution tree');
    closeBtn.style.cssText = [
      'position:absolute', 'top:18px', 'right:18px',
      'width:40px', 'height:40px', 'border-radius:50%',
      'border:1px solid rgba(255,255,255,0.15)',
      'background:rgba(255,255,255,0.08)',
      'backdrop-filter:blur(12px)', '-webkit-backdrop-filter:blur(12px)',
      'color:#fff', 'font-size:18px', 'cursor:pointer',
      'display:flex', 'align-items:center', 'justify-content:center',
      'transition:background 0.2s', 'z-index:' + (Z_INDEX + 1),
      'line-height:1', 'padding:0'
    ].join(';');
    closeBtn.addEventListener('mouseenter', function () {
      closeBtn.style.background = 'rgba(255,255,255,0.18)';
    });
    closeBtn.addEventListener('mouseleave', function () {
      closeBtn.style.background = 'rgba(255,255,255,0.08)';
    });
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      window.closeEvolutionTree();
    });
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);

    // Init
    ctx = canvas.getContext('2d');
    resize();

    // Center camera on tree center
    camX = 0;
    camY = -maxDepth * LAYER_SPACING_Y / 2 + H / (2 * zoom) - 60;
    zoom = 1;

    // Fit zoom if tree is wide
    if (nodes.length > 0) {
      var minX = Infinity, maxX = -Infinity;
      nodes.forEach(function (n) {
        if (n.x - NODE_RADIUS < minX) minX = n.x - NODE_RADIUS;
        if (n.x + NODE_RADIUS > maxX) maxX = n.x + NODE_RADIUS;
      });
      var treeWidth = maxX - minX + NODE_SPACING_X;
      if (treeWidth > W * 0.85) {
        zoom = Math.max(ZOOM_MIN, (W * 0.85) / treeWidth);
      }

      var minY = Infinity, maxY = -Infinity;
      nodes.forEach(function (n) {
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      });
      var treeHeight = maxY - minY + NODE_RADIUS * 2 + 60;
      var zoomH = Math.max(ZOOM_MIN, (H * 0.8) / treeHeight);
      zoom = Math.min(zoom, zoomH);

      // Center camera
      var treeCX = (minX + maxX) / 2;
      var treeCY = (minY + maxY) / 2;
      camX = -treeCX;
      camY = -treeCY;
    }

    // Start animation
    animStartTime = performance.now();
    animRunning = true;
    nodes.forEach(function (n) { n.animProgress = 0; });

    // Bind events
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', resize);

    // Escape key
    window.addEventListener('keydown', onKeyDown);

    // Start render loop
    rafId = requestAnimationFrame(draw);
  };

  function onKeyDown(e) {
    if (e.key === 'Escape') window.closeEvolutionTree();
  }

  window.closeEvolutionTree = function () {
    if (!overlay) return;

    // Cleanup
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKeyDown);

    overlay.remove();
    overlay = null;
    canvas  = null;
    ctx     = null;
    nodes   = [];
    nodeMap = {};
    hoveredNode = null;
    dragging = false;
    touchDragging = false;
  };

})();
