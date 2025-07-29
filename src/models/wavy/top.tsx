import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { getPointsOnCircle } from "@/utils/3d";
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
    const [geometry, setGeometry] = React.useState<THREE.BufferGeometry>();

    React.useEffect(() => {
        (async () => {
            const geom = await getTopGeometry(
                properties.radius,
                properties.waveDensity,
                properties.topHeight,
            );
            setGeometry(geom);
        })();
    }, [properties.radius, properties.waveDensity, properties.topHeight]);
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
                                <mesh
                                    ref={meshRef}
                                    geometry={geometry}
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

async function getTopGeometry(
    radius: number,
    waveDensity: number,
    height: number,
): Promise<THREE.BufferGeometry<THREE.NormalBufferAttributes>> {
    const bodyGeometry = createWavyGeometry(radius, 0.4, waveDensity, height, .1, 1024, false);
    const bodyBrush = new Brush(bodyGeometry);
    const evaluator = new Evaluator()

    const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 2, 32);
    const floorBrush = new Brush(floorGeometry);
    floorBrush.position.setY(1);
    floorBrush.updateMatrixWorld(true);
    let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);

    const lockGeometry = new THREE.CylinderGeometry(radius - 5, radius - 5, 2, 32);
    const lockBrush = new Brush(lockGeometry);
    lockBrush.position.setY(-1);
    lockBrush.updateMatrixWorld(true);
    result = evaluator.evaluate(result, lockBrush, ADDITION);

    const waterHoleTopGeometry = new THREE.CylinderGeometry(10, 10, 2);
    waterHoleTopGeometry.translate(0, 1, 0);
    const waterHoleTopBrush = new Brush(waterHoleTopGeometry);

    const waterHoleBottomGeometry = new THREE.CylinderGeometry(8, 8, 2);
    waterHoleBottomGeometry.translate(0, -1, 0);
    const waterHoleBottomBrush = new Brush(waterHoleBottomGeometry);

    let holeCount = 1;
    switch (true) {
        case radius >= 50 && radius < 100:
            holeCount = 3;
            break;
        case radius >= 100:
            holeCount = 5;
            break;
    }

    const waterHoleResult = evaluator.evaluate(waterHoleTopBrush, waterHoleBottomBrush, ADDITION);
    if (holeCount == 1) {
        result = evaluator.evaluate(result, waterHoleResult, SUBTRACTION);
    } else {
        const points = getPointsOnCircle(radius, holeCount);
        for (let index = 0; index < points.length; index++) {
            const point = points[index];
            const waterHoleBrush = waterHoleResult.clone();
            waterHoleBrush.translateX(point.x);
            waterHoleBrush.translateZ(point.z);
            waterHoleBrush.updateMatrixWorld(true);
            result = evaluator.evaluate(result, waterHoleBrush, SUBTRACTION);
        }
    }


    result.geometry = mergeVertices(result.geometry, 1e-5);
    result.geometry.deleteAttribute('normal');
    result.geometry.computeVertexNormals();

    return result.geometry;
}
