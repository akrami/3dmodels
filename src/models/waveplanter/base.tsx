import * as React from "react";
import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices as mergeVerts,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { useMemo } from "react";
import { circle, extrude, useRingGearGeometry } from "./ringGear";
import type { WavePlanterProps } from "./props";

export default function BasePlanter({
  props,
  color,
  distance,
}: {
  props: WavePlanterProps;
  color: string;
  distance: number;
}) {
  const createBaseBottomGeometry = React.useCallback(() => {
    const shape = circle(props.radius - 4);
    return extrude(shape, 4);
  }, [props.radius]);

  const bottomGeometry = React.useMemo(
    () => createBaseBottomGeometry(),
    [createBaseBottomGeometry]
  );

  const ringGeom = useRingGearGeometry({
    radius: props.radius,
    amplitude: props.amplitude,
    density: props.density,
    depth: props.baseDepth,
    twistWaves: (props.baseDepth / props.depth) * props.twistWaves,
    reverseTwist: true,
    topCutDepth: 2,
  });

  const cleanGeometry = React.useCallback(
    (geometry: THREE.BufferGeometry) => {
      const nonIndexed = geometry.toNonIndexed();
      const merged = mergeVerts(nonIndexed, 1e-5);
      merged.computeVertexNormals();
      return merged;
    },
    []
  );

  const taghExt = useMemo(() => {
    const shape = new THREE.Shape()
      .moveTo(0, 0)
      .lineTo(15, 0)
      .lineTo(15, 10)
      .lineTo(0, 10)
      .closePath();

    // Extrude without bevels to avoid non-manifold edges when used in CSG ops
    const geom = extrude(shape, 16);
    const merged = mergeVerts(geom);
    merged.computeVertexNormals();
    return merged;
  }, []);

  const ringCutGeometry = useMemo(() => {
    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    const ringGeomClone = ringGeom.clone();
    ringGeomClone.clearGroups();
    const ringBrush = new Brush(ringGeomClone);
    ringBrush.updateMatrixWorld();

    const cutGeom = taghExt.clone();
    cutGeom.clearGroups();
    const cutBrush = new Brush(cutGeom);
    cutBrush.position.set(-5, props.radius - 5, props.baseDepth - 5.5);
    cutBrush.scale.set(0.76, 0.76, 1.1);
    cutBrush.updateMatrixWorld();

    const result = evaluator.evaluate(
      ringBrush,
      cutBrush,
      SUBTRACTION
    ) as THREE.Mesh;
    const geom = (result.geometry as THREE.BufferGeometry).clone();
    return cleanGeometry(geom);
  }, [ringGeom, taghExt, props.radius, props.baseDepth]);

  const taghCutGeometry = useMemo(() => {
    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    const baseGeom = taghExt.clone();
    baseGeom.clearGroups();
    const baseBrush = new Brush(baseGeom);
    baseBrush.updateMatrixWorld();

    const boxBrush = new Brush(new THREE.BoxGeometry(30, 10, 30));
    boxBrush.position.set(7, 12, 7);
    boxBrush.updateMatrixWorld();

    const innerGeom = taghExt.clone();
    innerGeom.clearGroups();
    const innerBrush = new Brush(innerGeom);
    innerBrush.position.set(2, 2, 2);
    innerBrush.scale.set(0.75, 0.75, 0.75);
    innerBrush.updateMatrixWorld();

    const cylBrush = new Brush(
      new THREE.CylinderGeometry(props.radius - 2.5, props.radius - 2.5, 30, 64)
    );
    cylBrush.position.set(7, 0, props.radius + 7.5);
    cylBrush.updateMatrixWorld();

    let result = evaluator.evaluate(
      baseBrush,
      boxBrush,
      SUBTRACTION
    ) as THREE.Mesh;
    result = evaluator.evaluate(result, innerBrush, SUBTRACTION) as THREE.Mesh;
    result = evaluator.evaluate(result, cylBrush, SUBTRACTION) as THREE.Mesh;

    const geom = (result.geometry as THREE.BufferGeometry).clone();
    return cleanGeometry(geom);
  }, [taghExt, props.radius]);

  return (
    <group
      name="baseplanter"
      position={[distance / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      <group>
        <mesh castShadow receiveShadow geometry={ringCutGeometry}>
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <mesh position={[0, 0, 2]} geometry={bottomGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </mesh>
      <group position={[-7, props.radius + 7.5, props.baseDepth - 7]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow geometry={taghCutGeometry}>
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}
