import * as THREE from "three";

/**
 * Procedural round brilliant cut.
 *
 * The stone is built facet by facet from explicit planar polygons: an 8 sided table, 8 star
 * facets, 8 bezel (kite) facets, 16 upper girdle facets, a faceted girdle, 16 lower girdle
 * facets and 8 pavilion mains meeting at the culet. Vertices are never shared between facets,
 * so computeVertexNormals() yields one flat normal per facet and every facet edge stays crisp.
 *
 * Conventions: y is up, the girdle plane is y = 0 before centring, and all sizes are relative
 * to the girdle radius passed to createBrilliantGeometry().
 */

const DEG = Math.PI / 180;

export interface DiamondOptions {
  /** Table diameter as a fraction of the girdle diameter. */
  tableRatio: number;
  /** Bezel (crown main) facet angle to the girdle plane, in degrees. */
  crownAngle: number;
  /** Pavilion main facet angle to the girdle plane, in degrees. */
  pavilionAngle: number;
  /** Upper girdle (upper half) facet angle to the girdle plane, in degrees. */
  upperGirdleAngle: number;
  /** Lower girdle (lower half) facet angle to the girdle plane, in degrees. */
  lowerGirdleAngle: number;
  /** Girdle thickness at the bezel and pavilion main tips, as a fraction of the girdle diameter. */
  girdleThickness: number;
  /** Star facet length as a fraction of the radial span between table edge and girdle. */
  starLength: number;
  /** Lower half facet length as a fraction of the radial span between culet and girdle. */
  lowerHalfLength: number;
  /** Girdle subdivisions per half facet. The girdle gets 16 times this many facets. */
  girdleSegments: number;
  /** Culet diameter as a fraction of the girdle diameter. 0 gives a pointed culet. */
  culet: number;
  /** Translate the stone so its bounding box is centred on the origin. */
  center: boolean;
}

export const DEFAULT_DIAMOND_OPTIONS: DiamondOptions = {
  tableRatio: 0.57,
  crownAngle: 34.5,
  pavilionAngle: 40.8,
  upperGirdleAngle: 42,
  lowerGirdleAngle: 42,
  girdleThickness: 0.03,
  starLength: 0.55,
  lowerHalfLength: 0.78,
  girdleSegments: 4,
  culet: 0,
  center: true,
};

export type FacetName =
  | "table"
  | "star"
  | "bezel"
  | "upperGirdle"
  | "girdle"
  | "lowerGirdle"
  | "pavilionMain"
  | "culet";

export interface DiamondPolygon {
  name: FacetName;
  /** Outward wound, planar polygon in stone space (before centring). */
  pts: THREE.Vector3[];
}

export interface DiamondStats {
  radius: number;
  tablePercent: number;
  crownAngle: number;
  pavilionAngle: number;
  starAngle: number;
  upperGirdleAngle: number;
  lowerGirdleAngle: number;
  crownHeightPercent: number;
  pavilionDepthPercent: number;
  girdleMinPercent: number;
  girdleMaxPercent: number;
  totalDepthPercent: number;
  starLengthPercent: number;
  lowerHalfLengthPercent: number;
  girdleFacets: number;
  facetCounts: Partial<Record<FacetName, number>>;
  facets: number;
  triangles: number;
  /** Table to culet distance in world units. */
  height: number;
  yTable: number;
  yBottom: number;
  /** Vertical translation applied by createBrilliantGeometry() when centring. */
  verticalOffset: number;
}

function polar(r: number, azimuth: number, y: number): THREE.Vector3 {
  return new THREE.Vector3(r * Math.cos(azimuth), y, r * Math.sin(azimuth));
}

function newellNormal(pts: THREE.Vector3[]): THREE.Vector3 {
  const n = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    n.x += (p.y - q.y) * (p.z + q.z);
    n.y += (p.z - q.z) * (p.x + q.x);
    n.z += (p.x - q.x) * (p.y + q.y);
  }
  return n.normalize();
}

/**
 * Outward unit normal of the plane that contains the edge a-b, makes the given dihedral angle
 * with the girdle plane, and whose horizontal component points roughly toward preferredAzimuth.
 * ySign is +1 for crown facets (normal points up) and -1 for pavilion facets (normal points
 * down). Returns null when the angle cannot be reached from that edge.
 */
function solveFacetNormal(
  a: THREE.Vector3,
  b: THREE.Vector3,
  angleDeg: number,
  preferredAzimuth: number,
  ySign: 1 | -1,
): THREE.Vector3 | null {
  const s = Math.sin(angleDeg * DEG);
  const c = Math.cos(angleDeg * DEG) * ySign;
  const A = s * (b.x - a.x);
  const B = s * (b.z - a.z);
  const C = -c * (b.y - a.y);
  const amp = Math.hypot(A, B);
  if (amp < 1e-9 || Math.abs(C) > amp) return null;
  const base = Math.atan2(B, A);
  const delta = Math.acos(C / amp);
  let best = base + delta;
  let bestDist = Infinity;
  for (const psi of [base + delta, base - delta]) {
    let d = Math.abs(((psi - preferredAzimuth) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d < bestDist) {
      bestDist = d;
      best = psi;
    }
  }
  return new THREE.Vector3(s * Math.cos(best), c, s * Math.sin(best));
}

/** Height at which a plane (normal n through point p) meets the girdle cylinder at an azimuth. */
function heightOnCylinder(n: THREE.Vector3, p: THREE.Vector3, radius: number, azimuth: number): number {
  const d = n.dot(p);
  return (d - n.x * radius * Math.cos(azimuth) - n.z * radius * Math.sin(azimuth)) / n.y;
}

function tiltDegrees(n: THREE.Vector3): number {
  return Math.atan2(Math.hypot(n.x, n.z), Math.abs(n.y)) / DEG;
}

interface Sector {
  apex: THREE.Vector3;
  tip: THREE.Vector3;
  normal: THREE.Vector3;
  even: boolean;
}

/**
 * Builds the facet polygons and proportion statistics for a round brilliant.
 * Exposed so callers can derive edge overlays or inspect the cut without a BufferGeometry.
 */
export function buildBrilliant(
  radius = 1,
  options: Partial<DiamondOptions> = {},
): { polygons: DiamondPolygon[]; stats: DiamondStats } {
  const o: DiamondOptions = { ...DEFAULT_DIAMOND_OPTIONS, ...options };
  const R = radius;
  const D = 2 * R;
  const tanC = Math.tan(o.crownAngle * DEG);
  const tanP = Math.tan(o.pavilionAngle * DEG);
  const cosHalf = Math.cos(22.5 * DEG);

  const yGirdleTop = (o.girdleThickness * D) / 2;
  const yGirdleBottom = -yGirdleTop;

  const rTable = o.tableRatio * R;
  const yTable = yGirdleTop + tanC * (R - rTable);

  const rTableEdge = rTable * cosHalf;
  const rStar = rTableEdge + o.starLength * (R - rTableEdge);
  const yStar = yGirdleTop + tanC * (R - rStar * cosHalf);

  const yApex = yGirdleBottom - tanP * R;
  const rCulet = Math.max(0, o.culet) * R;
  const yCulet = yApex + tanP * rCulet * cosHalf;
  const rLower = rCulet + o.lowerHalfLength * (R - rCulet);
  const yLower = yApex + tanP * rLower * cosHalf;

  const N = 8;
  const step = (2 * Math.PI) / N;
  const half = step / 2;
  const quarter = half / 2;
  const n = Math.max(1, Math.floor(o.girdleSegments));
  const ringCount = 2 * N * n;
  const ringStep = half / n;

  // Named vertex rings. T: table corners, G: bezel tips on the girdle, S: star apexes,
  // P: pavilion main tips on the girdle, L: lower half junctions, C: culet corners.
  const T: THREE.Vector3[] = [];
  const G: THREE.Vector3[] = [];
  const S: THREE.Vector3[] = [];
  const P: THREE.Vector3[] = [];
  const L: THREE.Vector3[] = [];
  const C: THREE.Vector3[] = [];
  for (let k = 0; k < N; k++) {
    const theta = k * step;
    const phi = theta + half;
    T.push(polar(rTable, theta, yTable));
    G.push(polar(R, theta, yGirdleTop));
    S.push(polar(rStar, phi, yStar));
    P.push(polar(R, theta, yGirdleBottom));
    L.push(polar(rLower, phi, yLower));
    C.push(polar(rCulet, phi, yCulet));
  }

  // Half facets: sector f covers 22.5 degrees. Even sectors run from a main tip to the
  // junction, odd sectors from the junction to the next main tip. Each plane is solved from its
  // shared edge with the main facet plus its dihedral angle; if that angle is unreachable the
  // plane falls back to a junction at girdle height.
  const sectorPlane = (
    f: number,
    apexArr: THREE.Vector3[],
    tipArr: THREE.Vector3[],
    angle: number,
    junctionY: number,
    ySign: 1 | -1,
  ): Sector => {
    const k = Math.floor(f / 2);
    const even = f % 2 === 0;
    const apex = apexArr[k];
    const tip = even ? tipArr[k] : tipArr[(k + 1) % N];
    const centre = k * step + (even ? quarter : 3 * quarter);
    let normal = solveFacetNormal(apex, tip, angle, centre, ySign);
    if (!normal) {
      const junction = polar(R, k * step + half, junctionY);
      normal = new THREE.Vector3()
        .subVectors(tip, apex)
        .cross(new THREE.Vector3().subVectors(junction, apex))
        .normalize();
      if (normal.y * ySign < 0) normal.negate();
    }
    return { apex, tip, normal, even };
  };

  const upper: Sector[] = [];
  const lower: Sector[] = [];
  for (let f = 0; f < 2 * N; f++) {
    upper.push(sectorPlane(f, S, G, o.upperGirdleAngle, yGirdleTop, 1));
    lower.push(sectorPlane(f, L, P, o.lowerGirdleAngle, yGirdleBottom, -1));
  }

  // The girdle rings follow the half facet planes, so the girdle edge scallops exactly like a
  // cut stone while every facet stays planar. Points are shared between neighbouring facets.
  const top: THREE.Vector3[] = [];
  const bottom: THREE.Vector3[] = [];
  for (let i = 0; i < ringCount; i++) {
    const az = i * ringStep;
    const f = Math.floor(i / n);
    const j = i - f * n;
    const u = upper[f];
    const l = lower[f];
    if (j === 0 && u.even) {
      top.push(u.tip);
      bottom.push(l.tip);
    } else {
      top.push(polar(R, az, heightOnCylinder(u.normal, u.apex, R, az)));
      bottom.push(polar(R, az, heightOnCylinder(l.normal, l.apex, R, az)));
    }
  }

  const polygons: DiamondPolygon[] = [];
  const push = (name: FacetName, pts: THREE.Vector3[]) => polygons.push({ name, pts });

  push("table", T.slice());
  for (let k = 0; k < N; k++) push("star", [T[k], T[(k + 1) % N], S[k]]);
  for (let k = 0; k < N; k++) push("bezel", [T[k], S[(k + N - 1) % N], G[k], S[k]]);
  for (let f = 0; f < 2 * N; f++) {
    const pts = [upper[f].apex];
    for (let j = 0; j <= n; j++) pts.push(top[(f * n + j) % ringCount]);
    push("upperGirdle", pts);
  }
  for (let i = 0; i < ringCount; i++) {
    const i1 = (i + 1) % ringCount;
    push("girdle", [top[i], top[i1], bottom[i1], bottom[i]]);
  }
  for (let f = 0; f < 2 * N; f++) {
    const pts = [lower[f].apex];
    for (let j = 0; j <= n; j++) pts.push(bottom[(f * n + j) % ringCount]);
    push("lowerGirdle", pts);
  }
  const apex = new THREE.Vector3(0, yApex, 0);
  for (let k = 0; k < N; k++) {
    const prev = (k + N - 1) % N;
    if (rCulet > 0) push("pavilionMain", [C[prev], L[prev], P[k], L[k], C[k]]);
    else push("pavilionMain", [apex, L[prev], P[k], L[k]]);
  }
  if (rCulet > 0) push("culet", C.slice());

  const yBottom = rCulet > 0 ? yCulet : yApex;
  const inside = new THREE.Vector3(0, (yTable + yBottom) / 2, 0);

  // Wind every polygon outward. The stone is convex, so one interior point settles it.
  for (const poly of polygons) {
    const nrm = newellNormal(poly.pts);
    const centroid = new THREE.Vector3();
    for (const p of poly.pts) centroid.add(p);
    centroid.divideScalar(poly.pts.length);
    if (nrm.dot(centroid.clone().sub(inside)) < 0) poly.pts.reverse();
  }

  let girdleMin = Infinity;
  let girdleMax = 0;
  for (let i = 0; i < ringCount; i++) {
    const t = top[i].y - bottom[i].y;
    girdleMin = Math.min(girdleMin, t);
    girdleMax = Math.max(girdleMax, t);
  }

  const facetCounts: Partial<Record<FacetName, number>> = {};
  let triangles = 0;
  for (const poly of polygons) {
    facetCounts[poly.name] = (facetCounts[poly.name] ?? 0) + 1;
    triangles += poly.pts.length - 2;
  }

  const stats: DiamondStats = {
    radius: R,
    tablePercent: o.tableRatio * 100,
    crownAngle: o.crownAngle,
    pavilionAngle: o.pavilionAngle,
    starAngle: tiltDegrees(newellNormal([T[0], T[1], S[0]])),
    upperGirdleAngle: tiltDegrees(upper[0].normal),
    lowerGirdleAngle: tiltDegrees(lower[0].normal),
    crownHeightPercent: ((yTable - yGirdleTop) / D) * 100,
    pavilionDepthPercent: ((yGirdleBottom - yBottom) / D) * 100,
    girdleMinPercent: (girdleMin / D) * 100,
    girdleMaxPercent: (girdleMax / D) * 100,
    totalDepthPercent: ((yTable - yBottom) / D) * 100,
    starLengthPercent: o.starLength * 100,
    lowerHalfLengthPercent: o.lowerHalfLength * 100,
    girdleFacets: ringCount,
    facetCounts,
    facets: polygons.length,
    triangles,
    height: yTable - yBottom,
    yTable,
    yBottom,
    verticalOffset: o.center ? -(yTable + yBottom) / 2 : 0,
  };

  return { polygons, stats };
}

/**
 * Creates a non-indexed, flat shaded BufferGeometry of a round brilliant with the given girdle
 * radius. The result is closed and consistently wound, which the refraction shader's BVH relies on.
 */
export function createBrilliantGeometry(
  radius = 1,
  options: Partial<DiamondOptions> = {},
): THREE.BufferGeometry {
  const { polygons, stats } = buildBrilliant(radius, options);
  const positions = new Float32Array(stats.triangles * 9);
  let w = 0;
  const put = (p: THREE.Vector3) => {
    positions[w++] = p.x;
    positions[w++] = p.y + stats.verticalOffset;
    positions[w++] = p.z;
  };
  for (const { pts } of polygons) {
    for (let i = 1; i < pts.length - 1; i++) {
      put(pts[0]);
      put(pts[i]);
      put(pts[i + 1]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Proportions and facet counts for a stone built with the given options. */
export function getDiamondStats(radius = 1, options: Partial<DiamondOptions> = {}): DiamondStats {
  return buildBrilliant(radius, options).stats;
}
