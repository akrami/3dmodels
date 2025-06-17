import Module from 'manifold-3d'
import type { ManifoldToplevel } from 'manifold-3d'
import * as THREE from 'three'

let modPromise: Promise<ManifoldToplevel> | null = null
export function getManifold() {
  if (!modPromise) {
    modPromise = Module().then((m) => {
      m.setup()
      return m
    })
  }
  return modPromise
}

export async function geometryToManifold(geometry: THREE.BufferGeometry) {
  const wasm = await getManifold()
  const { Mesh, Manifold } = wasm
  const geom = geometry.clone()
  const posAttr = geom.getAttribute('position') as THREE.BufferAttribute
  const vertProperties = new Float32Array(posAttr.array as ArrayLike<number>)
  const triVerts = geom.index
    ? new Uint32Array((geom.index as THREE.BufferAttribute).array as ArrayLike<number>)
    : new Uint32Array(vertProperties.length / 3).map((_, i) => i)
  const mesh = new Mesh({ numProp: 3, vertProperties, triVerts })
  mesh.merge()
  const manifold = new Manifold(mesh)
  mesh.delete()
  return { wasm, manifold }
}

export async function manifoldToGeometry(manifold: any, wasm: ManifoldToplevel) {
  const mesh = manifold.getMesh()
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(mesh.vertProperties, 3))
  geometry.setIndex(new THREE.BufferAttribute(mesh.triVerts, 1))
  mesh.delete()
  manifold.delete()
  return geometry
}
