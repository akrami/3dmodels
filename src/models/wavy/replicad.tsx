import { SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { createMesh } from "@/utils/worker";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { BufferGeometry } from "three";
import { syncFaces } from "replicad-threejs-helper/dist/es/replicad-threejs-helper";
import { getGlobalMaterial } from "@/utils/properties";

function Scene({ faces }: { faces: any }) {
  const { invalidate } = useThree();
  const body = useRef(new BufferGeometry());

  useLayoutEffect(() => {
    if (faces) syncFaces(body.current, faces);
  }, [faces, invalidate]);

  useEffect(
    () => () => {
      body.current.dispose();
      invalidate();
    },
    [invalidate]
  );

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 100, 70]} intensity={1} castShadow />
      <gridHelper args={[500, 50, "#888888", "#444444"]} />
      <axesHelper args={[500]} />
      <group>
        <mesh geometry={body.current} material={getGlobalMaterial("#A7C7E7")} />
      </group>
      <OrbitControls />
    </>
  );
}

export default function WavyReplicad() {
  const [mesh, setMesh] = useState<any>(null);

  useEffect(() => {
    createMesh().then((m) => setMesh(m));
  }, []);

  const faces = mesh?.faces;

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex flex-1">
          <div className="flex-1 relative">
            <Canvas
              camera={{ position: [200, 200, 200], fov: 60, up: [0, 1, 0] }}
              className="bg-gradient-to-br from-gray-50 to-gray-200"
              shadows
            >
              <Scene faces={faces} />
            </Canvas>
          </div>
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
