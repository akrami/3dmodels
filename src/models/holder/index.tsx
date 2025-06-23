import * as React from "react";
import * as THREE from "three";
import ModelLayout from "@/layouts/modelLayout";
import csg from "three-bvh-csg";
const { Brush, Evaluator, SUBTRACTION, UNION } = csg;
import { mergeVertices as mergeVerts } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { HolderProps } from "./props";
import { MODEL_NAME, DEFAULT_PROPS } from "./props";

const BODY_R = 20;
const BODY_H = 40;
const FLANGE_R = 25;
const FLANGE_H = 4;
const SLOT_W = 6;
const SLOT_H = 30;
const SLOT_D = 5;
const HOLE_R = 4;
const HOLE_D = 12;
const HOLE_OFF = 8;

function useHolderGeometry() {
  return React.useMemo(() => {
    const evaluator = new Evaluator();
    evaluator.useGroups = false;

    // body cylinder
    const bodyGeom = new THREE.CylinderGeometry(BODY_R, BODY_R, BODY_H, 64);
    const bodyBrush = new Brush(bodyGeom);
    bodyBrush.updateMatrixWorld();

    // flange cylinder
    const flangeGeom = new THREE.CylinderGeometry(FLANGE_R, FLANGE_R, FLANGE_H, 64);
    const flangeBrush = new Brush(flangeGeom);
    flangeBrush.position.set(0, -BODY_H / 2 - FLANGE_H / 2 + 0.1, 0);
    flangeBrush.updateMatrixWorld();

    let result = evaluator.evaluate(bodyBrush, flangeBrush, UNION) as THREE.Mesh;

    // side slots
    const slotGeom = new THREE.BoxGeometry(SLOT_W, SLOT_H, SLOT_D);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const slotBrush = new Brush(slotGeom.clone());
      slotBrush.position.set((BODY_R - SLOT_D / 2) * Math.cos(a), 0, (BODY_R - SLOT_D / 2) * Math.sin(a));
      slotBrush.rotation.y = -a;
      slotBrush.updateMatrixWorld();
      result = evaluator.evaluate(result, slotBrush, SUBTRACTION) as THREE.Mesh;
    }

    // top holes
    const holeGeom = new THREE.CylinderGeometry(HOLE_R, HOLE_R, HOLE_D, 32);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const holeBrush = new Brush(holeGeom.clone());
      holeBrush.rotation.x = Math.PI / 2;
      holeBrush.position.set(HOLE_OFF * Math.cos(a), BODY_H / 2 - HOLE_D / 2, HOLE_OFF * Math.sin(a));
      holeBrush.updateMatrixWorld();
      result = evaluator.evaluate(result, holeBrush, SUBTRACTION) as THREE.Mesh;
    }

    const geom = (result.geometry as THREE.BufferGeometry).clone();
    const nonIndexed = geom.toNonIndexed();
    const merged = mergeVerts(nonIndexed, 1e-5);
    merged.computeVertexNormals();
    return merged;
  }, []);
}

export function HolderMesh({
  meshRef,
  color = "#ff7f0e",
  position,
  rotation = [-Math.PI / 2, 0, 0],
}: {
  props?: HolderProps;
  meshRef?: React.RefObject<THREE.Group>;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const geometry = useHolderGeometry();

  return (
    <group ref={meshRef} position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.05} roughness={0.55} />
      </mesh>
    </group>
  );
}

export default function HolderModel() {
  const [color, setColor] = React.useState("#ff7f0e");
  const meshElement = <HolderMesh color={color} />;

  return (
    <ModelLayout name={MODEL_NAME} defaultValues={DEFAULT_PROPS} mesh={meshElement}>
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
