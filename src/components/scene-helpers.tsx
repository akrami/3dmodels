import * as THREE from "three"

export function SceneHelpers({ size = 500 }: { size?: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#555555" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper args={[size, 20, "#888888", "#444444"]} rotation={[-Math.PI / 2, 0, 0]} />
      <axesHelper args={[size / 2]} />
    </>
  )
}
