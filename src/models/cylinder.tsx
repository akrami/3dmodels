import * as React from "react"

export interface CylinderProps {
  radiusTop: number
  radiusBottom: number
  height: number
  radialSegments: number
}

export const MODEL_NAME = "cylinder"
export const DEFAULT_PROPS: CylinderProps = {
  radiusTop: 1,
  radiusBottom: 1,
  height: 2,
  radialSegments: 32,
}

export function CylinderMesh({
  props,
  meshRef,
}: {
  props: CylinderProps
  meshRef: React.RefObject<THREE.Mesh>
}) {
  const geometryArgs = React.useMemo(
    () => [
      props.radiusTop,
      props.radiusBottom,
      props.height,
      props.radialSegments,
    ],
    [props]
  )

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <cylinderGeometry args={geometryArgs} />
      <meshStandardMaterial color="#AAAAAA" />
    </mesh>
  )
}
