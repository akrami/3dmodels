import { useRef, useState, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { Canvas, type ThreeElements } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelControls } from "@/components/model-controls";
import { useStlExport } from "@/hooks/use-stl-export";

const OBJECT_TEMPLATE = {
    name: 'wave',
    defaults: {
        radius: 100,
        amplitude: 0.2,
        density: 0.6,
        depth: 123,
        rotation: 12,
    }
};

type MeshProps = ThreeElements['mesh'];
type RingGearProps = {
    R: number;
    A: number;
    n: number;
    depth: number;
    rot?: number;
    segments?: number;
    material?: THREE.Material | THREE.Material[];
} & MeshProps;

export default function WavePlanterModel() {
    const [properties, setProperties] = useState(OBJECT_TEMPLATE.defaults);
    const meshRef = useRef<THREE.Mesh>(null);
    const exportModel = useStlExport(OBJECT_TEMPLATE.name, meshRef);

    const handlePropUpdate = (key: string, value: number) => {
        setProperties((prev) => ({ ...prev, [key]: value }));
    };

    const RingGear = ({
        R,
        A,
        n,
        depth,
        rot = 0,
        segments = 1024,
        material,
        ...meshProps
    }: RingGearProps) => {
        const geometry = useMemo(() => {
            const k = Math.round(R * n); // tooth count
            const rOuter = (θ: number) => R + A - Math.abs(Math.sin(k * θ));
            const rInner = R - (A + 4);

            const shape = new THREE.Shape();
            for (let i = 0; i <= segments; i++) {
                const θ = (i / segments) * Math.PI * 2;
                const r = rOuter(θ);
                const x = r * Math.cos(θ);
                const y = r * Math.sin(θ);
                i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
            }
            shape.closePath();

            const hole = new THREE.Path().absarc(
                0,           // x-centre
                0,           // y-centre
                rInner,      // radius
                0,           // startAngle
                Math.PI * 2, // endAngle
                true         // clockwise = hole
            );
            shape.holes.push(hole);

            const geom = new THREE.ExtrudeGeometry(shape, {
                steps: 1,
                depth,
                bevelEnabled: false,
                curveSegments: 128
            });

            if (rot !== 0) {
                const pos = geom.attributes.position as THREE.BufferAttribute;
                const v = new THREE.Vector3();

                for (let i = 0; i < pos.count; i++) {
                    v.fromBufferAttribute(pos, i);

                    const angle = v.z / depth * rot;

                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);

                    const x = v.x * cos - v.y * sin;
                    const y = v.x * sin + v.y * cos;

                    pos.setXYZ(i, x, y, v.z);
                }
                pos.needsUpdate = true;
                geom.computeVertexNormals();
            }

            return geom;
        }, [R, A, n, depth, segments]);

        useLayoutEffect(() => () => geometry.dispose(), [geometry]);

        return (
            <mesh geometry={geometry} {...meshProps} >
                {material ?? (<meshStandardMaterial attach="material" color="#4477ff" side={THREE.DoubleSide} />)}
            </mesh>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-gray-100">

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Side Panel */}
                <aside className="w-64 p-4 overflow-y-auto bg-gray-800 border-r border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Properties</h2>
                    <ModelControls
                        values={properties}
                        onChange={handlePropUpdate}
                        steps={{ amplitude: 0.1, density: 0.1, rotation: 0.1 }}
                    />
                    <button
                        onClick={exportModel}
                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    >
                        Export as .stl file
                    </button>
                </aside>

                {/* Viewer */}
                <main className="flex-1 relative">
                    <Canvas
                        camera={{ position: [0, -400, 300], fov: 60 }}
                        className="bg-gray-900"
                        shadows
                    >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[800, 1000, 700]} intensity={1} castShadow />
                        <mesh ref={meshRef} castShadow receiveShadow>
                            <RingGear
                                R={properties.radius}
                                A={properties.amplitude}
                                n={properties.density}
                                depth={properties.depth}
                                rot={Math.PI / properties.rotation}
                                position={[0, 0, 0]}
                                castShadow
                                receiveShadow
                            />
                            <meshStandardMaterial color="#AAAAAA" />
                        </mesh>
                        <OrbitControls />
                    </Canvas>
                </main>
            </div>
        </div>
    );
}