import * as React from "react";
import * as THREE from "three";
import {
  mergeGeometries,
  mergeVertices as mergeVerts,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type ThreeElements } from "@react-three/fiber";
import ModelLayout from "@/layouts/modelLayout";
import { STLExporter } from "three-stdlib";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Geometry, Base, Subtraction } from "@react-three/csg";
import { useMemo } from "react";

export interface WavePlanterProps extends Record<string, number> {
  radius: number;
  amplitude: number;
  density: number;
  depth: number;
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
    /** Depth of an additional inner cut at the top */
    topCutDepth = 0,
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
    reverseTwist?: boolean;
    topCutDepth?: number;
    material?: THREE.Material | THREE.Material[];
  } & ThreeElements["mesh"]) => {
    const geometry = React.useMemo(() => {
      const k = Math.round(R * n);
      const rOuter = (t: number) => R + A - Math.abs(Math.sin(k * t));
      const rInner = R - (A + 4);
      const rInnerCut = R - 4;

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

      const bottomDepth = Math.max(depth - topCutDepth, 0);
      const bottomSteps = Math.max(1, Math.round((bottomDepth / depth) * TWIST_SEGMENTS));
      const topSteps = Math.max(1, TWIST_SEGMENTS - bottomSteps);

      const outerShape = makeOuterShape();
      const holeBottom = new THREE.Path().absarc(0, 0, rInner, 0, Math.PI * 2, true);
      const bottomShape = outerShape.clone();
      bottomShape.holes.push(holeBottom);
      const bottomGeom = new THREE.ExtrudeGeometry(bottomShape, {
        steps: bottomSteps,
        depth: bottomDepth,
        bevelEnabled: false,
        curveSegments: 128,
      });

      let geoms: THREE.BufferGeometry[] = [bottomGeom];

      if (topCutDepth > 0) {
        const outerShapeTop = makeOuterShape();
        const holeTop = new THREE.Path().absarc(0, 0, rInnerCut, 0, Math.PI * 2, true);
        outerShapeTop.holes.push(holeTop);
        const topGeom = new THREE.ExtrudeGeometry(outerShapeTop, {
          steps: topSteps,
          depth: topCutDepth,
          bevelEnabled: false,
          curveSegments: 128,
        });
        topGeom.translate(0, 0, bottomDepth);
        geoms.push(topGeom);
      }

      const geom = mergeGeometries(geoms, false)!;

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
    }, [R, A, n, depth, segments, rot, twistWaves, reverseTwist, topCutDepth]);

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
    const diameter = outer * 2;
    const holeCount = diameter <= 50 ? 1 : 3;

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

  const createBaseBottomGeometry = React.useCallback(() => {
    const outer = props.radius - 4;

    const createShape = () => {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
      return shape;
    };

    const topShape = createShape();
    const bottomShape = createShape();

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

  const distance = props.radius * 2.5;

  const WavePlanter = () => {
    const bottomGeometry = React.useMemo(
      () => createWaveBottomGeometry(),
      [createWaveBottomGeometry]
    );

    return (
      <group name="waveplanter" castShadow receiveShadow>
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
        <mesh geometry={bottomGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  };

  const BasePlanter = () => {
    const bottomGeometry = React.useMemo(
      () => createBaseBottomGeometry(),
      [createBaseBottomGeometry]
    );

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

      const indexed = mergeVerts(geom);
      indexed.computeVertexNormals();
      return indexed;
    }, []);

    return (
      <group
        name="baseplanter"
        position={[distance, 0, 0]}
        castShadow
        receiveShadow
      >
        <group>
          <mesh castShadow receiveShadow>
            <Geometry showOperations={false} computeVertexNormals>
              <Base>
                <RingGear
                  R={props.radius}
                  A={props.amplitude}
                  n={props.density}
                  depth={props.baseDepth}
                  rot={Math.PI / 12}
                  twistWaves={(props.baseDepth / props.depth) * props.twistWaves}
                  reverseTwist
                  topCutDepth={2}
                  position={[0, 0, 0]}
                  castShadow
                  receiveShadow
                />
              </Base>
              <Subtraction geometry={taghExt} position={[-5, props.radius - 5, props.baseDepth - 5]} scale={[0.75, 0.75, 0.75]} />
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
                <cylinderGeometry args={[props.radius - 2.5, props.radius - 2.5, 30, 128]} />
              </Subtraction>
            </Geometry>
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      </group>
    );
  };

  return (
    <group ref={meshRef}>
      <WavePlanter />
      <BasePlanter />
    </group>
  );
}

export default function WavePlanterModel() {
  const [color, setColor] = React.useState("#AAAAAA");
  const meshElement = <WavePlanterMesh color={color} />;
  const renderExport = React.useCallback(
    ({ meshRef }: { exportModel: () => void; meshRef: React.RefObject<THREE.Group> }) => {
      const exportByName = (groupName: string, fileName: string) => {
        const obj = meshRef.current?.getObjectByName(groupName);
        if (!obj) return;
        const exporter = new STLExporter();
        const stl = exporter.parse(obj, { binary: true });
        const blob = new Blob([stl], { type: "model/stl" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.stl`;
        link.click();
        URL.revokeObjectURL(url);
      };

      return (
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => exportByName("waveplanter", "waveplanter")} className="w-full">
            <Download /> Download Top
          </Button>
          <Button onClick={() => exportByName("baseplanter", "baseplanter")} className="w-full">
            <Download /> Download Base
          </Button>
        </div>
      );
    },
    []
  );
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
      renderExport={renderExport}
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
