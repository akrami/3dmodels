import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { STLExporter } from "three-stdlib";
import { OrbitControls } from "@react-three/drei";

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
    const meshRef = useRef(null);
    const geometryArgs = [
        properties.radiusTop,
        properties.radiusBottom,
        properties.height,
        properties.radialSegments
    ];

    const handleExport = () => {
        if (!meshRef.current) return;
        const exporter = new STLExporter();
        const stlString = exporter.parse(meshRef.current, { binary: true });
        const blob = new Blob([stlString], { type: "model/stl" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${OBJECT_TEMPLATE.name}.stl`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePropUpdate = (key: string, value: number) => {
        setProperties((prev: any) => ({ ...prev, [key]: value }));
    };

    const renderInputs = () => {
        return Object.keys(properties).map((key) => (
            <label key={key} className="flex flex-col gap-1 mb-2 text-sm">
                <span className="capitalize">{key}</span>
                <input
                    type="number"
                    value={properties[key]}
                    onChange={(e) => handlePropUpdate(key, parseFloat(e.target.value))}
                    className="border rounded p-1 bg-white text-black"
                />
            </label>
        ));
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-gray-100">

            {/* Main layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Side Panel */}
                <aside className="w-64 p-4 overflow-y-auto bg-gray-800 border-r border-gray-700">
                    <h2 className="text-lg font-semibold mb-4">Properties</h2>
                    {renderInputs()}
                    <button
                        onClick={handleExport}
                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    >
                        Export as .stl file
                    </button>
                </aside>

                {/* Viewer */}
                <main className="flex-1 relative">
                    <Canvas
                        camera={{ position: [4, 4, 4], fov: 60 }}
                        className="bg-gray-900"
                        shadows
                    >
                        <ambientLight intensity={0.6} />
                        <directionalLight position={[5, 10, 7]} intensity={1} castShadow />
                        <mesh ref={meshRef} castShadow receiveShadow>
                            <cylinderGeometry args={geometryArgs} />
                            <meshStandardMaterial color="#AAAAAA" />
                        </mesh>
                        <OrbitControls enablePan={false} />
                    </Canvas>
                </main>
            </div>
        </div>
    );
}