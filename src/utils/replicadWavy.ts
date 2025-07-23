import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC, Sketcher, makeCylinder } from "replicad";
import { getPointsOnCircle } from "@/utils/3d";
import type { ReplicadMeshedFaces, ReplicadMeshedEdges } from "replicad-threejs-helper";

function twistMeshZ(
  faces: ReplicadMeshedFaces,
  edges: ReplicadMeshedEdges | undefined,
  height: number,
  twistWaves = 0.1,
  reverse = false
) {
  for (let i = 0; i < faces.vertices.length; i += 3) {
    const z = faces.vertices[i + 2];
    const t = z / height;
    const tt = reverse ? 1 - t : t;
    const dir = reverse ? -1 : 1;
    const angle = Math.sin(tt * twistWaves * Math.PI * 2) * dir;
    const x = faces.vertices[i];
    const y = faces.vertices[i + 1];
    const cs = Math.cos(angle);
    const sn = Math.sin(angle);
    faces.vertices[i] = x * cs - y * sn;
    faces.vertices[i + 1] = x * sn + y * cs;
  }

  if (edges) {
    for (let i = 0; i < edges.lines.length; i += 3) {
      const z = edges.lines[i + 2];
      const t = z / height;
      const tt = reverse ? 1 - t : t;
      const dir = reverse ? -1 : 1;
      const angle = Math.sin(tt * twistWaves * Math.PI * 2) * dir;
      const x = edges.lines[i];
      const y = edges.lines[i + 1];
      const cs = Math.cos(angle);
      const sn = Math.sin(angle);
      edges.lines[i] = x * cs - y * sn;
      edges.lines[i + 1] = x * sn + y * cs;
    }
  }
  delete faces.normals;
}

function rotateX(
  faces: ReplicadMeshedFaces,
  edges: ReplicadMeshedEdges | undefined,
  angle: number
) {
  const cs = Math.cos(angle);
  const sn = Math.sin(angle);
  for (let i = 0; i < faces.vertices.length; i += 3) {
    const y = faces.vertices[i + 1];
    const z = faces.vertices[i + 2];
    faces.vertices[i + 1] = y * cs - z * sn;
    faces.vertices[i + 2] = y * sn + z * cs;
  }
  if (edges) {
    for (let i = 0; i < edges.lines.length; i += 3) {
      const y = edges.lines[i + 1];
      const z = edges.lines[i + 2];
      edges.lines[i + 1] = y * cs - z * sn;
      edges.lines[i + 2] = y * sn + z * cs;
    }
  }
}

let initPromise: Promise<void> | null = null;

async function init() {
  if (!initPromise) {
    initPromise = opencascade({ locateFile: () => opencascadeWasm }).then((OC) => {
      setOC(OC);
    });
  }
  return initPromise;
}

export async function createTop(radius: number, waveDensity: number, height: number) {
  await init();
  const k = Math.round(radius * waveDensity);
  const segs = Math.max(8, Math.round(radius * waveDensity * 10));
  const sketch = new Sketcher("XY");
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const r = radius + 0.4 - Math.abs(Math.sin(k * t));
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (i === 0) sketch.movePointerTo([x, y]);
    else sketch.lineTo([x, y]);
  }
  let shape = sketch.close().extrude(height);

  const floor = makeCylinder(radius - 3, 2).translateZ(1);
  const lock = makeCylinder(radius - 5, 2).translateZ(-1);
  shape = shape.fuse(floor).fuse(lock);

  const topHole = makeCylinder(10, 2).translateZ(1);
  const bottomHole = makeCylinder(8, 2).translateZ(-1);
  let hole = topHole.fuse(bottomHole);

  let holeCount = 1;
  if (radius >= 50 && radius < 100) holeCount = 3;
  else if (radius >= 100) holeCount = 5;

  if (holeCount === 1) {
    shape = shape.cut(hole);
  } else {
    const points = getPointsOnCircle(radius, holeCount);
    for (const p of points) {
      shape = shape.cut(hole.clone().translate([p.x, 0, p.z]));
    }
  }

  const faces = shape.mesh();
  const edges = shape.meshEdges();
  twistMeshZ(faces, edges, height);
  rotateX(faces, edges, -Math.PI / 2);
  return { faces, edges };
}
