import { useState, useEffect } from 'react';
import type * as THREE from 'three';
import * as THREE_NS from 'three';
import initOpenCascade from 'opencascade.js/dist/opencascade.wasm.js?init';
import ocWasmUrl from 'opencascade.js/dist/opencascade.wasm.wasm?url';

let ocPromise: Promise<any> | null = null;
async function getOc() {
  if (!ocPromise) {
    ocPromise = initOpenCascade({ locateFile: () => ocWasmUrl });
  }
  return ocPromise;
}

function tessellate(oc: any, shape: any) {
  new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, false);
  const exp = new oc.TopExp_Explorer_1();
  const vertices: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (
    exp.Init(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
    exp.More();
    exp.Next()
  ) {
    const face = oc.TopoDS.Face_1(exp.Current());
    const loc = new oc.TopLoc_Location_1();
    const tri = oc.BRep_Tool.Triangulation(face, loc);
    if (tri.IsNull()) continue;
    const t = tri.get();
    for (let i = 1; i <= t.NbNodes(); i++) {
      const p = t.Node(i).Transformed(loc.Transformation());
      vertices.push(p.X(), p.Y(), p.Z());
    }
    const orient = face.Orientation_1();
    const tris = t.Triangles();
    for (let i = 1; i <= t.NbTriangles(); i++) {
      const tr = tris.Value(i);
      let n1 = tr.Value(1);
      let n2 = tr.Value(2);
      const n3 = tr.Value(3);
      if (orient !== oc.TopAbs_Orientation.TopAbs_FORWARD) {
        const tmp = n1;
        n1 = n2;
        n2 = tmp;
      }
      indices.push(n1 - 1 + offset, n2 - 1 + offset, n3 - 1 + offset);
    }
    offset += t.NbNodes();
  }
  exp.delete();
  return { vertices, indices };
}

export function useOcMesh(build: (oc: any) => any, deps: React.DependencyList): THREE.BufferGeometry | null {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let cancelled = false;
    getOc().then(oc => {
      const shape = build(oc);
      const { vertices, indices } = tessellate(oc, shape);
      const g = new THREE_NS.BufferGeometry();
      g.setAttribute('position', new THREE_NS.BufferAttribute(new Float32Array(vertices), 3));
      g.setIndex(new THREE_NS.BufferAttribute(new Uint32Array(indices), 1));
      g.computeVertexNormals();
      if (!cancelled) setGeom(g);
    });
    return () => {
      cancelled = true;
    };
  }, deps);
  return geom;
}
