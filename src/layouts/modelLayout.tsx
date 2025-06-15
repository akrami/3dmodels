import * as React from "react"
import * as THREE from "three"
import { Canvas } from "@react-three/fiber"
import { XZOrbitControls } from "@/components/xz-orbit-controls"
import { SceneHelpers } from "@/components/scene-helpers"
import { ModelControls } from "@/components/model-controls"
import { useStlExport } from "@/hooks/use-stl-export"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar"
import AppLayout from "@/layouts/appLayout"

export interface ModelLayoutProps<T extends Record<string, number>> {
  name: string
  defaultValues: T
  ranges?: Partial<Record<keyof T, { min: number; max: number; step?: number }>>
  camera?: [number, number, number]
  orbitDistance?: number
  mesh: React.ReactElement<{
    props?: T
    meshRef?: React.RefObject<THREE.Group>
  }>
  children?: React.ReactNode
  /**
   * Optional render function to customize export controls.
   * Receives the default export handler and the mesh reference.
   */
  renderExport?: (args: {
    exportModel: () => void
    meshRef: React.RefObject<THREE.Group>
  }) => React.ReactNode
}

export default function ModelLayout<T extends Record<string, number>>({
  name,
  defaultValues,
  ranges,
  camera = [4, 4, 4],
  orbitDistance = 7,
  mesh,
  children,
  renderExport,
}: ModelLayoutProps<T>) {
  const [values, setValues] = React.useState<T>(defaultValues)
  const meshRef = React.useRef<THREE.Group>(null!)
  const exportModel = useStlExport(name, meshRef)

  const handlePropUpdate = (key: keyof T, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const meshElement = React.isValidElement(mesh)
    ? React.cloneElement(mesh, { props: values, meshRef })
    : null

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex flex-1">
          <Sidebar collapsible="none" className="border-r w-64">
            <SidebarHeader>
              <h2 className="text-lg font-semibold">Properties</h2>
            </SidebarHeader>
            <SidebarContent className="p-4">
              <ModelControls
                values={values}
                onChange={handlePropUpdate}
                ranges={ranges}
              />
              {children}
              {renderExport ? (
                renderExport({ exportModel, meshRef })
              ) : (
                <Button onClick={exportModel} className="mt-4 w-full">
                  Export as .stl file
                </Button>
              )}
            </SidebarContent>
          </Sidebar>
          <div className="flex-1 relative">
            <Canvas
              camera={{ position: camera, fov: 60, up: [0, 0, 1] }}
              className="bg-gradient-to-br from-gray-50 to-gray-200"
              shadows
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 7]} intensity={1} castShadow />
              <SceneHelpers />
              {meshElement}
              <XZOrbitControls distance={orbitDistance} />
            </Canvas>
          </div>
        </div>
      </SidebarProvider>
    </AppLayout>
  )
}
