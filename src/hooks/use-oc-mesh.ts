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

export function useOcMesh(build: (oc: any) => any, deps: React.DependencyList): THREE.BufferGeometry | null {
  const [geom, setGeom] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let cancelled = false;
    getOc().then(oc => {
      const shape = build(oc);
      const tess = new oc.Tesselator(shape, { deflection: 0.1 });
      const g = new THREE_NS.BufferGeometry();
      g.setAttribute('position', new THREE_NS.BufferAttribute(new Float32Array(tess.vertices), 3));
      if (tess.indices) {
        g.setIndex(new THREE_NS.BufferAttribute(new Uint32Array(tess.indices), 1));
      }
      g.computeVertexNormals();
      if (!cancelled) setGeom(g);
    });
    return () => {
      cancelled = true;
    };
  }, deps);
  return geom;
}
