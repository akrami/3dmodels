import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { getPointsOnCircle } from "@/utils/3d";
import exportStl from "@/utils/export";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { Button } from "@/components/ui/button";
import { wavyProperties, type WavyProperties } from "@/utils/properties";
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

    const globalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(properties.color),
        roughness: 0.8,
        metalness: 0.2,
    });

    const meshRef = React.useRef<THREE.Mesh>(null!);
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
                                    geometry={getConnectorGeometry(properties.bottomHeight - 5)}
                                    material={globalMaterial}
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

function getConnectorGeometry(height: number): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
    const bodyGeometry = new THREE.CylinderGeometry(8, 8, height, 32);
    const headGeometry = new THREE.CylinderGeometry(10, 10, 2, 32);
    headGeometry.translate(0, height / 2, 0);

    const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, height, 32);
    mainHoleGeometry.translate(0, 2, 0);

    const bodyMesh = new THREE.Mesh(bodyGeometry);
    bodyMesh.updateMatrix();
    const headMesh = new THREE.Mesh(headGeometry);
    headMesh.updateMatrix();
    const mainHoleMesh = new THREE.Mesh(mainHoleGeometry);
    mainHoleMesh.updateMatrix();

    let result = CSG.union(bodyMesh, headMesh);
    result = CSG.subtract(result, mainHoleMesh);

    const points = getPointsOnCircle(7, 4);

    const miniBottomHoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 32);
    for (const point of points) {
        const holeMesh = new THREE.Mesh(miniBottomHoleGeometry.clone());
        holeMesh.position.set(point.x, -height / 2 + 1, point.z);
        holeMesh.updateMatrix();
        result = CSG.subtract(result, holeMesh);
    }

    const sideHolesMesh = getSideHolesMesh(height - 10);
    result = CSG.subtract(result, sideHolesMesh);

    return result.geometry;
}

function getSideHolesMesh(height: number): THREE.Mesh {
    const capsuleHoleGeometry = new THREE.BoxGeometry(2, 20, height);
    let mesh1 = new THREE.Mesh(capsuleHoleGeometry);
    mesh1.rotateX(Math.PI / 2);
    mesh1.updateMatrix();
    const mesh2 = mesh1.clone();
    mesh2.rotateZ(Math.PI / 2);
    mesh2.updateMatrix();
    let result = CSG.union(mesh1, mesh2);

    const mesh3 = result.clone();
    mesh3.rotateY(Math.PI / 4);
    mesh3.updateMatrix();
    result = CSG.union(result, mesh3);
    return result;
}
