import * as React from "react";
import * as THREE from "three";
import ModelLayout from "@/layouts/modelLayout";

export interface WevePlanterProps {
  radius: number;
  height: number;
}

export const MODEL_NAME = "weve";
export const DEFAULT_PROPS: WevePlanterProps = {
  radius: 60,
  height: 100,
};

export function WevePlanterMesh({
  props = DEFAULT_PROPS,
  meshRef,
  color = "#add8e6",
}: {
  props?: WevePlanterProps;
  meshRef?: React.RefObject<THREE.Group>;
  color?: string;
}) {
  const geometry = React.useMemo(
    () => new THREE.CylinderGeometry(props.radius, props.radius, props.height, 64),
    [props.radius, props.height]
  );

  React.useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function WevePlanterModel() {
  const [color, setColor] = React.useState("#add8e6");
  const meshElement = <WevePlanterMesh color={color} />;
  return (
    <ModelLayout
      name={MODEL_NAME}
      defaultValues={DEFAULT_PROPS}
      mesh={meshElement}
      ranges={{
        radius: { min: 20, max: 100, step: 5 },
        height: { min: 20, max: 200, step: 5 },
      }}
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
