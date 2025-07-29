import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { drawCircle, drawPolysides, drawSingleCircle, polysideInnerRadius, setOC } from "replicad";

let loaded = false;
const init = async () => {
    if (loaded) return Promise.resolve(true);
    const OC = await opencascade({
        locateFile: () => opencascadeWasm
    });

    loaded = true;
    setOC(OC);
    return true;
}
const started = init();

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
    return started.then(() => {
        return getShape().blobSTL();
    });
}

export function createMesh() {
    return started.then(() => {
        const shape = getShape();
        return {
            faces: shape.mesh(),
            edges: shape.meshEdges(),
        };
    });
}
