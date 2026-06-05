/**
 * SAT (Separating Axis Theorem) 碰撞检测
 *
 * 2D 碰撞检测：支持圆形-圆形、矩形-矩形（多边形）、圆形-矩形。
 * 返回 MTV（最小平移向量）用于碰撞分离。
 *
 * 迁移自 code/sat.js
 */

const EPS = 1e-6;

// ─── 基础向量运算 ─────────────────────────────────

interface Vec2 { x: number; y: number }

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len < EPS) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

function rotate(v: Vec2, r: number): Vec2 {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

// ─── 形状定义 ─────────────────────────────────────

export interface PolyShape {
  shape: 'polygon';
  x: number;
  y: number;
  rotation: number;
  verts: Vec2[];
}

export interface CircleShape {
  shape: 'circle';
  x: number;
  y: number;
  r: number;
}

export type Shape = PolyShape | CircleShape;

export interface SATResult {
  intersects: boolean;
  depth?: number;
  normal?: Vec2;
  mtv?: Vec2;
}

// ─── 世界坐标转换 ─────────────────────────────────

function getWorldVerts(poly: PolyShape): Vec2[] {
  const out: Vec2[] = [];
  for (const v of poly.verts) {
    const r = rotate(v, poly.rotation || 0);
    out.push({ x: r.x + poly.x, y: r.y + poly.y });
  }
  return out;
}

// ─── 投影 ─────────────────────────────────────────

interface Projection { min: number; max: number }

function projectVerts(axis: Vec2, verts: Vec2[]): Projection {
  let min = Infinity;
  let max = -Infinity;
  for (const v of verts) {
    const p = dot(v, axis);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return { min, max };
}

function projectCircle(axis: Vec2, circle: CircleShape): Projection {
  const center = dot(circle, axis);
  return { min: center - circle.r, max: center + circle.r };
}

function overlap(a: Projection, b: Projection): number {
  return Math.min(a.max, b.max) - Math.max(a.min, b.min);
}

// ─── 轴提取 ───────────────────────────────────────

function getAxes(verts: Vec2[]): Vec2[] {
  const axes: Vec2[] = [];
  if (!verts || verts.length < 2) return axes;

  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length;
    const edge = sub(verts[j]!, verts[i]!);
    const lenSq = edge.x * edge.x + edge.y * edge.y;
    if (lenSq < EPS) continue;

    const axis = normalize(perpendicular(edge));
    if (!Number.isFinite(axis.x) || !Number.isFinite(axis.y)) continue;
    axes.push(axis);
  }
  return axes;
}

// ─── 碰撞检测 ─────────────────────────────────────

function polygonPolygon(A: PolyShape, B: PolyShape): SATResult {
  const vertsA = getWorldVerts(A);
  const vertsB = getWorldVerts(B);
  const axes = [...getAxes(vertsA), ...getAxes(vertsB)];

  let minOverlap = Infinity;
  let smallestAxis: Vec2 | null = null;

  for (const axis of axes) {
    const projA = projectVerts(axis, vertsA);
    const projB = projectVerts(axis, vertsB);
    const o = overlap(projA, projB);
    if (o <= 0) return { intersects: false };
    if (o < minOverlap) {
      minOverlap = o;
      smallestAxis = axis;
    }
  }

  const centerDir = normalize({ x: B.x - A.x, y: B.y - A.y });
  if (smallestAxis && dot(centerDir, smallestAxis) < 0) {
    smallestAxis = { x: -smallestAxis.x, y: -smallestAxis.y };
  }

  return {
    intersects: true,
    depth: minOverlap,
    normal: smallestAxis!,
    mtv: smallestAxis
      ? { x: smallestAxis.x * minOverlap, y: smallestAxis.y * minOverlap }
      : { x: 0, y: 0 },
  };
}

function circleCircle(A: CircleShape, B: CircleShape): SATResult {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = A.r + B.r;

  if (distSq >= radiusSum * radiusSum) return { intersects: false };

  const dist = Math.sqrt(distSq);
  const depth = radiusSum - dist;
  const nx = dist > EPS ? dx / dist : 1;
  const ny = dist > EPS ? dy / dist : 0;

  return {
    intersects: true,
    depth,
    normal: { x: nx, y: ny },
    mtv: { x: nx * depth, y: ny * depth },
  };
}

function circlePolygon(circle: CircleShape, poly: PolyShape): SATResult {
  const verts = getWorldVerts(poly);

  if (!verts || verts.length === 0) {
    return { intersects: false };
  }

  const axes = getAxes(verts);

  // 找最近顶点 —— 圆心到该顶点的轴也需要检测
  let closest = verts[0]!;
  let minDist = Infinity;

  for (const v of verts) {
    const dx = v.x - circle.x;
    const dy = v.y - circle.y;
    const d = dx * dx + dy * dy;
    if (d < minDist) {
      minDist = d;
      closest = v;
    }
  }

  // 圆心 → 最近顶点轴
  const axisToCircle = { x: closest.x - circle.x, y: closest.y - circle.y };
  const axisLen = axisToCircle.x * axisToCircle.x + axisToCircle.y * axisToCircle.y;
  if (axisLen > EPS) {
    axes.push(normalize(axisToCircle));
  }

  // ─── SAT（多边形轴 + 圆心-顶点轴）──────────────

  let minOverlap = Infinity;
  let smallestAxis: Vec2 | null = null;

  for (const axis of axes) {
    const projA = projectVerts(axis, verts);
    const projB = projectCircle(axis, circle);
    const o = overlap(projA, projB);
    if (o <= 0) return { intersects: false };
    if (o < minOverlap) {
      minOverlap = o;
      smallestAxis = axis;
    }
  }

  // 修正 normal 朝向
  const centerDir = { x: circle.x - poly.x, y: circle.y - poly.y };
  if (smallestAxis && dot(centerDir, smallestAxis) < 0) {
    smallestAxis = { x: -smallestAxis.x, y: -smallestAxis.y };
  }

  return {
    intersects: true,
    depth: minOverlap,
    normal: smallestAxis!,
    mtv: smallestAxis
      ? { x: smallestAxis.x * minOverlap, y: smallestAxis.y * minOverlap }
      : { x: 0, y: 0 },
  };
}

// ─── 公共 API ─────────────────────────────────────

/**
 * SAT 碰撞检测入口
 *
 * @returns 碰撞结果（intersects, mtv, normal, depth）
 */
export function SAT(A: Shape, B: Shape): SATResult {
  if (A.shape === 'circle' && B.shape === 'circle') {
    return circleCircle(A as CircleShape, B as CircleShape);
  }

  if (A.shape === 'polygon' && B.shape === 'polygon') {
    return polygonPolygon(A as PolyShape, B as PolyShape);
  }

  // 圆形 vs 多边形
  if (A.shape === 'circle' && B.shape === 'polygon') {
    return circlePolygon(A as CircleShape, B as PolyShape);
  }

  if (A.shape === 'polygon' && B.shape === 'circle') {
    const result = circlePolygon(B as CircleShape, A as PolyShape);
    if (result.intersects && result.normal && result.mtv) {
      result.normal = { x: -result.normal.x, y: -result.normal.y };
      result.mtv = { x: -result.mtv.x, y: -result.mtv.y };
    }
    return result;
  }

  return { intersects: false };
}
