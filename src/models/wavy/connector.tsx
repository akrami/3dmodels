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
    const bodyMesh = new THREE.Mesh(bodyGeometry);

    const headGeometry = new THREE.CylinderGeometry(10, 10, 2, 32);
    headGeometry.translate(0, height / 2, 0);
    const headMesh = new THREE.Mesh(headGeometry);

    const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, height, 32);
    mainHoleGeometry.translate(0, 2, 0);
    const mainHoleMesh = new THREE.Mesh(mainHoleGeometry);

    bodyMesh.updateMatrix();
    headMesh.updateMatrix();
    let resultMesh = CSG.union(bodyMesh, headMesh);

    mainHoleMesh.updateMatrix();
    resultMesh = CSG.subtract(resultMesh, mainHoleMesh);

    const points = getPointsOnCircle(7, 4);
    const miniBottomHoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 32);
    for (let index = 0; index < points.length; index++) {
        const miniHole = new THREE.Mesh(miniBottomHoleGeometry.clone());
        miniHole.position.set(points[index].x, -height / 2 + 1, points[index].z);
        miniHole.updateMatrix();
        resultMesh = CSG.subtract(resultMesh, miniHole);
    }

    const sideHolesMesh = getMeshMesh(height - 10);
    sideHolesMesh.updateMatrix();
    resultMesh = CSG.subtract(resultMesh, sideHolesMesh);

    return resultMesh.geometry;
}

function getMeshMesh(height: number): THREE.Mesh {
    const capsuleHoleGeometry = new THREE.BoxGeometry(2, 20, height);
    const capsule1 = new THREE.Mesh(capsuleHoleGeometry);
    capsule1.rotateX(Math.PI / 2);
    capsule1.updateMatrix();
    const capsule2 = capsule1.clone();
    capsule2.rotateZ(Math.PI / 2);
    capsule2.updateMatrix();
    let result = CSG.union(capsule1, capsule2);

    const capsule3 = result.clone();
    capsule3.rotateY(Math.PI / 4);
    capsule3.updateMatrix();
    result = CSG.union(result, capsule3);
    return result;
}
