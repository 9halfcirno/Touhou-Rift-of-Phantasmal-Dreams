const EPS = 1e-6;

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

function sub(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

function length(v) {
    return Math.hypot(v.x, v.y);
}

function normalize(v) {
    const len = length(v);

    if (len < EPS) {
        return { x: 0, y: 0 };
    }

    return {
        x: v.x / len,
        y: v.y / len
    };
}

function perpendicular(v) {
    return {
        x: -v.y,
        y: v.x
    };
}

function rotate(v, r) {
    const c = Math.cos(r);
    const s = Math.sin(r);

    return {
        x: v.x * c - v.y * s,
        y: v.x * s + v.y * c
    };
}

function getWorldVerts(poly) {
    const out = [];

    for (const v of poly.verts) {
        const r = rotate(v, poly.rotation || 0);

        out.push({
            x: r.x + poly.x,
            y: r.y + poly.y
        });
    }

    return out;
}

function projectVerts(axis, verts) {
    let min = Infinity;
    let max = -Infinity;

    for (const v of verts) {
        const p = dot(v, axis);

        if (p < min) min = p;
        if (p > max) max = p;
    }

    return { min, max };
}

function projectCircle(axis, circle) {
    const center = dot(circle, axis);

    return {
        min: center - circle.r,
        max: center + circle.r
    };
}

function overlap(a, b) {
    return Math.min(a.max, b.max) - Math.max(a.min, b.min);
}

function getAxes(verts) {
    const axes = [];

    if (!verts || verts.length < 2)
        return axes;

    for (let i = 0; i < verts.length; i++) {
        const j = (i + 1) % verts.length;

        const edge = sub(verts[j], verts[i]);

        const lenSq =
            edge.x * edge.x +
            edge.y * edge.y;

        // 防止零长度 edge
        if (lenSq < EPS)
            continue;

        const axis =
            normalize(
                perpendicular(edge)
            );

        // 防止 NaN
        if (
            !Number.isFinite(axis.x) ||
            !Number.isFinite(axis.y)
        ) {
            continue;
        }

        axes.push(axis);
    }

    return axes;
}
function closestVertex(circle, verts) {
    let minDist = Infinity;
    let closest = null;

    for (const v of verts) {
        const dx = v.x - circle.x;
        const dy = v.y - circle.y;

        const d = dx * dx + dy * dy;

        if (d < minDist) {
            minDist = d;
            closest = v;
        }
    }

    return closest;
}

function polygonPolygon(A, B) {
    const vertsA = getWorldVerts(A);
    const vertsB = getWorldVerts(B);

    const axes = [
        ...getAxes(vertsA),
        ...getAxes(vertsB)
    ];

    let minOverlap = Infinity;
    let smallestAxis = null;

    for (const axis of axes) {
        const projA = projectVerts(axis, vertsA);
        const projB = projectVerts(axis, vertsB);

        const o = overlap(projA, projB);

        if (o <= 0) {
            return {
                intersects: false
            };
        }

        if (o < minOverlap) {
            minOverlap = o;
            smallestAxis = axis;
        }
    }

    const centerDir = normalize({
        x: B.x - A.x,
        y: B.y - A.y
    });

    if (dot(centerDir, smallestAxis) < 0) {
        smallestAxis = {
            x: -smallestAxis.x,
            y: -smallestAxis.y
        };
    }

    return {
        intersects: true,

        depth: minOverlap,

        normal: smallestAxis,

        mtv: {
            x: smallestAxis.x * minOverlap,
            y: smallestAxis.y * minOverlap
        }
    };
}

function circleCircle(A, B) {
    const dx = B.x - A.x;
    const dy = B.y - A.y;

    const distSq = dx * dx + dy * dy;

    const r = A.r + B.r;

    if (distSq >= r * r) {
        return {
            intersects: false
        };
    }

    const dist = Math.sqrt(distSq);

    const normal =
        dist < EPS
            ? { x: 1, y: 0 }
            : {
                x: dx / dist,
                y: dy / dist
            };

    const depth = r - dist;

    return {
        intersects: true,
        depth,
        normal,

        mtv: {
            x: normal.x * depth,
            y: normal.y * depth
        }
    };
}

function polygonCircle(poly, circle) {
    const verts = getWorldVerts(poly);

    // 防御
    if (!verts || verts.length === 0) {
        return {
            intersects: false
        };
    }

    const axes = getAxes(verts);

    // ===== 找最近顶点 =====

    let closest = verts[0];
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

    // ===== 圆心 -> 最近点 axis =====

    const axisToCircle = {
        x: closest.x - circle.x,
        y: closest.y - circle.y
    };

    const axisLen =
        axisToCircle.x * axisToCircle.x +
        axisToCircle.y * axisToCircle.y;

    // 防止 normalize(0,0)
    if (axisLen > EPS) {
        axes.push(
            normalize(axisToCircle)
        );
    }

    // ===== SAT =====

    let minOverlap = Infinity;
    let smallestAxis = null;

    for (const axis of axes) {
        const projA =
            projectVerts(axis, verts);

        const projB =
            projectCircle(axis, circle);

        const o = overlap(projA, projB);

        if (o <= 0) {
            return {
                intersects: false
            };
        }

        if (o < minOverlap) {
            minOverlap = o;
            smallestAxis = axis;
        }
    }

    // ===== 修正 normal 朝向 =====

    const centerDir = {
        x: circle.x - poly.x,
        y: circle.y - poly.y
    };

    if (dot(centerDir, smallestAxis) < 0) {
        smallestAxis = {
            x: -smallestAxis.x,
            y: -smallestAxis.y
        };
    }

    return {
        intersects: true,

        depth: minOverlap,

        normal: smallestAxis,

        mtv: {
            x: smallestAxis.x * minOverlap,
            y: smallestAxis.y * minOverlap
        }
    };
}

export function SAT(A, B) {
    if (A.shape === "circle") {
        if (B.shape === "circle") {
            return circleCircle(A, B);
        }

        return polygonCircle(B, A);
    }

    if (B.shape === "circle") {
        return polygonCircle(A, B);
    }

    return polygonPolygon(A, B);
}