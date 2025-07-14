import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function createWavyGeometry(
  radius: number,
  amplitude: number,
  density: number,
  depth: number,
  twistWaves = 1,
  segments = 1024,
  reverseTwist = false,
  topCutDepth = 0,
): THREE.BufferGeometry {

    const k = Math.round(radius * density);
    const rOuter = (t: number) => radius + amplitude - Math.abs(Math.sin(k * t));
    const rInner = radius - (amplitude + 4);

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

    const outerShape = makeOuterShape();
    const holeBottom = new THREE.Path().absarc(0, 0, rInner, 0, Math.PI * 2, true);
    outerShape.holes.push(holeBottom);
    const geometry = extrude(outerShape, depth, 32);

    twistGeometry(geometry, depth, twistWaves, reverseTwist);

    const merged = mergeVertices(geometry);
    merged.computeVertexNormals();
    merged.rotateX(-Math.PI / 2);
    return merged;
}

export function twistGeometry(
  geom: THREE.BufferGeometry,
  depth: number,
  twistWaves: number,
  reverse: boolean,
): void {
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

export function extrude(shape: THREE.Shape, depth: number, steps = 1): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: false,
    curveSegments: 32,
    depth,
    steps,
  });
}

