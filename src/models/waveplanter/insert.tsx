import * as React from "react";
import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices as mergeVerts,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type { WavePlanterProps } from "./props";

export default function InsertObject({ props, color }: { props: WavePlanterProps; color: string }) {
  const geometry = React.useMemo(() => {
    const height = Math.max(props.baseDepth - 12, 0);

    // --- basic outer shell ---
    const ringGeom = new THREE.CylinderGeometry(10, 10, 2, 16);
    ringGeom.translate(0, 0, height + 3);

    const cylGeom = new THREE.CylinderGeometry(10, 10, height, 16, 1, true);
    cylGeom.translate(0, 0, 2 + height / 2);

    const shell = mergeGeometries([ringGeom, cylGeom], false)!;

    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    // subtract inner space while keeping the bottom disk
    const innerGeom = new THREE.CylinderGeometry(8, 8, height + 2, 16);
    innerGeom.translate(0, 0, 3 + height / 2);
    let result = evaluator.evaluate(
      new Brush(shell),
      new Brush(innerGeom),
      SUBTRACTION
    ) as THREE.Mesh;

    // add the bottom disk as a separate geometry
    const diskGeom = new THREE.CylinderGeometry(8, 8, 2, 16);
    diskGeom.translate(0, 0, 1);
    let geom = mergeGeometries([
      (result.geometry as THREE.BufferGeometry).clone(),
      diskGeom,
    ], false)!;

    // --- light cylindrical holes ---
    if (height > 2) {
      const holeGeoms: THREE.BufferGeometry[] = [];
      const aroundCount = 6;
      const verticalCount = Math.min(2, Math.floor(height / 8));
      const radial = 9;

      for (let i = 0; i < verticalCount; i++) {
        const z = 4 + i * 8;
        for (let j = 0; j < aroundCount; j++) {
          const angle = (j / aroundCount) * Math.PI * 2;
          const x = Math.cos(angle) * radial;
          const y = Math.sin(angle) * radial;
          const g = new THREE.CylinderGeometry(2, 2, 4, 6);
          g.rotateX(Math.PI / 2);
          g.translate(x, y, z);
          holeGeoms.push(g);
        }
      }

      if (holeGeoms.length > 0) {
        const holes = mergeGeometries(holeGeoms, false)!;
        result = evaluator.evaluate(new Brush(geom), new Brush(holes), SUBTRACTION) as THREE.Mesh;
        geom = (result.geometry as THREE.BufferGeometry).clone();
      }
    }

    // --- bottom slots arranged like triangle medians ---
    const slotLength = 12;
    const slotWidth = 3;
    const slotRadius = slotWidth / 2;
    const halfLen = slotLength / 2 - slotRadius;
    const slotShape = new THREE.Shape()
      .moveTo(-halfLen, slotRadius)
      .lineTo(halfLen, slotRadius)
      .absarc(halfLen, 0, slotRadius, Math.PI / 2, -Math.PI / 2, false)
      .lineTo(-halfLen, -slotRadius)
      .absarc(-halfLen, 0, slotRadius, -Math.PI / 2, Math.PI / 2, false);
    slotShape.closePath();

    const slotGeom = new THREE.ExtrudeGeometry(slotShape, {
      depth: 2,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 8,
    });

    const slotBrushes: Brush[] = [];
    for (let i = 0; i < 3; i++) {
      const g = slotGeom.clone();
      const b = new Brush(g);
      b.rotation.set(0, 0, (i / 3) * Math.PI * 2);
      b.updateMatrixWorld();
      slotBrushes.push(b);
    }

    for (const b of slotBrushes) {
      result = evaluator.evaluate(new Brush(geom), b, SUBTRACTION) as THREE.Mesh;
      geom = (result.geometry as THREE.BufferGeometry).clone();
    }

    const merged = mergeVerts(geom, 1e-5);
    merged.computeVertexNormals();
    return merged;
  }, [props.baseDepth]);

  const height = Math.max(props.baseDepth - 12, 0);
  const positionZ = props.baseDepth - (height + 4);

  return (
    <mesh geometry={geometry} castShadow receiveShadow position={[0, 0, positionZ]}>
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
