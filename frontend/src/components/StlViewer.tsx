import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";

interface StlViewerProps {
  url?: string;
}

function StlModel({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (!url) return;

    const loader = new STLLoader();
    loader.load(
      url,
      (loadedGeometry) => {
        loadedGeometry.computeVertexNormals();
        loadedGeometry.center();
        setGeometry(loadedGeometry);
      },
      undefined,
      (error) => {
        console.error("Error loading STL:", error);
      }
    );
  }, [url]);

  if (!geometry) {
    return null;
  }

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        color="#ffffff" 
        metalness={0.1} 
        roughness={0.7}
        wireframe={false}
      />
    </mesh>
  );
}

export function StlViewer({ url }: StlViewerProps) {
  if (!url) {
    return (
      <div style={{ 
        width: "100%", 
        height: "100%", 
        minHeight: "400px",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        color: "#666666",
        borderRadius: "8px",
        border: "1px solid #333333"
      }}>
        <p style={{ fontSize: "0.9rem" }}>No model loaded. Generate a model to see it here.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#0a0a0a", borderRadius: "8px", border: "1px solid #333333" }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 100]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <directionalLight position={[-10, -10, -5]} intensity={0.6} />
          <pointLight position={[0, 0, 50]} intensity={0.5} />
          <StlModel url={url} />
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            minDistance={50}
            maxDistance={300}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
          <gridHelper args={[200, 20, "#333333", "#1a1a1a"]} />
          <axesHelper args={[50]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

