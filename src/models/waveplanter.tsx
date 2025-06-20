import * as React from "react";
import * as THREE from "three";
import ModelLayout from "@/layouts/modelLayout";
import { STLExporter } from "three-stdlib";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { WavePlanterProps, MODEL_NAME, DEFAULT_PROPS } from "./waveprops";
import WavePlanter from "./waveplanter-top";
import BasePlanter from "./base-planter";

export function WavePlanterMesh({
  props = DEFAULT_PROPS,
  meshRef,
  color = "#add8e6",
}: {
  props?: WavePlanterProps;
  meshRef?: React.RefObject<THREE.Group>;
  color?: string;
}) {
  const distance = props.radius * 2.5;

  return (
    <group ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <WavePlanter props={props} color={color} distance={distance} />
      <BasePlanter props={props} color={color} distance={distance} />
    </group>
  );
}

export default function WavePlanterModel() {
  const [color, setColor] = React.useState("#add8e6");
  const meshElement = <WavePlanterMesh color={color} />;
  const renderExport = React.useCallback(
    ({ meshRef }: { exportModel: () => void; meshRef: React.RefObject<THREE.Group> }) => {
      const exportGroup = (name: string, file: string) => {
        const obj = meshRef.current?.getObjectByName(name);
        if (!obj) return;
        const clone = obj.clone(true);
        const invisible: THREE.Object3D[] = [];
        clone.traverse((child) => {
          if (!child.visible) invisible.push(child);
        });
        invisible.forEach((child) => child.parent?.remove(child));
        const exporter = new STLExporter();
        const stl = exporter.parse(clone, { binary: true });
        const url = URL.createObjectURL(new Blob([stl], { type: "model/stl" }));
        const link = Object.assign(document.createElement("a"), {
          href: url,
          download: `${file}.stl`,
        });
        link.click();
        URL.revokeObjectURL(url);
      };

      return (
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={() => exportGroup("waveplanter", "waveplanter")} className="w-full">
            <Download /> Download Top
          </Button>
          <Button onClick={() => exportGroup("baseplanter", "baseplanter")} className="w-full">
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
