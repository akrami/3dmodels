import * as React from "react";
import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices as mergeVerts,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const EXTRUDE_SETTINGS = { bevelEnabled: false, curveSegments: 64 } as const;

export function circle(radius: number) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape;
}

export function extrude(shape: THREE.Shape, depth: number, steps = 1) {
  return new THREE.ExtrudeGeometry(shape, { ...EXTRUDE_SETTINGS, depth, steps });
}

function twistGeometry(
  geom: THREE.BufferGeometry,
  depth: number,
  twistWaves: number,
  reverse: boolean
) {
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = v.z / depth;
    const tt = reverse ? 1 - t : t;
    const dir = reverse ? -1 : 1;
    const angle = Math.sin(tt * twistWaves * Math.PI * 2) * dir;
    v.applyEuler(new THREE.Euler(0, 0, angle));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
}

export interface RingGearOptions {
  radius: number;
  amplitude: number;
  density: number;
  depth: number;
  twistWaves?: number;
  segments?: number;
  reverseTwist?: boolean;
  topCutDepth?: number;
}

const TWIST_SEGMENTS = 64;

export function createRingGearGeometry(options: RingGearOptions) {
  const {
    radius,
    amplitude,
    density,
    depth,
    twistWaves = 1,
    segments = 1024,
    reverseTwist = false,
    topCutDepth = 0,
  } = options;

  const k = Math.round(radius * density);
  const rOuter = (t: number) => radius + amplitude - Math.abs(Math.sin(k * t));
  const rInner = radius - (amplitude + 4);
  const rInnerCut = radius - 4;

  const makeOuterShape = () => {
    const shape = new THREE.Shape();
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const r = rOuter(t);
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  };

  const bottomDepth = Math.max(depth - topCutDepth, 0);
  const bottomSteps = Math.max(1, Math.round((bottomDepth / depth) * TWIST_SEGMENTS));
  const topSteps = Math.max(1, TWIST_SEGMENTS - bottomSteps);

  const outerShape = makeOuterShape();
  const holeBottom = new THREE.Path().absarc(0, 0, rInner, 0, Math.PI * 2, true);
  const bottomShape = outerShape.clone();
  bottomShape.holes.push(holeBottom);
  const bottomGeom = extrude(bottomShape, bottomDepth, bottomSteps);

  const geoms: THREE.BufferGeometry[] = [bottomGeom];

  if (topCutDepth > 0) {
    const outerShapeTop = makeOuterShape();
    const holeTop = new THREE.Path().absarc(0, 0, rInnerCut, 0, Math.PI * 2, true);
    outerShapeTop.holes.push(holeTop);
    const topGeom = extrude(outerShapeTop, topCutDepth, topSteps);
    topGeom.translate(0, 0, bottomDepth);
    geoms.push(topGeom);
  }

  const geom = mergeGeometries(geoms, false)!;

  twistGeometry(geom, depth, twistWaves, reverseTwist);

  const merged = mergeVerts(geom);
  merged.computeVertexNormals();
  return merged;
}

export function useRingGearGeometry(options: RingGearOptions) {
  const { radius, amplitude, density, depth, twistWaves, segments, reverseTwist, topCutDepth } = options;
  return React.useMemo(
    () =>
      createRingGearGeometry({
        radius,
        amplitude,
        density,
        depth,
        twistWaves,
        segments,
        reverseTwist,
        topCutDepth,
      }),
    [radius, amplitude, density, depth, twistWaves, segments, reverseTwist, topCutDepth]
  );
}
