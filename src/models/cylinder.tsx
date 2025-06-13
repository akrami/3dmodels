import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ModelControls } from "@/components/model-controls";
import { SceneHelpers } from "@/components/scene-helpers";
import { useStlExport } from "@/hooks/use-stl-export";

const OBJECT_TEMPLATE = {
    name: 'cylinder',
    defaults: {
        radiusTop: 1,
        radiusBottom: 1,
        height: 2,
        radialSegments: 32,
    }
};

export default function CylinderModel() {
    const [properties, setProperties] = useState(OBJECT_TEMPLATE.defaults);
    const meshRef = useRef<THREE.Mesh>(null);
    const exportModel = useStlExport(OBJECT_TEMPLATE.name, meshRef);
    const polarAngle = Math.PI / 2;
    const geometryArgs = [
        properties.radiusTop,
        properties.radiusBottom,
        properties.height,
        properties.radialSegments
    ];

    const handlePropUpdate = (key: string, value: number) => {
        setProperties((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 p-4 overflow-y-auto bg-gray-800 border-r border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Properties</h2>
                    <ModelControls values={properties} onChange={handlePropUpdate} />
                    <button
                        onClick={exportModel}
                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    >
                        Export as .stl file
                    </button>
                </aside>
                <main className="flex-1 relative">
                    <Canvas
                        camera={{ position: [4, 4, 4], fov: 60, up: [0, 0, 1] }}
                        className="bg-gray-900"
                        shadows
                    >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 10, 7]} intensity={1} castShadow />
                        <SceneHelpers />
                        <mesh ref={meshRef} castShadow receiveShadow>
                            <cylinderGeometry args={geometryArgs} />
                            <meshStandardMaterial color="#AAAAAA" />
                        </mesh>
                        <OrbitControls
                            enablePan={false}
                            minPolarAngle={polarAngle}
                            maxPolarAngle={polarAngle}
                        />
                    </Canvas>
                </main>
            </div>
        </div>
    );
}