import { useCallback } from "react";
import { STLExporter } from "three-stdlib";
import * as THREE from "three";

export function useStlExport<T extends THREE.Object3D>(
  name: string,
  ref: React.RefObject<T | null>
) {
  return useCallback(() => {
    if (!ref.current) return;
    const exporter = new STLExporter();
    const stl = exporter.parse(ref.current, { binary: true });
    const blob = new Blob([stl], { type: "model/stl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.stl`;
    link.click();
    URL.revokeObjectURL(url);
  }, [name, ref]);
}
