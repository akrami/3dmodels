import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { getPointsOnCircle } from "@/utils/3d";
import exportStl from "@/utils/export";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { CSG } from "@lib/csg";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
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
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, height, 32));

    const headGeometry = new THREE.CylinderGeometry(10, 10, 2, 32);
    headGeometry.translate(0, height / 2, 0);
    const headMesh = new THREE.Mesh(headGeometry);

    const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, height, 32);
    mainHoleGeometry.translate(0, 2, 0);
    const mainHoleMesh = new THREE.Mesh(mainHoleGeometry);

    let resultMesh = CSG.union(bodyMesh, headMesh);
    resultMesh = CSG.subtract(resultMesh, mainHoleMesh);

    const points = getPointsOnCircle(7, 4);

    const miniBottomHoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 32);
    for (let index = 0; index < points.length; index++) {
        const tempHoleMesh = new THREE.Mesh(miniBottomHoleGeometry.clone());
        tempHoleMesh.position.set(points[index].x, -height / 2 + 1, points[index].z);
        tempHoleMesh.updateMatrix();
        resultMesh = CSG.subtract(resultMesh, tempHoleMesh);
    }

    const sideHolesMesh = getCapsuleMesh(height - 10);
    resultMesh = CSG.subtract(resultMesh, sideHolesMesh);

    const geometry = mergeVertices(resultMesh.geometry, 1e-5);
    geometry.deleteAttribute('normal');
    geometry.computeVertexNormals();

    return geometry;
}

function getCapsuleMesh(height: number): THREE.Mesh {
    const capsuleHoleGeometry = new THREE.BoxGeometry(2, 20, height);
    const capsuleHoleMesh01 = new THREE.Mesh(capsuleHoleGeometry);
    capsuleHoleMesh01.rotateX(Math.PI / 2);
    capsuleHoleMesh01.updateMatrix();
    const capsuleHoleMesh02 = capsuleHoleMesh01.clone();
    capsuleHoleMesh02.rotateZ(Math.PI / 2);
    capsuleHoleMesh02.updateMatrix();
    let capsuleMesh = CSG.union(capsuleHoleMesh01, capsuleHoleMesh02);

    const capsuleHoleMesh03 = capsuleMesh.clone();
    capsuleHoleMesh03.rotateY(Math.PI / 4);
    capsuleHoleMesh03.updateMatrix();
    capsuleMesh = CSG.union(capsuleMesh, capsuleHoleMesh03);
    return capsuleMesh;
}
