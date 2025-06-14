import * as React from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type ThreeElements } from "@react-three/fiber";
import ModelLayout from "@/layouts/modelLayout";

export interface WavePlanterProps extends Record<string, number> {
  radius: number;
  amplitude: number;
  density: number;
  depth: number;
  /** Depth of the secondary base planter */
  baseDepth: number;
  twistWaves: number;
}

export const MODEL_NAME = "wave";
const TWIST_SEGMENTS = 128;
export const DEFAULT_PROPS: WavePlanterProps = {
  radius: 75,
  amplitude: 0.2,
  density: 0.3,
  depth: 100,
  baseDepth: 50,
  twistWaves: 0.5,
};

export function WavePlanterMesh({
  props = DEFAULT_PROPS,
  meshRef,
  color = "#AAAAAA",
}: {
  props?: WavePlanterProps;
  meshRef?: React.RefObject<THREE.Group>;
  color?: string;
}) {
  const RingGear = ({
    R,
    A,
    n,
    depth,
    rot = 0,
    twistWaves = 1,
    segments = 1024,
    reverseTwist = false,
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
    /** Reverse the twist direction */
    reverseTwist?: boolean;
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
          const tt = reverseTwist ? 1 - t : t;
          const dir = reverseTwist ? -1 : 1;
          const angle = Math.sin(tt * twistWaves * Math.PI * 2) * rot * dir;
          const e = new THREE.Euler(0, 0, angle);
          v.applyEuler(e);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
      }
      return geom;
    }, [R, A, n, depth, segments, rot, twistWaves, reverseTwist]);

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

  const createBottomGeometry = React.useCallback(
    (withHoles: boolean) => {
      const outer = props.radius - 4;
      const diameter = outer * 2;
      const holeCount = withHoles ? (diameter <= 50 ? 1 : 3) : 0;

      const createShape = (holeRadius: number) => {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, outer, 0, Math.PI * 2, false);

        if (holeCount > 0) {
          const positions: [number, number][] = [];
          if (holeCount === 1) {
            positions.push([0, 0]);
          } else {
            const dist = outer / 2;
            for (let i = 0; i < holeCount; i++) {
              const ang = (i / holeCount) * Math.PI * 2;
              positions.push([Math.cos(ang) * dist, Math.sin(ang) * dist]);
            }
          }

          positions.forEach(([x, y]) => {
            const hole = new THREE.Path();
            hole.absarc(x, y, holeRadius, 0, Math.PI * 2, true);
            shape.holes.push(hole);
          });
        }

        return shape;
      };

      const topShape = createShape(10);
      const bottomShape = createShape(9);

      const top = new THREE.ExtrudeGeometry(topShape, {
        depth: 2,
        bevelEnabled: false,
        curveSegments: 64,
      });

      const bottom = new THREE.ExtrudeGeometry(bottomShape, {
        depth: 2,
        bevelEnabled: false,
        curveSegments: 64,
      });
      bottom.translate(0, 0, -2);

      const geom = mergeGeometries([bottom, top], false);
      return geom!;
    },
    [props.radius]
  );

  const bottomGeometry = React.useMemo(
    () => createBottomGeometry(true),
    [createBottomGeometry]
  );
  const solidBottomGeometry = React.useMemo(
    () => createBottomGeometry(false),
    [createBottomGeometry]
  );

  const distance = props.radius * 2.5;

  const Planter = ({
    name,
    depth,
    holes = true,
    position = [0, 0, 0] as [number, number, number],
    reverseTwist = false,
    twistWaves = props.twistWaves,
    bottomOffset = 0,
  }: {
    name: string;
    depth: number;
    holes?: boolean;
    position?: [number, number, number];
    reverseTwist?: boolean;
    twistWaves?: number;
    /** Offset the bottom plate along Z */
    bottomOffset?: number;
  }) => (
    <group name={name} position={position} castShadow receiveShadow>
      <RingGear
        R={props.radius}
        A={props.amplitude}
        n={props.density}
        depth={depth}
        rot={Math.PI / 12}
        twistWaves={twistWaves}
        reverseTwist={reverseTwist}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={holes ? bottomGeometry : solidBottomGeometry}
        position={[0, 0, bottomOffset]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );

  return (
    <group ref={meshRef}>
      <Planter name="waveplanter" depth={props.depth} />
      <Planter
        name="baseplanter"
        depth={props.baseDepth}
        holes={false}
        position={[distance, 0, 0]}
        twistWaves={(props.baseDepth / props.depth) * props.twistWaves}
        reverseTwist
        bottomOffset={2}
      />
    </group>
  );
}

export default function WavePlanterModel() {
  const [color, setColor] = React.useState("#AAAAAA");
  const meshElement = <WavePlanterMesh color={color} />;
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
        baseDepth: { min: 25, max: 600, step: 25 },
        twistWaves: { min: 0, max: 1, step: 0.01 },
      }}
      mesh={meshElement}
    >
      <label className="flex flex-col gap-1 mb-4 text-sm">
        <span className="capitalize mb-1 flex justify-between">Color</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-full p-0 border-none bg-transparent"
        />
      </label>
    </ModelLayout>
  );
}
