import React, { useRef, useLayoutEffect, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { BufferGeometry } from "three";
import { syncFaces, syncLines, syncLinesFromFaces } from "replicad-threejs-helper";

export interface ReplicadMeshProps {
  faces: any;
  edges: any;
}

export default React.memo(function ReplicadMesh({ faces, edges }: ReplicadMeshProps) {
  const { invalidate } = useThree();
  const body = useRef(new BufferGeometry());
  const lines = useRef(new BufferGeometry());

  useLayoutEffect(() => {
    if (faces) syncFaces(body.current, faces);
    if (edges) syncLines(lines.current, edges);
    else if (faces) syncLinesFromFaces(lines.current, body.current);
    invalidate();
  }, [faces, edges, invalidate]);

  useEffect(() => {
    return () => {
      body.current.dispose();
      lines.current.dispose();
      invalidate();
    };
  }, [invalidate]);

  return (
    <group>
      <mesh geometry={body.current}>
        <meshStandardMaterial polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments geometry={lines.current}>
        <lineBasicMaterial />
      </lineSegments>
    </group>
  );
});
