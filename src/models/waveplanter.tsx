import * as React from "react";
import * as THREE from "three";
import { type ThreeElements } from "@react-three/fiber";
import ModelLayout from "@/layouts/modelLayout";

export interface WavePlanterProps extends Record<string, number> {
  radius: number;
  amplitude: number;
  density: number;
  depth: number;
  twistWaves: number;
}

export const MODEL_NAME = "wave";
const TWIST_SEGMENTS = 128;
export const DEFAULT_PROPS: WavePlanterProps = {
  radius: 100,
  amplitude: 0.2,
  density: 0.6,
  depth: 123,
  twistWaves: 1,
};

export function WavePlanterMesh({
  props = DEFAULT_PROPS,
  meshRef,
}: {
  props?: WavePlanterProps;
  meshRef?: React.RefObject<THREE.Mesh>;
}) {
  const RingGear = ({
    R,
    A,
    n,
    depth,
    rot = 0,
    twistWaves = 1,
    segments = 1024,
    material,
    ...meshProps
  }: {
    R: number;
    A: number;
    n: number;
    depth: number;
    rot?: number;
    twistWaves?: number;
    segments?: number;
    material?: THREE.Material | THREE.Material[];
  } & ThreeElements["mesh"]) => {
    const geometry = React.useMemo(() => {
      const k = Math.round(R * n);
      const rOuter = (t: number) => R + A - Math.abs(Math.sin(k * t));
      const rInner = R - (A + 4);

      const shape = new THREE.Shape();
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2;
        const r = rOuter(t);
        const x = r * Math.cos(t);
        const y = r * Math.sin(t);
        i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
      }
      shape.closePath();

      const hole = new THREE.Path().absarc(0, 0, rInner, 0, Math.PI * 2, true);
      shape.holes.push(hole);

      const geom = new THREE.ExtrudeGeometry(shape, {
        steps: TWIST_SEGMENTS,
        depth,
        bevelEnabled: false,
        curveSegments: 128,
      });

      if (rot !== 0) {
        const pos = geom.attributes.position as THREE.BufferAttribute;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          const t = v.z / depth;
          const angle = Math.sin(t * twistWaves * Math.PI * 2) * rot;
          const e = new THREE.Euler(0, 0, angle);
          v.applyEuler(e);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
      }
      return geom;
    }, [R, A, n, depth, segments, rot, twistWaves]);

    React.useLayoutEffect(() => () => geometry.dispose(), [geometry]);

    return (
      <mesh geometry={geometry} material={material} {...meshProps}>
        {!material && (
          <meshStandardMaterial
            attach="material"
            color="#4477ff"
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    );
  };

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <RingGear
        R={props.radius}
        A={props.amplitude}
        n={props.density}
        depth={props.depth}
        rot={Math.PI / 12}
        twistWaves={props.twistWaves}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />
      <meshStandardMaterial color="#AAAAAA" />
    </mesh>
  );
}

export default function WavePlanterModel() {
  const meshElement = <WavePlanterMesh />;
  return (
    <ModelLayout
      name={MODEL_NAME}
      defaultValues={DEFAULT_PROPS}
      camera={[0, -400, 300]}
      orbitDistance={500}
      ranges={{
        radius: { min: 25, max: 100, step: 25 },
        amplitude: { min: 0, max: 1, step: 0.05 },
        density: { min: 0, max: 1, step: 0.1 },
        depth: { min: 25, max: 600, step: 25 },
        twistWaves: { min: 0, max: 1, step: 0.01 },
      }}
      mesh={meshElement}
    />
  );
}
