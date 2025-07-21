import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import exportStl from "@/utils/export";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { useOcMesh } from "@/hooks/use-oc-mesh";
import { Button } from "@/components/ui/button";
import { getGlobalMaterial, wavyProperties, type WavyProperties } from "@/utils/properties";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Download } from "lucide-react";

export default function WavyConnector() {

    const [properties, setProperties] = React.useState<WavyProperties>(() => {
        const saved = localStorage.getItem('wavyProperties');
        return saved ? JSON.parse(saved) : wavyProperties;
    });
    React.useEffect(() => {
        localStorage.setItem('wavyProperties', JSON.stringify(properties));
    }, [properties]);

    const meshRef = React.useRef<THREE.Mesh>(null!);
    const geometry = useOcMesh((oc) => {
        const body = new oc.BRepPrimAPI_MakeCylinder_1(8, properties.bottomHeight - 5).Shape();
        const hole = new oc.BRepPrimAPI_MakeCylinder_1(6, properties.bottomHeight - 5).Shape();
        return new oc.BRepAlgoAPI_Cut_2(body, hole).Shape();
    }, [properties.bottomHeight]);
    return (
        <AppLayout>
            <SidebarProvider>
                <div className="flex flex-1">
                    <Sidebar collapsible="none" className="border-r w-64">
                        <SidebarContent className="p-4">
                            <Label>Height ({properties.bottomHeight - 5})</Label>
                            <Slider
                                defaultValue={[properties.bottomHeight]}
                                max={200}
                                step={5}
                                min={5}
                                onValueChange={(valueArray) => setProperties({ ...properties, bottomHeight: valueArray[0] })}
                            />
                            <Button onClick={() => exportStl(meshRef.current)}><Download/> Download STL</Button>
                        </SidebarContent>
                    </Sidebar>
                    <div className="flex-1 relative">
                        <Canvas
                            camera={{ position: [200, 200, 200], fov: 60, up: [0, 1, 0] }}
                            className="bg-gradient-to-br from-gray-50 to-gray-200"
                            shadows
                        >
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[50, 100, 70]} intensity={1} castShadow />
                            <gridHelper args={[500, 50, "#888888", "#444444"]} />
                            <axesHelper args={[500]} />
                            <group>
                                <mesh
                                    ref={meshRef}
                                    geometry={geometry ?? undefined}
                                    material={getGlobalMaterial(properties.color)}
                                    position={[0, (properties.bottomHeight - 5) / 2, 0]} />
                            </group>
                            <OrbitControls />
                        </Canvas>
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )
}

