import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { setOC, Sketcher, makeCylinder } from "replicad";
import { getPointsOnCircle } from "@/utils/3d";

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
  const segs = Math.max(8, Math.round(radius * waveDensity * 10));
  const sketch = new Sketcher("XY");
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const r = radius + 0.4 - Math.abs(Math.sin(segs * t));
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (i === 0) sketch.movePointerTo([x, y]);
    else sketch.lineTo([x, y]);
  }
  let shape = sketch.close().extrude(height).rotate(-90, [1, 0, 0]);

  const floor = makeCylinder(radius - 3, 2).translateY(1).rotate(-90, [1, 0, 0]);
  const lock = makeCylinder(radius - 5, 2).translateY(-1).rotate(-90, [1, 0, 0]);
  shape = shape.fuse(floor).fuse(lock);

  const topHole = makeCylinder(10, 2).translateY(1).rotate(-90, [1, 0, 0]);
  const bottomHole = makeCylinder(8, 2).translateY(-1).rotate(-90, [1, 0, 0]);
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

  return { faces: shape.mesh(), edges: shape.meshEdges() };
}
