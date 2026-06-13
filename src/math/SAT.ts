/**
 * SAT (Separating Axis Theorem) 碰撞检测
 *
 * 2D 碰撞检测：支持圆形-圆形、矩形-矩形（多边形）、圆形-矩形。
 * 返回 MTV（最小平移向量）用于碰撞分离。
 * * [修复说明]: 
 * 引入了接近容差（1e-4）与中心轴对齐权重。
 * 修复了在角部碰撞时由于 X/Y 轴重叠量极度接近，导致分离轴频繁切换（物理挤压/抖动）的问题。
 */

const EPS = 1e-6;
const TOLERANCE = 1e-4; // 轴切换的重叠量容差

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

  // 预计算中心连线方向，用于后续比较权重以及法线修正
  const centerDx = B.x - A.x;
  const centerDy = B.y - A.y;
  const centerDist = Math.hypot(centerDx, centerDy);
  const centerDir = centerDist > EPS ? { x: centerDx / centerDist, y: centerDy / centerDist } : { x: 1, y: 0 };

  for (const axis of axes) {
    const projA = projectVerts(axis, vertsA);
    const projB = projectVerts(axis, vertsB);
    const o = overlap(projA, projB);

    if (o <= 0) return { intersects: false };

    if (o < minOverlap) {
      // 容差判断：如果新的重叠量与当前最小重叠量非常接近
      const isClose = (minOverlap !== Infinity) && (minOverlap - o < TOLERANCE);
      if (isClose && smallestAxis) {
        // 选择与物体中心连线方向更平行的轴，避免角部碰撞时在正交轴之间反复横跳
        const currentAlignment = Math.abs(dot(centerDir, smallestAxis));
        const newAlignment = Math.abs(dot(centerDir, axis));
        if (newAlignment > currentAlignment) {
          minOverlap = o;
          smallestAxis = axis;
        }
      } else {
        minOverlap = o;
        smallestAxis = axis;
      }
    }
  }

  // 确保法线方向始终从 A 指向 B
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

  // 寻找距离圆心最近的顶点
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

  // 将圆心到最近顶点的轴加入检测
  const axisToCircle = { x: closest.x - circle.x, y: closest.y - circle.y };
  const axisLen = Math.hypot(axisToCircle.x, axisToCircle.y);
  if (axisLen > EPS) {
    axes.push({ x: axisToCircle.x / axisLen, y: axisToCircle.y / axisLen });
  }

  // 预计算中心方向，多边形指向圆形
  const centerDx = poly.x - circle.x;
  const centerDy = poly.y - circle.y;
  const centerDist = Math.hypot(centerDx, centerDy);
  const centerDir = centerDist > EPS ? { x: centerDx / centerDist, y: centerDy / centerDist } : { x: 1, y: 0 };

  let minOverlap = Infinity;
  let smallestAxis: Vec2 | null = null;

  for (const axis of axes) {
    const projA = projectVerts(axis, verts);
    const projB = projectCircle(axis, circle);
    const o = overlap(projA, projB);

    if (o <= 0) return { intersects: false };

    if (o < minOverlap) {
      const isClose = (minOverlap !== Infinity) && (minOverlap - o < TOLERANCE);
      if (isClose && smallestAxis) {
        const currentAlignment = Math.abs(dot(centerDir, smallestAxis));
        const newAlignment = Math.abs(dot(centerDir, axis));
        if (newAlignment > currentAlignment) {
          minOverlap = o;
          smallestAxis = axis;
        }
      } else {
        minOverlap = o;
        smallestAxis = axis;
      }
    }
  }

  // 修正 normal 朝向：确保法线方向始终从 Circle 指向 Polygon
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

  // 圆形 vs 多边形：保证返回的 MTV 是 A(circle) 指向 B(polygon)
  if (A.shape === 'circle' && B.shape === 'polygon') {
    return circlePolygon(A as CircleShape, B as PolyShape);
  }

  // 多边形 vs 圆形：复用上面的逻辑，但需要反转法线和 MTV
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