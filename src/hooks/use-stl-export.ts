import { useCallback } from "react";
import { STLExporter } from "three-stdlib";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function useStlExport<T extends THREE.Object3D>(
  name: string,
  ref: React.RefObject<T | null>
) {
  const mergeGroup = useCallback((group: THREE.Object3D) => {
    const geoms: THREE.BufferGeometry[] = [];
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if ((mesh as any).isMesh && mesh.geometry) {
        const geom = mesh.geometry.clone();
        geom.applyMatrix4(mesh.matrixWorld);
        geoms.push(geom);
      }
    });
    if (geoms.length === 0) return null;
    const merged = mergeGeometries(geoms, false);
    geoms.forEach((g) => g.dispose());
    return merged;
  }, []);

  return useCallback(() => {
    if (!ref.current) return;
    const exporter = new STLExporter();
    const root = ref.current;
    root.updateMatrixWorld(true);

    const groups = root.children.filter(
      (c): c is THREE.Object3D & { name: string } => c.name !== ""
    );

    const targets = groups.length > 0 ? groups : [root];

    targets.forEach((obj) => {
      const geom = mergeGroup(obj);
      if (!geom) return;
      const mesh = new THREE.Mesh(geom);
      const stl = exporter.parse(mesh, { binary: true });
      const blob = new Blob([stl], { type: "model/stl" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${obj.name || name}.stl`;
      link.click();
      URL.revokeObjectURL(url);
      geom.dispose();
    });
  }, [name, ref, mergeGroup]);
}
