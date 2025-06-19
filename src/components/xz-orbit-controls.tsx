import { useEffect, useRef } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"

export interface XZOrbitControlsProps {
  /** initial camera distance from origin */
  distance?: number
  /** rotation speed multiplier */
  rotateSpeed?: number
  /** zoom speed multiplier */
  zoomSpeed?: number
}

/** Simple orbit controls that yaw around Y and pitch around X. */
export function XZOrbitControls({
  distance = 10,
  rotateSpeed = 0.005,
  zoomSpeed = 0.1,
}: XZOrbitControlsProps) {
  const { camera, gl } = useThree()
  const angles = useRef({ theta: Math.PI / 4, phi: Math.PI / 4 })
  const radius = useRef(distance)
  const isDragging = useRef(false)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    camera.up.set(0, 1, 0)
    const r = radius.current
    const { theta, phi } = angles.current
    const x = r * Math.sin(theta) * Math.cos(phi)
    const y = r * Math.sin(phi)
    const z = r * Math.cos(theta) * Math.cos(phi)
    camera.position.set(x, y, z)
    camera.lookAt(new THREE.Vector3(0, 0, 0))
    const element = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true
      pointer.current.x = e.clientX
      pointer.current.y = e.clientY
      element.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - pointer.current.x
      const dy = e.clientY - pointer.current.y
      pointer.current.x = e.clientX
      pointer.current.y = e.clientY
      angles.current.theta -= dx * rotateSpeed
      angles.current.phi += dy * rotateSpeed
      const piHalf = Math.PI / 2 - 0.001
      angles.current.phi = Math.max(-piHalf, Math.min(piHalf, angles.current.phi))
    }

    const onPointerUp = (e: PointerEvent) => {
      isDragging.current = false
      element.releasePointerCapture(e.pointerId)
    }

    const onWheel = (e: WheelEvent) => {
      radius.current *= 1 + e.deltaY * zoomSpeed * 0.01
      radius.current = Math.max(1, Math.min(1000, radius.current))
    }

    element.addEventListener("pointerdown", onPointerDown)
    element.addEventListener("pointermove", onPointerMove)
    element.addEventListener("pointerup", onPointerUp)
    element.addEventListener("wheel", onWheel)
    return () => {
      element.removeEventListener("pointerdown", onPointerDown)
      element.removeEventListener("pointermove", onPointerMove)
      element.removeEventListener("pointerup", onPointerUp)
      element.removeEventListener("wheel", onWheel)
    }
  }, [camera, gl, rotateSpeed, zoomSpeed])

  useFrame(() => {
    const r = radius.current
    const { theta, phi } = angles.current
    const x = r * Math.sin(theta) * Math.cos(phi)
    const y = r * Math.sin(phi)
    const z = r * Math.cos(theta) * Math.cos(phi)
    camera.position.set(x, y, z)
    camera.lookAt(new THREE.Vector3(0, 0, 0))
  })

  return null
}
