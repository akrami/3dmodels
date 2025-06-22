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

    const ringGeom = new THREE.CylinderGeometry(10, 10, 2, 16, 1, true);
    ringGeom.translate(0, 0, height + 3);

    const cylGeom = new THREE.CylinderGeometry(10, 10, height, 16, 1, true);
    cylGeom.translate(0, 0, 2 + height / 2);

    const diskGeom = new THREE.CylinderGeometry(8, 8, 2, 16);
    diskGeom.translate(0, 0, 1);

    const outer = mergeGeometries([diskGeom, cylGeom, ringGeom], false)!;

    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    const innerGeom = new THREE.CylinderGeometry(8, 8, height + 2, 16, 1, true);
    innerGeom.translate(0, 0, 3 + height / 2);
    let result = evaluator.evaluate(
      new Brush(outer),
      new Brush(innerGeom),
      SUBTRACTION
    ) as THREE.Mesh;

    const holeRadius = 2;
    const holeSpacing = 8;
    const radial = 9;
    const circumference = 2 * Math.PI * radial;
    const aroundCount = Math.max(3, Math.floor(circumference / holeSpacing));
    const angleStep = (2 * Math.PI) / aroundCount;
    const verticalCount = Math.max(1, Math.floor(height / holeSpacing));

    const holeGeoms: THREE.BufferGeometry[] = [];
    for (let i = 0; i < verticalCount; i++) {
      const z = 2 + holeSpacing / 2 + i * holeSpacing;
      const offset = (i % 2) * angleStep * 0.5;
      for (let j = 0; j < aroundCount; j++) {
        const angle = j * angleStep + offset;
        const x = Math.cos(angle) * radial;
        const y = Math.sin(angle) * radial;
        const g = new THREE.CylinderGeometry(holeRadius, holeRadius, 4, 8);
        g.rotateX(Math.PI / 2);
        g.translate(x, y, z);
        holeGeoms.push(g);
      }
    }
    if (holeGeoms.length > 0) {
      const holes = mergeGeometries(holeGeoms, false)!;
      result = evaluator.evaluate(result, new Brush(holes), SUBTRACTION) as THREE.Mesh;
    }

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
      curveSegments: 16,
    });

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const brush = new Brush(slotGeom.clone());
      brush.position.set(0, 0, 0);
      brush.rotation.set(0, 0, angle);
      brush.updateMatrixWorld();
      result = evaluator.evaluate(result, brush, SUBTRACTION) as THREE.Mesh;
    }

    const geom = (result.geometry as THREE.BufferGeometry).clone();
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
