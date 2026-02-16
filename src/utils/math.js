export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function randomPointInCircle(radius) {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.sqrt(Math.random()) * radius;
  return {
    x: Math.cos(angle) * dist,
    z: Math.sin(angle) * dist,
  };
}

export function randomAroundEdge(radius, edgePadding = 0.92) {
  const angle = Math.random() * Math.PI * 2;
  const dist = radius * edgePadding;
  return {
    x: Math.cos(angle) * dist,
    z: Math.sin(angle) * dist,
  };
}

export function distanceXZ(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}
