import { drawCircle, drawPolysides, drawSingleCircle, polysideInnerRadius, setOC } from "replicad";

let started: Promise<boolean> | null = null;

const init = async () => {
  if (started) return started;
  started = (async () => {
    const opencascade = (await import("replicad-opencascadejs/src/replicad_single.js")).default;
    const opencascadeWasm = (await import("replicad-opencascadejs/src/replicad_single.wasm?url")).default;
    const OC = await opencascade({
      locateFile: () => opencascadeWasm,
    });
    setOC(OC);
    return true;
  })();
  return started;
};

const getShape = () => {
    const extrusionProfile = undefined;
    const sidesCount = 12;
    const sideTwist = 2;
    const radius = 40;
    const sideRadius = -2;
    const height = 150;
    const bottomFillet = 5;
    const topFillet = 0;
    const holeMode = 1;
    const wallThickness = 2;

    const twistAngle = (360 / sidesCount) * sideTwist;

    let shape = drawPolysides(radius, sidesCount, -sideRadius)
        .sketchOnPlane()
        .extrude(height, {
            twistAngle,
            extrusionProfile,
        });

    if (bottomFillet) {
        shape = shape.fillet(bottomFillet, (e) => e.inPlane("XY"));
    }

    if (holeMode === 1 || holeMode === 2) {
        const holeHeight = height - wallThickness;

        let hole;
        if (holeMode === 1) {
            const insideRadius =
                polysideInnerRadius(radius, sidesCount, sideRadius) - wallThickness;

            hole = drawCircle(insideRadius).sketchOnPlane().extrude(holeHeight, {
                extrusionProfile,
            });

            shape = shape.cut(
                hole
                    .fillet(
                        Math.max(wallThickness / 3, bottomFillet - wallThickness),
                        (e) => e.inPlane("XY")
                    )
                    .translate([0, 0, wallThickness])
            );
        } else if (holeMode === 2) {
            shape = shape.shell(wallThickness, (f) => f.inPlane("XY", height));
        }
    }

    if (topFillet) {
        shape = shape.fillet(topFillet, (e) => e.inPlane("XY", height));
    }
    return shape;
}

export function createBlob() {
    return init().then(() => {
        return getShape().blobSTL();
    });
}

export function createMesh() {
    return init().then(() => {
        const shape = getShape();
        return {
            faces: shape.mesh(),
            edges: shape.meshEdges(),
        };
    });
}
