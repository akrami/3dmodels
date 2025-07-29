import opencascade from "replicad-opencascadejs/src/replicad_single.js";
import opencascadeWasm from "replicad-opencascadejs/src/replicad_single.wasm?url";
import { drawSingleCircle, setOC } from "replicad";

let loaded = false;
const init = async() => {
    if (loaded) return Promise.resolve(true);
    const OC = await opencascade({
        locateFile: () => opencascadeWasm
    });

    loaded = true;
    setOC(OC);
    return true;
}
const started = init();

export function createBlob() {
    return started.then(()=>{
        return drawSingleCircle(50).sketchOnPlane().extrude(20).blobSTL();
    });
}

export function createMesh() {
    return started.then(()=>{
        const shape = drawSingleCircle(50).sketchOnPlane().extrude(20);
        return {
            faces: shape.mesh(),
            edges: shape.meshEdges(),
        };
    });
}
