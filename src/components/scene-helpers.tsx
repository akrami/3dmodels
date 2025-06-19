import * as THREE from "three"


export function SceneHelpers({ size = 1000 }: { size?: number }) {
  const axisLength = size / 2

  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color="#555555"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <gridHelper args={[size, 20, "#888888", "#444444"]} />
      <axesHelper args={[axisLength]} />
    </>
  )
}
