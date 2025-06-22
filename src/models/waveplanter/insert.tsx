import * as React from "react";
import * as THREE from "three";
import { mergeGeometries, mergeVertices as mergeVerts } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { circle, extrude } from "./ringGear";
import type { WavePlanterProps } from "./props";

export default function InsertObject({ props, color }: { props: WavePlanterProps; color: string }) {
  const geometry = React.useMemo(() => {
    const height = Math.max(props.baseDepth - 12, 0);

    const ringShape = circle(10);
    ringShape.holes.push(new THREE.Path().absarc(0, 0, 8, 0, Math.PI * 2, true));
    const ringGeom = extrude(ringShape, 2);
    ringGeom.translate(0, 0, height + 2);

    const cylGeom = extrude(circle(10), height);
    cylGeom.translate(0, 0, 2);

    const diskGeom = extrude(circle(8), 2);

    const outer = mergeGeometries([diskGeom, cylGeom, ringGeom], false)!;

    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    const innerGeom = extrude(circle(8), height + 2);
    innerGeom.translate(0, 0, 2);
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

    for (let i = 0; i < verticalCount; i++) {
      const z = 2 + holeSpacing / 2 + i * holeSpacing;
      const offset = (i % 2) * angleStep * 0.5;
      for (let j = 0; j < aroundCount; j++) {
        const angle = j * angleStep + offset;
        const x = Math.cos(angle) * radial;
        const y = Math.sin(angle) * radial;
        const hole = new Brush(new THREE.CylinderGeometry(holeRadius, holeRadius, 20, 32));
        hole.position.set(x, y, z);
        hole.rotation.set(0, 0, angle);
        hole.rotateX(Math.PI / 2);
        hole.updateMatrixWorld();
        result = evaluator.evaluate(result, hole, SUBTRACTION) as THREE.Mesh;
      }
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
    const slotGeom = extrude(slotShape, 2);

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
