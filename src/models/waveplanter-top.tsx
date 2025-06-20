import * as React from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type ThreeElements } from "@react-three/fiber";
import { circle, extrude, useRingGearGeometry } from "./ringGear";
import type { WavePlanterProps } from "./waveprops";

export default function WavePlanter({
  props,
  color,
  distance,
}: {
  props: WavePlanterProps;
  color: string;
  distance: number;
}) {
  const RingGear = ({
    radius,
    amplitude,
    density,
    depth,
    twistWaves = 1,
    segments = 1024,
    reverseTwist = false,
    topCutDepth = 0,
    material,
    ...meshProps
  }: {
    radius: number;
    amplitude: number;
    density: number;
    depth: number;
    twistWaves?: number;
    segments?: number;
    reverseTwist?: boolean;
    topCutDepth?: number;
    material?: THREE.Material | THREE.Material[];
  } & ThreeElements["mesh"]) => {
    const geometry = useRingGearGeometry({
      radius,
      amplitude,
      density,
      depth,
      twistWaves,
      segments,
      reverseTwist,
      topCutDepth,
    });

    React.useLayoutEffect(() => () => geometry.dispose(), [geometry]);

    return (
      <mesh geometry={geometry} material={material} {...meshProps}>
        {!material && (
          <meshStandardMaterial
            attach="material"
            color={color}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    );
  };

  const createWaveBottomGeometry = React.useCallback(() => {
    const outer = props.radius - 4;
    const holeCount = outer * 2 <= 50 ? 1 : 3;

    const positions: [number, number][] =
      holeCount === 1
        ? [[0, 0]]
        : Array.from({ length: holeCount }, (_, i) => {
            const ang = (i / holeCount) * Math.PI * 2;
            const dist = outer / 2;
            return [Math.cos(ang) * dist, Math.sin(ang) * dist] as [number, number];
          });

    const bottomShape = circle(outer);
    positions.forEach(([x, y]) => {
      const hole = new THREE.Path();
      hole.absarc(x, y, 9, 0, Math.PI * 2, true);
      bottomShape.holes.push(hole);
    });

    const bottom = extrude(bottomShape, 2);
    bottom.translate(0, 0, -2);

    const topShape = circle(outer);
    positions.forEach(([x, y]) => {
      const hole = new THREE.Path();
      hole.absarc(x, y, 10, 0, Math.PI * 2, true);
      topShape.holes.push(hole);
    });

    const top = extrude(topShape, 2);
    return mergeGeometries([bottom, top], false)!;
  }, [props.radius]);

  const bottomGeometry = React.useMemo(
    () => createWaveBottomGeometry(),
    [createWaveBottomGeometry]
  );

  return (
    <group name="waveplanter" castShadow receiveShadow position={[-distance / 2, 0, 0]}>
      <RingGear
        radius={props.radius}
        amplitude={props.amplitude}
        density={props.density}
        depth={props.depth}
        twistWaves={props.twistWaves}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />
      <mesh geometry={bottomGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
