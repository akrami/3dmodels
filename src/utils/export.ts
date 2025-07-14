import * as THREE from "three";
import { STLExporter } from "three-stdlib";

export function exportStl(mesh: THREE.Object3D | null, name = "object"): void {
  if (!mesh) return;

  const exporter = new STLExporter();
  const arrayBuffer = exporter.parse(mesh, { binary: true });

  const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.stl`;
  link.click();
}

export default exportStl;
