import * as React from 'react'
import * as THREE from 'three'

export function useAsyncGeometry(
  factory: () => Promise<THREE.BufferGeometry>,
  deps: React.DependencyList
) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry>()

  React.useEffect(() => {
    let canceled = false
    factory().then((geom) => {
      if (canceled) {
        geom.dispose()
        return
      }
      setGeometry((old) => {
        old?.dispose()
        return geom
      })
    })
    return () => {
      canceled = true
      setGeometry((old) => {
        old?.dispose()
        return undefined
      })
    }
  }, deps)

  return geometry
}
