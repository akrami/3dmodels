import * as React from "react";
import * as THREE from "three";
import AppLayout from "@/layouts/appLayout";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";


export default function WavyPlanter() {
    const [color, setColor] = React.useState("#add8e6");

    return (
        <AppLayout>
            <SidebarProvider>
                <div className="flex flex-1">
                    <Sidebar collapsible="none" className="border-r w-64">
                        <SidebarHeader>
                            <h2 className="text-lg font-semibold">Properties</h2>
                        </SidebarHeader>
                        <SidebarContent className="p-4">
                            <li>something</li>
                        </SidebarContent>
                    </Sidebar>
                    <div className="flex-1 relative">
                        <Canvas
                            camera={{ position: [100, 100, 100], fov: 60, up: [0, 1, 0] }}
                            className="bg-gradient-to-br from-gray-50 to-gray-200"
                            shadows
                        >
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[50, 100, 70]} intensity={1} castShadow />
                            <gridHelper args={[1000, 100, "#888888", "#444444"]} />
                            <axesHelper args={[500]} />
                            <mesh geometry={new THREE.BoxGeometry(100, 100, 100)} material={new THREE.MeshNormalMaterial()} translateY={50}/>
                            <OrbitControls />
                        </Canvas>
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )
}