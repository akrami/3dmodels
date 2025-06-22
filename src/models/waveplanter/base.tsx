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

  const taghExt = useMemo(() => {
    const shape = new THREE.Shape()
      .moveTo(0, 0)
      .lineTo(15, 0)
      .lineTo(15, 10)
      .lineTo(0, 10)
      .closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 16,
      bevelEnabled: true,
      bevelThickness: 3,
      bevelSize: 3,
      bevelSegments: 16,
    });

    const merged = mergeVerts(geom);
    merged.computeVertexNormals();
    return merged;
  }, []);

  const ringCutGeometry = useMemo(() => {
    const evaluator = new Evaluator();
    const ringBrush = new Brush(ringGeom.clone());
    ringBrush.updateMatrixWorld();

    const cutBrush = new Brush(taghExt.clone());
    cutBrush.position.set(-5, props.radius - 5, props.baseDepth - 5);
    cutBrush.scale.set(0.75, 0.75, 0.75);
    cutBrush.updateMatrixWorld();

    const result = evaluator.evaluate(ringBrush, cutBrush, SUBTRACTION) as THREE.Mesh;
    const geom = (result.geometry as THREE.BufferGeometry).clone();
    geom.computeVertexNormals();
    return geom;
  }, [ringGeom, taghExt, props.radius, props.baseDepth]);

  const taghCutGeometry = useMemo(() => {
    const evaluator = new Evaluator();

    const baseBrush = new Brush(taghExt.clone());
    baseBrush.updateMatrixWorld();

    const boxBrush = new Brush(new THREE.BoxGeometry(30, 10, 30));
    boxBrush.position.set(7, 12, 7);
    boxBrush.updateMatrixWorld();

    const innerBrush = new Brush(taghExt.clone());
    innerBrush.position.set(2, 2, 2);
    innerBrush.scale.set(0.75, 0.75, 0.75);
    innerBrush.updateMatrixWorld();

    const cylBrush = new Brush(
      new THREE.CylinderGeometry(props.radius - 2.5, props.radius - 2.5, 30, 64)
    );
    cylBrush.position.set(7, 0, props.radius + 7.5);
    cylBrush.updateMatrixWorld();

    let result = evaluator.evaluate(baseBrush, boxBrush, SUBTRACTION) as THREE.Mesh;
    result = evaluator.evaluate(result, innerBrush, SUBTRACTION) as THREE.Mesh;
    result = evaluator.evaluate(result, cylBrush, SUBTRACTION) as THREE.Mesh;

    const geom = (result.geometry as THREE.BufferGeometry).clone();
    geom.computeVertexNormals();
    return geom;
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
