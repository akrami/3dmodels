import * as React from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getGlobalMaterial } from "@/utils/properties";
import { canvasConfig, defaultLights, defaultGridHelper } from "@/utils/common";

interface SceneProps {
    geometry: THREE.BufferGeometry;
    color: string;
    position?: [number, number, number];
}

export default function Scene({ geometry, color, position = [0, 0, 0] }: SceneProps) {
    const meshRef = React.useRef<THREE.Mesh>(null!);

    return (
        <Canvas
            orthographic={canvasConfig.orthographic}
            camera={canvasConfig.camera}
            className={canvasConfig.className}
            shadows={canvasConfig.shadows}
        >
            <ambientLight intensity={defaultLights[0].intensity} />
            <directionalLight 
                position={defaultLights[1].position} 
                intensity={defaultLights[1].intensity} 
                castShadow={defaultLights[1].castShadow} 
            />
            <gridHelper args={defaultGridHelper.args} />
            <group>
                <mesh
                    ref={meshRef}
                    geometry={geometry}
                    material={getGlobalMaterial(color)}
                    position={position}
                />
            </group>
            <OrbitControls />
        </Canvas>
    );
}