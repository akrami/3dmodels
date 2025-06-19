import * as THREE from "three"
import { Text } from "@react-three/drei"

export function SceneHelpers({ size = 500 }: { size?: number }) {
  const axisLength = size / 2
  const labelOffset = axisLength * 0.1

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
      <Text
        position={[axisLength + labelOffset, 0, 0]}
        fontSize={axisLength * 0.05}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        X
      </Text>
      <Text
        position={[0, axisLength + labelOffset, 0]}
        fontSize={axisLength * 0.05}
        color="green"
        anchorX="center"
        anchorY="middle"
      >
        Y
      </Text>
      <Text
        position={[0, 0, axisLength + labelOffset]}
        fontSize={axisLength * 0.05}
        color="blue"
        anchorX="center"
        anchorY="middle"
      >
        Z
      </Text>
    </>
  )
}
