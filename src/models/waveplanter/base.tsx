import * as React from "react";
import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices as mergeVerts,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Geometry, Base, Subtraction } from "@react-three/csg";
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

  return (
    <group
      name="baseplanter"
      position={[distance / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      <group>
        <mesh castShadow receiveShadow>
          <Geometry showOperations={false} computeVertexNormals>
            <Base geometry={ringGeom} />
            <Subtraction
              geometry={taghExt}
              position={[-5, props.radius - 5, props.baseDepth - 5]}
              scale={[0.75, 0.75, 0.75]}
            />
          </Geometry>
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <mesh position={[0, 0, 2]} geometry={bottomGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </mesh>
      <group position={[-7, props.radius + 7.5, props.baseDepth - 7]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <Geometry showOperations={false}>
            <Base geometry={taghExt} />
            <Subtraction position={[7, 12, 7]}>
              <boxGeometry args={[30, 10, 30]} />
            </Subtraction>
            <Subtraction geometry={taghExt} position={[2, 2, 2]} scale={[0.75, 0.75, 0.75]} />
            <Subtraction position={[7, 0, props.radius + 7.5]}>
              <cylinderGeometry args={[props.radius - 2.5, props.radius - 2.5, 30, 64]} />
            </Subtraction>
          </Geometry>
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}
