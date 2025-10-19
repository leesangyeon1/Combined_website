/**
 * local-cluster-align.js
 * -------------------------------------------
 * Runtime helper that augments an existing VANTA.NET instance with
 * pointer-driven local alignment behaviour. The helper runs entirely on the
 * client and works by wrapping the effect's animation loop so that only
 * particles inside a configurable screen-space radius are influenced.
 *
 * Usage:
 *   import { attachLocalClusterAlign } from '/scripts/local-cluster-align.js'
 *   const v = VANTA.NET({ el: '#selector', THREE })
 *   const controller = attachLocalClusterAlign(v, { affectRadius: 180 })
 *
 * The function returns a controller with methods to update options or disable
 * the behaviour. Call `destroy()` before destroying the Vanta instance to
 * release listeners and restore the original animation loop.
 */

const DEFAULT_OPTIONS = {
  affectRadius: 140,
  hoverStrength: 0.35,
  clickStrength: 0.85,
  clickDuration: 350,
  alignMode: 'axis',
  axis: 'x',
  gridSize: 12,
  circleRadius: null,
  flowCurl: 1.2,
  alignLines: true,
  maxAffected: 120,
  restoreEase: 0.08,
  debugHelpers: false,
};

const ALIGN_MODES = new Set(['axis', 'grid', 'circle', 'flow']);
const AXIS_MODES = new Set(['x', 'y', 'z']);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, x) {
  if (edge0 === edge1) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerpTowards(target, current, alpha) {
  return current + (target - current) * alpha;
}

function ensureVector(map, key, THREE) {
  let entry = map.get(key);
  if (!entry) {
    entry = {
      baseline: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
      applied: false,
    };
    map.set(key, entry);
  }
  return entry;
}

function updateColorState(state, THREE) {
  state.color.set(state.vanta.options.color || 0x07cfeb);
  state.bgColor.set(state.vanta.options.backgroundColor || 0x000000);
  state.diffColor.copy(state.color).sub(state.bgColor);
}

function createDebugCanvas(state) {
  if (!state.options.debugHelpers) {
    if (state.debugCanvas) {
      state.debugCanvas.remove();
      state.debugCanvas = null;
      state.debugCtx = null;
    }
    return;
  }
  if (state.debugCanvas) return;
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.mixBlendMode = 'screen';
  state.el.appendChild(canvas);
  state.debugCanvas = canvas;
  state.debugCtx = canvas.getContext('2d');
}

function resizeDebugCanvas(state) {
  if (!state.debugCanvas) return;
  const { width, height } = state.bounds;
  if (state.debugCanvas.width !== Math.floor(width) || state.debugCanvas.height !== Math.floor(height)) {
    state.debugCanvas.width = Math.max(1, Math.floor(width));
    state.debugCanvas.height = Math.max(1, Math.floor(height));
  }
}

function drawDebug(state) {
  if (!state.debugCtx) return;
  const ctx = state.debugCtx;
  const { width, height } = state.bounds;
  ctx.clearRect(0, 0, width, height);
  if (!state.pointer.active) return;
  ctx.strokeStyle = 'rgba(8, 210, 255, 0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, state.options.affectRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(8, 210, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function attachLocalClusterAlign(vantaInstance, userOptions = {}) {
  if (!vantaInstance || typeof vantaInstance !== 'object') {
    throw new Error('attachLocalClusterAlign: a valid Vanta instance is required.');
  }
  const THREE =
    vantaInstance.THREE ||
    (typeof window !== 'undefined' ? window.THREE : null);
  if (!THREE) {
    throw new Error('attachLocalClusterAlign: THREE.js was not found on the Vanta instance.');
  }

  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  if (!ALIGN_MODES.has(options.alignMode)) {
    options.alignMode = 'axis';
  }
  if (!AXIS_MODES.has(options.axis)) {
    options.axis = 'x';
  }

  const el = vantaInstance.el || vantaInstance.options?.el;
  if (!el) {
    throw new Error('attachLocalClusterAlign: unable to locate the effect container element.');
  }

  const state = {
    vanta: vantaInstance,
    el,
    THREE,
    options,
    enabled: true,
    pointer: {
      x: 0,
      y: 0,
      ndcX: 0,
      ndcY: 0,
      active: false,
      inside: false,
      down: false,
      clickActive: false,
      clickUntil: 0,
      pointerType: 'mouse',
    },
    particleData: new WeakMap(),
    candidateBuffer: [],
    bounds: { left: 0, top: 0, width: el.clientWidth || 1, height: el.clientHeight || 1 },
    raycaster: new THREE.Raycaster(),
    tempPointer: new THREE.Vector3(),
    tempPointerDX: new THREE.Vector3(),
    tempPointerDY: new THREE.Vector3(),
    tempForward: new THREE.Vector3(),
    tempPlanePoint: new THREE.Vector3(),
    tempRayDir: new THREE.Vector3(),
    tempProjection: new THREE.Vector3(),
    tempTarget: new THREE.Vector3(),
    tempLocal: new THREE.Vector3(),
    tempSnap: new THREE.Vector3(),
    tempOffsetDelta: new THREE.Vector3(),
    tempLineA: new THREE.Vector3(),
    tempLineB: new THREE.Vector3(),
    color: new THREE.Color(),
    bgColor: new THREE.Color(),
    diffColor: new THREE.Color(),
    tempColor: new THREE.Color(),
    debugCanvas: null,
    debugCtx: null,
  };

  updateColorState(state, THREE);
  createDebugCanvas(state);

  function updateBounds() {
    const rect = el.getBoundingClientRect();
    state.bounds.left = rect.left;
    state.bounds.top = rect.top;
    state.bounds.width = rect.width || 1;
    state.bounds.height = rect.height || 1;
  }

  function updatePointerFromEvent(evt) {
    updateBounds();
    const x = evt.clientX - state.bounds.left;
    const y = evt.clientY - state.bounds.top;
    state.pointer.x = x;
    state.pointer.y = y;
    state.pointer.ndcX = (x / state.bounds.width) * 2 - 1;
    state.pointer.ndcY = -((y / state.bounds.height) * 2 - 1);
    state.pointer.pointerType = evt.pointerType || 'mouse';
  }

  function onPointerMove(evt) {
    if (!state.enabled) return;
    updatePointerFromEvent(evt);
    state.pointer.active = state.pointer.inside || state.pointer.down;
  }

  function onPointerEnter(evt) {
    if (!state.enabled) return;
    state.pointer.inside = true;
    updatePointerFromEvent(evt);
    state.pointer.active = true;
  }

  function onPointerLeave() {
    state.pointer.inside = false;
    state.pointer.active = state.pointer.down;
  }

  function onPointerDown(evt) {
    if (!state.enabled) return;
    state.pointer.down = true;
    updatePointerFromEvent(evt);
    state.pointer.active = true;
    state.pointer.clickActive = true;
    state.pointer.clickUntil = performance.now() + state.options.clickDuration;
  }

  function onPointerUp() {
    state.pointer.down = false;
    state.pointer.active = state.pointer.inside;
  }

  function onPointerCancel() {
    state.pointer.down = false;
    state.pointer.active = false;
  }

  el.addEventListener('pointermove', onPointerMove, { passive: true });
  el.addEventListener('pointerenter', onPointerEnter, { passive: true });
  el.addEventListener('pointerleave', onPointerLeave, { passive: true });
  el.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  window.addEventListener('pointercancel', onPointerCancel, { passive: true });
  window.addEventListener('resize', updateBounds);

  updateBounds();
  resizeDebugCanvas(state);

  const originalOnUpdate = typeof vantaInstance.onUpdate === 'function' ? vantaInstance.onUpdate.bind(vantaInstance) : null;

  function computePointerWorld(particle, dxPx, dyPx, target) {
    const { width, height } = state.bounds;
    if (!width || !height) return false;
    const ndcX = ((state.pointer.x + dxPx) / width) * 2 - 1;
    const ndcY = -(((state.pointer.y + dyPx) / height) * 2 - 1);
    state.raycaster.setFromCamera({ x: ndcX, y: ndcY }, state.vanta.camera);
    const ray = state.raycaster.ray;
    const camPos = state.vanta.camera.position;
    const toParticle = state.tempLocal.copy(particle.position).sub(camPos);
    const normal = state.tempForward;
    state.vanta.camera.getWorldDirection(normal).normalize();
    const planePoint = state.tempPlanePoint
      .copy(camPos)
      .add(state.tempRayDir.copy(normal).multiplyScalar(toParticle.dot(normal)));
    const denom = normal.dot(ray.direction);
    if (Math.abs(denom) < 1e-5) return false;
    const numerator = state.tempSnap.copy(planePoint).sub(ray.origin);
    const t = numerator.dot(normal) / denom;
    if (!Number.isFinite(t) || t < 0) return false;
    target.copy(ray.origin).add(state.tempRayDir.copy(ray.direction).multiplyScalar(t));
    return true;
  }

  function computeTargetPosition(particle, baseline, pointerWorld, pxToWorld, falloffStrength) {
    const mode = state.options.alignMode;
    const target = state.tempTarget.copy(baseline);
    const alignAxis = state.options.axis;
    const gridSize = state.options.gridSize || 12;
    const curl = state.options.flowCurl || 1.2;
    const circlePx = state.options.circleRadius == null ? state.options.affectRadius * 0.5 : state.options.circleRadius;
    const circleRadiusWorld = circlePx * (pxToWorld || 1);
    const local = state.tempLocal.copy(baseline).sub(pointerWorld);

    switch (mode) {
      case 'axis': {
        if (alignAxis === 'x') target.x = lerpTowards(pointerWorld.x, baseline.x, falloffStrength);
        if (alignAxis === 'y') target.y = lerpTowards(pointerWorld.y, baseline.y, falloffStrength);
        if (alignAxis === 'z') target.z = lerpTowards(pointerWorld.z, baseline.z, falloffStrength);
        break;
      }
      case 'grid': {
        if (gridSize > 0) {
          const snapped = state.tempSnap.set(
            Math.round(local.x / gridSize) * gridSize,
            Math.round(local.y / gridSize) * gridSize,
            Math.round(local.z / gridSize) * gridSize,
          );
          target.copy(pointerWorld).add(snapped);
        }
        break;
      }
      case 'circle': {
        const horizontal = state.tempSnap.set(local.x, 0, local.z);
        const len = horizontal.length();
        if (len > 1e-4) {
          horizontal.multiplyScalar((circleRadiusWorld || len) / len);
        } else {
          horizontal.set(circleRadiusWorld || 1, 0, 0);
        }
        target.copy(pointerWorld).add(horizontal);
        target.y = lerpTowards(pointerWorld.y, baseline.y, 0.4);
        break;
      }
      case 'flow': {
        const tangent = state.tempSnap.set(-local.z, 0, local.x);
        const len = tangent.length() || 1;
        tangent.multiplyScalar((local.length() || 1) / len).multiplyScalar(curl);
        target.copy(pointerWorld).add(tangent);
        target.y = baseline.y + local.y * 0.25;
        break;
      }
      default:
        break;
    }

    return target;
  }

  function recomputeLines(points, alignFactor = 1) {
    const { linePositions, lineColors, linesMesh, options: vOptions, blending } = state.vanta;
    if (!linePositions || !lineColors || !linesMesh) return;

    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;
    const maxDistance = vOptions.maxDistance || 20;
    const bgColor = state.bgColor;
    const color = state.color;
    const diffColor = state.diffColor;
    const mixFactor = clamp(alignFactor, 0, 1);

    for (let i = 0; i < points.length; i += 1) {
      const sphereA = points[i];
      const dataA = state.particleData.get(sphereA);
      if (!dataA) continue;
      const posA = mixFactor >= 0.999
        ? sphereA.position
        : state.tempLineA.copy(dataA.baseline).lerp(sphereA.position, mixFactor);
      for (let j = i; j < points.length; j += 1) {
        const sphereB = points[j];
        const dataB = state.particleData.get(sphereB);
        if (!dataB) continue;
        const posB = mixFactor >= 0.999
          ? sphereB.position
          : state.tempLineB.copy(dataB.baseline).lerp(sphereB.position, mixFactor);
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dz = posA.z - posB.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < maxDistance) {
          const alpha = clamp((1 - dist / maxDistance) * 2, 0, 1);
          let lineColor;
          if (blending === 'additive') {
            lineColor = state.tempColor.setRGB(0, 0, 0).lerp(diffColor, alpha);
          } else {
            lineColor = state.tempColor.copy(bgColor).lerp(color, alpha);
          }
          linePositions[vertexpos++] = posA.x;
          linePositions[vertexpos++] = posA.y;
          linePositions[vertexpos++] = posA.z;
          linePositions[vertexpos++] = posB.x;
          linePositions[vertexpos++] = posB.y;
          linePositions[vertexpos++] = posB.z;

          lineColors[colorpos++] = lineColor.r;
          lineColors[colorpos++] = lineColor.g;
          lineColors[colorpos++] = lineColor.b;
          lineColors[colorpos++] = lineColor.r;
          lineColors[colorpos++] = lineColor.g;
          lineColors[colorpos++] = lineColor.b;
          numConnected += 1;
        }
      }
    }

    linesMesh.geometry.setDrawRange(0, numConnected * 2);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;
  }

  function customOnUpdate() {
    if (!state.enabled) {
      if (originalOnUpdate) {
        originalOnUpdate();
      }
      return;
    }

    const now = performance.now();
    const pointer = state.pointer;
    if (pointer.clickActive && now > pointer.clickUntil) {
      pointer.clickActive = false;
    }

    const camera = state.vanta.camera;
    const points = state.vanta.points || [];

    const c = camera;
    if (c) {
      if (c.tx == null) c.tx = c.position.x;
      if (c.ty == null) c.ty = c.position.y;
      if (c.tz == null) c.tz = c.position.z;
      if (Math.abs(c.tx - c.position.x) > 0.01) {
        c.position.x += (c.tx - c.position.x) * 0.02;
      }
      if (Math.abs(c.ty - c.position.y) > 0.01) {
        c.position.y += (c.ty - c.position.y) * 0.02;
      }
      if (Math.abs(c.tz - c.position.z) > 0.01) {
        c.position.z += (c.tz - c.position.z) * 0.02;
      }
      c.lookAt(new THREE.Vector3(0, 0, 0));
    }

    const pointerActive = pointer.active;
    if (pointerActive) {
      state.raycaster.setFromCamera({ x: pointer.ndcX, y: pointer.ndcY }, camera);
    }

    const candidateBuffer = state.candidateBuffer;
    candidateBuffer.length = 0;

    const affectRadius = state.options.affectRadius;
    const maxAffected = state.options.maxAffected;
    const width = state.bounds.width;
    const height = state.bounds.height;

    const tempProj = state.tempProjection;
    const scaleVec = state.tempOffsetDelta;

    for (let i = 0; i < points.length; i += 1) {
      const sphere = points[i];
      const particle = sphere.position;

      let distToMouse = 1000;
      if (pointerActive) {
        distToMouse = state.raycaster.ray.distanceToPoint(particle);
      }
      const distClamp = clamp(distToMouse, 5, 15);
      const scale = clamp((15 - distClamp) * 0.25, 1, 100);
      sphere.scale.set(scale, scale, scale);

      if (sphere.r !== 0) {
        let ang = Math.atan2(particle.z, particle.x);
        const dist = Math.sqrt(particle.z * particle.z + particle.x * particle.x);
        ang += 0.00025 * sphere.r;
        particle.x = dist * Math.cos(ang);
        particle.z = dist * Math.sin(ang);
      }

      const data = ensureVector(state.particleData, sphere, THREE);
      data.baseline.copy(particle);
      data.applied = false;

      if (pointerActive && affectRadius > 0) {
        tempProj.copy(particle).project(camera);
        const screenX = (tempProj.x + 1) * 0.5 * width;
        const screenY = (1 - (tempProj.y + 1) * 0.5) * height;
        const dx = screenX - pointer.x;
        const dy = screenY - pointer.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        if (distPx <= affectRadius) {
          candidateBuffer.push({
            sphere,
            data,
            distPx,
            baselineX: particle.x,
            baselineY: particle.y,
            baselineZ: particle.z,
          });
        }
      }
    }

    if (candidateBuffer.length > 0) {
      candidateBuffer.sort((a, b) => a.distPx - b.distPx);
    }

    const limit = Math.min(candidateBuffer.length, maxAffected);
    const baseStrength = pointer.clickActive ? state.options.clickStrength : state.options.hoverStrength;
    const falloffBase = affectRadius > 0 ? 1 / affectRadius : 0;

    for (let i = 0; i < limit; i += 1) {
      const item = candidateBuffer[i];
      const { sphere, data, distPx } = item;
      const baseline = data.baseline;
      const falloff = 1 - smoothstep(0, 1, distPx * falloffBase);
      if (falloff <= 0) continue;
      const strength = clamp(baseStrength * falloff, 0, 1);

      const pointerWorld = state.tempPointer;
      const pointerWorldDX = state.tempPointerDX;
      const pointerWorldDY = state.tempPointerDY;

      const hit = computePointerWorld(sphere, 0, 0, pointerWorld);
      if (!hit) continue;
      let pxToWorld = 1;
      if (computePointerWorld(sphere, 1, 0, pointerWorldDX)) {
        pxToWorld = pointerWorldDX.distanceTo(pointerWorld) || pxToWorld;
      }
      if (computePointerWorld(sphere, 0, 1, pointerWorldDY)) {
        const dyWorld = pointerWorldDY.distanceTo(pointerWorld) || pxToWorld;
        pxToWorld = (pxToWorld + dyWorld) * 0.5;
      }

      const target = computeTargetPosition(sphere, baseline, pointerWorld, pxToWorld, strength);
      data.tmp.copy(target).sub(baseline);
      scaleVec.copy(data.tmp).sub(data.offset);
      data.offset.addScaledVector(scaleVec, strength);
      data.applied = true;
    }

    const restoreFactor = clamp(1 - state.options.restoreEase, 0, 1);
    for (let i = 0; i < points.length; i += 1) {
      const sphere = points[i];
      const data = ensureVector(state.particleData, sphere, THREE);
      if (!data.applied) {
        data.offset.multiplyScalar(restoreFactor);
        if (data.offset.lengthSq() < 1e-5) {
          data.offset.set(0, 0, 0);
        }
      }
      sphere.position.copy(data.baseline).add(data.offset);
    }

    const lineAlignFactor = state.options.alignLines ? 1 : 0.35;
    recomputeLines(points, lineAlignFactor);

    resizeDebugCanvas(state);
    drawDebug(state);
  }

  vantaInstance.onUpdate = customOnUpdate;

  const controller = {
    setOptions(next) {
      if (!next || typeof next !== 'object') return;
      Object.assign(state.options, next);
      if (next.alignMode && ALIGN_MODES.has(next.alignMode)) {
        state.options.alignMode = next.alignMode;
      }
      if (next.axis && AXIS_MODES.has(next.axis)) {
        state.options.axis = next.axis;
      }
      if (typeof next.affectRadius === 'number' && next.affectRadius >= 0) {
        state.options.affectRadius = next.affectRadius;
      }
      if (typeof next.maxAffected === 'number') {
        state.options.maxAffected = Math.max(1, Math.floor(next.maxAffected));
      }
      if (typeof next.restoreEase === 'number') {
        state.options.restoreEase = clamp(next.restoreEase, 0, 1);
      }
      if (typeof next.hoverStrength === 'number') {
        state.options.hoverStrength = clamp(next.hoverStrength, 0, 1);
      }
      if (typeof next.clickStrength === 'number') {
        state.options.clickStrength = clamp(next.clickStrength, 0, 1);
      }
      if (typeof next.gridSize === 'number') {
        state.options.gridSize = Math.max(1, next.gridSize);
      }
      if (typeof next.circleRadius === 'number') {
        state.options.circleRadius = Math.max(0, next.circleRadius);
      }
      if (typeof next.flowCurl === 'number') {
        state.options.flowCurl = next.flowCurl;
      }
      if (typeof next.debugHelpers === 'boolean') {
        state.options.debugHelpers = next.debugHelpers;
        createDebugCanvas(state);
        resizeDebugCanvas(state);
      }
      if (typeof next.alignLines === 'boolean') {
        state.options.alignLines = next.alignLines;
      }
      updateColorState(state, THREE);
    },
    setAlignMode(mode) {
      if (ALIGN_MODES.has(mode)) {
        state.options.alignMode = mode;
      }
    },
    enable() {
      state.enabled = true;
    },
    disable() {
      state.enabled = false;
      state.pointer.active = false;
      state.pointer.down = false;
      state.pointer.clickActive = false;
    },
    destroy() {
      state.enabled = false;
      vantaInstance.onUpdate = originalOnUpdate;
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerenter', onPointerEnter);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('resize', updateBounds);
      if (state.debugCanvas) {
        state.debugCanvas.remove();
        state.debugCanvas = null;
        state.debugCtx = null;
      }
    },
  };

  return controller;
}

export { attachLocalClusterAlign };
