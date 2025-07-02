import * as React from "react";
import * as THREE from "three";
import AppLayout from "@/layouts/appLayout";
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
    mergeGeometries,
    mergeVertices
} from "three/examples/jsm/utils/BufferGeometryUtils.js";


export default function WavyPlanter() {
    const [properties, setProperties] = React.useState({
        color: '#56AE57',
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
                                    geometry={getConnectorGeometry()}
                                    material={globalMaterial}
                                    position={[0, (properties.bottomHeight - 10) / 2, properties.radius + positionOffset]} />
                            </group>
                            <OrbitControls />
                        </Canvas>
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )

    function getTopGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
        return createWavyGeometry(properties.radius, 0.4, properties.waveDensity, properties.topHeight, .1, 1024, false);
    }

    function getBottomGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
        return createWavyGeometry(properties.radius, 0.4, properties.waveDensity, properties.bottomHeight, .1, 1024, true);
    }

    function getConnectorGeometry(): THREE.BufferGeometry<THREE.NormalBufferAttributes> {
        return new THREE.CylinderGeometry(25, 25, properties.bottomHeight - 10, 32);
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
}