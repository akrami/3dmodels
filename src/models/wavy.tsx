import * as React from "react";
import * as THREE from "three";
import AppLayout from "@/layouts/appLayout";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
    mergeVertices
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ADDITION, Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { STLExporter } from "three-stdlib";


export default function WavyPlanter() {
    type Point = { x: number, z: number }

    const [properties, setProperties] = React.useState({
        color: '#ffffff',
        radius: 75,
        topHeight: 100,
        bottomHeight: 50,
        waveDensity: 0.3,
    });

    const positionOffset = 20;

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
                            <h2>Wavy Model</h2>
                        </SidebarHeader>
                        <SidebarContent className="p-4">
                            <button onClick={exportStl}>Download</button>
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
                                    geometry={getTopGeometry()}
                                    material={globalMaterial}
                                    position={[-(properties.radius + positionOffset), 0, -(properties.radius + positionOffset)]} />

                                <mesh
                                    geometry={getBottomGeometry()}
                                    material={globalMaterial}
                                    position={[properties.radius + positionOffset, 0, -(properties.radius + positionOffset)]} />

                                <mesh
                                    ref={meshRef}
                                    geometry={getConnectorGeometry()}
                                    material={globalMaterial}
                                    position={[0, (properties.bottomHeight - 5) / 2, properties.radius + positionOffset]} />
                            </group>
                            <OrbitControls />
                        </Canvas>
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )

    function exportStl() {
        if (!meshRef.current) return;

        const exporter = new STLExporter();
        const arrayBuffer = exporter.parse(meshRef.current, { binary: true });

        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `export.stl`;
        link.click();
    }

    function getTopGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
        const bodyGeometry = createWavyGeometry(properties.radius, 0.4, properties.waveDensity, properties.topHeight, .1, 1024, false);
        const bodyBrush = new Brush(bodyGeometry);

        const floorGeometry = new THREE.CylinderGeometry(properties.radius - 3, properties.radius - 3, 4, 32);
        const floorBrush = new Brush(floorGeometry);

        const waterHoleTopGeometry = new THREE.CylinderGeometry(10, 10, 2);
        waterHoleTopGeometry.translate(0, 1, 0);
        const waterHoleTopBrush = new Brush(waterHoleTopGeometry);

        const waterHoleBottomGeometry = new THREE.CylinderGeometry(8, 8, 2);
        waterHoleBottomGeometry.translate(0, -1, 0);
        const waterHoleBottomBrush = new Brush(waterHoleBottomGeometry);

        let holeCount = 1;
        switch (true) {
            case properties.radius >= 50 && properties.radius < 100:
                holeCount = 3;
                break;
            case properties.radius >= 100:
                holeCount = 5;
                break;
        }

        const evaluator = new Evaluator()
        let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);

        const waterHoleResult = evaluator.evaluate(waterHoleTopBrush, waterHoleBottomBrush, ADDITION);
        if (holeCount == 1) {
            result = evaluator.evaluate(result, waterHoleResult, SUBTRACTION);
        } else {
            const points = getPointsOnCircle(properties.radius, holeCount);
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

    function getBottomGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
        const bodyGeometry = createWavyGeometry(properties.radius, 0.4, properties.waveDensity, properties.bottomHeight, .1 * (properties.bottomHeight / properties.topHeight), 1024, true);
        const bodyBrush = new Brush(bodyGeometry);

        const floorGeometry = new THREE.CylinderGeometry(properties.radius - 3, properties.radius - 3, 4, 32);
        floorGeometry.translate(0, 2, 0);
        const floorBrush = new Brush(floorGeometry);

        const waterHoleGeometry = new THREE.BoxGeometry(20, 10, 20);
        waterHoleGeometry.translate(properties.radius - 5, properties.bottomHeight, 0);
        const waterHoleBrush = new Brush(waterHoleGeometry);

        const waterEntryGeometry = new THREE.BoxGeometry(25, 7.5, 25);
        waterEntryGeometry.translate(properties.radius - 5, properties.bottomHeight - 3.7, 0);
        const waterEntryBrush = new Brush(waterEntryGeometry);

        const cylinderHoleGeometry = new THREE.CylinderGeometry(properties.radius - 3, properties.radius - 3, properties.bottomHeight, 32);
        cylinderHoleGeometry.translate(0, (properties.bottomHeight / 2) + 4, 0);
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

    function getConnectorGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
        const bodyGeometry = new THREE.CylinderGeometry(8, 8, properties.bottomHeight - 5, 32);
        bodyGeometry.translate(0, 0, 0);
        const bodyBrush = new Brush(bodyGeometry);

        const headGeometry = new THREE.CylinderGeometry(10, 10, 2, 32);
        headGeometry.translate(0, (properties.bottomHeight - 5) / 2, 0);
        const headBrush = new Brush(headGeometry);

        const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, properties.bottomHeight - 5, 32);
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
            miniBottomHoleBrush.position.set(points[index].x, -(properties.bottomHeight - 5) / 2 + 1, points[index].z);
            miniBottomHoleBrush.updateMatrixWorld(true);
            result = evaluator.evaluate(result, miniBottomHoleBrush, SUBTRACTION);
        }

        const sideHolesBrush = getMeshBrush(evaluator);
        result = evaluator.evaluate(result, sideHolesBrush, SUBTRACTION);
        
        return result.geometry;
    }

    function getMeshBrush(evaluator: Evaluator) {
        const capsuleHoleGeometry = new THREE.BoxGeometry(2, 20, properties.bottomHeight - 15);
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

    function createWavyGeometry(
        radius: number,
        amplitude: number,
        density: number,
        depth: number,
        twistWaves: number = 1,
        segments: number = 1024,
        reverseTwist: boolean = false,
        topCutDepth: number = 0,
    ) {

        const k = Math.round(radius * density);
        const rOuter = (t: number) => radius + amplitude - Math.abs(Math.sin(k * t));
        const rInner = radius - (amplitude + 4);

        const makeOuterShape = () => {
            const shape = new THREE.Shape();
            for (let i = 0; i <= segments; i++) {
                const t = (i / segments) * Math.PI * 2;
                const r = rOuter(t);
                const x = r * Math.cos(t);
                const y = r * Math.sin(t);
                i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
            }
            shape.closePath();
            return shape;
        };

        const outerShape = makeOuterShape();
        const holeBottom = new THREE.Path().absarc(0, 0, rInner, 0, Math.PI * 2, true);
        outerShape.holes.push(holeBottom);
        const geometry = extrude(outerShape, depth, 32);

        twistGeometry(geometry, depth, twistWaves, reverseTwist);

        const merged = mergeVertices(geometry);
        merged.computeVertexNormals();
        merged.rotateX(-Math.PI / 2);
        return merged;
    }

    function twistGeometry(
        geom: THREE.BufferGeometry,
        depth: number,
        twistWaves: number,
        reverse: boolean
    ) {
        const pos = geom.attributes.position as THREE.BufferAttribute;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            const t = v.z / depth;
            const tt = reverse ? 1 - t : t;
            const dir = reverse ? -1 : 1;
            const angle = Math.sin(tt * twistWaves * Math.PI * 2) * dir;
            v.applyEuler(new THREE.Euler(0, 0, angle));
            pos.setXYZ(i, v.x, v.y, v.z);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
    }

    function extrude(shape: THREE.Shape, depth: number, steps = 1) {
        return new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, curveSegments: 32, depth, steps });
    }

    function getPointsOnCircle(radius: number, n: number): Point[] {
        const r = radius / 2;
        const points: Point[] = [];

        for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n;
            const x = r * Math.cos(angle);
            const z = r * Math.sin(angle);
            points.push({ x, z });
        }

        return points;
    }
}