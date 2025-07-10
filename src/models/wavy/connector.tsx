import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { getPointsOnCircle } from "@/utils/3d";
import exportStl from "@/utils/export";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { ADDITION, Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { Button } from "@/components/ui/button";

export default function WavyConnector() {

    const [properties, setProperties] = React.useState({
        color: '#ffffff',
        radius: 75,
        topHeight: 100,
        bottomHeight: 50,
        waveDensity: 0.3,
    });

    const globalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(properties.color),
        roughness: 0.8,
        metalness: 0.2,
    });

    const meshRef = React.useRef(null);
    return (
        <AppLayout>
            <SidebarProvider>
                <div className="flex flex-1">
                    <Sidebar collapsible="none" className="border-r w-64">
                        <SidebarHeader>
                            <h2>Wavy Top</h2>
                        </SidebarHeader>
                        <SidebarContent className="p-4">
                            <Button onClick={() => exportStl(meshRef.current)}>Download</Button>
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
    bodyGeometry.translate(0, 0, 0);
    const bodyBrush = new Brush(bodyGeometry);

    const headGeometry = new THREE.CylinderGeometry(10, 10, 2, 32);
    headGeometry.translate(0, height / 2, 0);
    const headBrush = new Brush(headGeometry);

    const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, height, 32);
    mainHoleGeometry.translate(0, 2, 0);
    const mainHoleBrush = new Brush(mainHoleGeometry);

    const evaluator = new Evaluator();
    let result = evaluator.evaluate(bodyBrush, headBrush, ADDITION);
    result = evaluator.evaluate(result, mainHoleBrush, SUBTRACTION);

    const points = getPointsOnCircle(7, 4);

    const miniBottomHoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 32);
    for (let index = 0; index < points.length; index++) {
        const tempMiniBottomHoleGeometry = miniBottomHoleGeometry.clone();
        const miniBottomHoleBrush = new Brush(tempMiniBottomHoleGeometry);
        miniBottomHoleBrush.position.set(points[index].x, -height / 2 + 1, points[index].z);
        miniBottomHoleBrush.updateMatrixWorld(true);
        result = evaluator.evaluate(result, miniBottomHoleBrush, SUBTRACTION);
    }

    const sideHolesBrush = getMeshBrush(evaluator, height - 10);
    result = evaluator.evaluate(result, sideHolesBrush, SUBTRACTION);

    return result.geometry;
}

function getMeshBrush(evaluator: Evaluator, height: number) {
    const capsuleHoleGeometry = new THREE.BoxGeometry(2, 20, height);
    let capsuleHoleBrush01 = new Brush(capsuleHoleGeometry);
    capsuleHoleBrush01.rotateX(Math.PI / 2);
    capsuleHoleBrush01.updateMatrixWorld(true);
    const capsuleHoleBrush02 = capsuleHoleBrush01.clone();
    capsuleHoleBrush02.rotateZ(Math.PI / 2);
    capsuleHoleBrush02.updateMatrixWorld(true);
    capsuleHoleBrush01 = evaluator.evaluate(capsuleHoleBrush01, capsuleHoleBrush02, ADDITION);

    const capsuleHoleBrush03 = capsuleHoleBrush01.clone();
    capsuleHoleBrush03.rotateY(Math.PI / 4);
    capsuleHoleBrush03.updateMatrixWorld(true);
    capsuleHoleBrush01 = evaluator.evaluate(capsuleHoleBrush01, capsuleHoleBrush03, ADDITION);
    return capsuleHoleBrush01;
}