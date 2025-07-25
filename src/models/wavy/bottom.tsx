import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import exportStl from "@/utils/export";
import { createWavyGeometry } from "@/utils/wave";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { ADDITION, Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Button } from "@/components/ui/button";
import { getGlobalMaterial, wavyProperties, type WavyProperties } from "@/utils/properties";
import { Slider } from "@/components/ui/slider";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Download } from "lucide-react";

export default function WavyBottom() {

    const [properties, setProperties] = React.useState<WavyProperties>(() => {
        const saved = localStorage.getItem('wavyProperties');
        return saved ? JSON.parse(saved) : wavyProperties;
    });
    React.useEffect(() => {
        localStorage.setItem('wavyProperties', JSON.stringify(properties));
    }, [properties]);

    const meshRef = React.useRef<THREE.Mesh>(null!);
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
                                onValueChange={(valueArray) => setProperties({...properties, radius: valueArray[0]})}
                            />
                            <Label>Height ({properties.bottomHeight})</Label>
                            <Slider
                                defaultValue={[properties.bottomHeight]}
                                max={200}
                                step={5}
                                min={5}
                                onValueChange={(valueArray) => setProperties({...properties, bottomHeight: valueArray[0]})}
                            />
                            <Label>Wave Density ({properties.waveDensity})</Label>
                            <Slider
                                defaultValue={[properties.waveDensity]}
                                max={1}
                                step={0.1}
                                min={0.1}
                                onValueChange={(valueArray) => setProperties({...properties, waveDensity: valueArray[0]})}
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
                                    geometry={getBottomGeometry(properties.radius, properties.waveDensity, properties.bottomHeight, (properties.bottomHeight / properties.topHeight))}
                                    material={getGlobalMaterial(properties.color)} />
                            </group>
                            <OrbitControls />
                        </Canvas>
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )
}

function getBottomGeometry(radius: number, waveDensity: number, height: number, twistRatio: number): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
    const bodyGeometry = createWavyGeometry(radius, 0.4, waveDensity, height, .1 * twistRatio, 1024, true);
    const bodyBrush = new Brush(bodyGeometry);

    const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 4, 32);
    floorGeometry.translate(0, 2, 0);
    const floorBrush = new Brush(floorGeometry);

    const waterHoleGeometry = new THREE.BoxGeometry(20, 15, 20);
    waterHoleGeometry.translate(radius, height - 5.5, 0);
    const waterHoleBrush = new Brush(waterHoleGeometry);

    const waterEntryGeometry = new THREE.BoxGeometry(25, 15, 25);
    waterEntryGeometry.translate(radius , height - 7.5, 0);
    const waterEntryBrush = new Brush(waterEntryGeometry);

    const cylinderHoleGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, height, 32);
    cylinderHoleGeometry.translate(0, (height / 2) + 4, 0);
    const cylinderHoleBrush = new Brush(cylinderHoleGeometry);

    const evaluator = new Evaluator();
    let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);
    result = evaluator.evaluate(result, waterEntryBrush, ADDITION);
    result = evaluator.evaluate(result, waterHoleBrush, SUBTRACTION);
    result = evaluator.evaluate(result, cylinderHoleBrush, SUBTRACTION);
    result.geometry = mergeVertices(result.geometry, 1e-5);
    result.geometry.deleteAttribute('normal');
    result.geometry.computeVertexNormals();

    return result.geometry;
}
