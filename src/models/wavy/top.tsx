import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import exportStl from "@/utils/export";
import { createTop } from "@/utils/replicadWavy";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { wavyProperties, type WavyProperties } from "@/utils/properties";
import ReplicadMesh from "@/components/replicadMesh";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Download } from "lucide-react";

export default function WavyTop() {

    const [properties, setProperties] = React.useState<WavyProperties>(() => {
        const saved = localStorage.getItem('wavyProperties');
        return saved ? JSON.parse(saved) : wavyProperties;
    });
    React.useEffect(() => {
        localStorage.setItem('wavyProperties', JSON.stringify(properties));
    }, [properties]);

    const meshRef = React.useRef<THREE.Mesh>(null!);
    const [mesh, setMesh] = React.useState<{faces: any; edges: any} | null>(null);

    React.useEffect(() => {
        createTop(properties.radius, properties.waveDensity, properties.topHeight).then(setMesh);
    }, [properties]);
    return (
        <AppLayout>
            <SidebarProvider>
                <div className="flex flex-1">
                    <Sidebar collapsible="none" className="border-r w-64">
                        <SidebarContent className="p-4">
                            <Label>Radius ({properties.radius})</Label>
                            <Slider
                                defaultValue={[properties.radius]}
                                max={200}
                                step={5}
                                min={5}
                                onValueChange={(valueArray) => setProperties({ ...properties, radius: valueArray[0] })}
                            />
                            <Label>Height ({properties.topHeight})</Label>
                            <Slider
                                defaultValue={[properties.topHeight]}
                                max={200}
                                step={5}
                                min={5}
                                onValueChange={(valueArray) => setProperties({ ...properties, topHeight: valueArray[0] })}
                            />
                            <Label>Wave Density ({properties.waveDensity})</Label>
                            <Slider
                                defaultValue={[properties.waveDensity]}
                                max={1}
                                step={0.1}
                                min={0.1}
                                onValueChange={(valueArray) => setProperties({ ...properties, waveDensity: valueArray[0] })}
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
                                {mesh && (
                                    <ReplicadMesh faces={mesh.faces} edges={mesh.edges} />
                                )}
                            </group>
                            <OrbitControls />
                        </Canvas>
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )
}
