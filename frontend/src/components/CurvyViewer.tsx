import { Suspense, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Environment } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as THREE from "three";
import "./CurvyViewer.css";

interface CurvyViewerProps {
  url?: string;
}

// Elegant color palette
const COLORS = {
  xAxis: "#f43f5e",      // Soft coral/rose
  yAxis: "#14b8a6",      // Soft teal
  zAxis: "#818cf8",      // Soft indigo
  grid: "#27272a",       // Subtle dark
  gridAccent: "#3f3f46", // Slightly lighter
  text: "#71717a",       // Muted text
  background: "#0c0c0e", // Deep dark
};

// Subtle ruler component with elegant styling
function Ruler({ 
  axis, 
  visible = true 
}: { 
  axis: "x" | "y" | "z"; 
  visible?: boolean;
}) {
  const { camera } = useThree();
  const [scale, setScale] = useState(1);
  const [increment, setIncrement] = useState(10);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const distance = camera.position.length();
    const newScale = Math.max(0.3, Math.min(2, distance / 80));
    setScale(newScale);
    
    if (distance > 300) setIncrement(100);
    else if (distance > 150) setIncrement(50);
    else if (distance > 80) setIncrement(20);
    else if (distance > 40) setIncrement(10);
    else setIncrement(5);
  });

  const color = axis === "x" ? COLORS.xAxis : axis === "y" ? COLORS.yAxis : COLORS.zAxis;
  
  const marks = useMemo(() => {
    if (!visible) return null;
    
    const markArray = [];
    const range = 200;
    
    for (let i = -range; i <= range; i += increment) {
      if (i === 0) continue; // Skip origin
      
      const pos: [number, number, number] = 
        axis === "x" ? [i, 0, 0] :
        axis === "y" ? [0, i, 0] :
        [0, 0, i];
      
      const textOffset: [number, number, number] = 
        axis === "x" ? [0, -3 * scale, 0] :
        axis === "y" ? [-3 * scale, 0, 0] :
        [-3 * scale, 0, 0];
      
      markArray.push(
        <group key={`${axis}-${i}`} position={pos}>
          {/* Small tick mark */}
          <mesh>
            <sphereGeometry args={[0.3 * scale, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
          {/* Number label */}
          <Text
            position={textOffset}
            fontSize={2.5 * scale}
            color={COLORS.text}
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.7}
          >
            {i}
          </Text>
        </group>
      );
    }
    return markArray;
  }, [axis, increment, scale, color, visible]);

  if (!visible) return null;

  const lineLength = 250;
  const linePoints = 
    axis === "x" 
      ? [new THREE.Vector3(-lineLength, 0, 0), new THREE.Vector3(lineLength, 0, 0)]
      : axis === "y"
      ? [new THREE.Vector3(0, -lineLength, 0), new THREE.Vector3(0, lineLength, 0)]
      : [new THREE.Vector3(0, 0, -lineLength), new THREE.Vector3(0, 0, lineLength)];

  return (
    <group ref={groupRef}>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([...linePoints[0].toArray(), ...linePoints[1].toArray()])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </line>
      {marks}
    </group>
  );
}

// Simple axes helper using Three.js built-in (thin colored lines)
function SimpleAxes({ visible = true, size = 50 }: { visible?: boolean; size?: number }) {
  if (!visible) return null;
  
  return <axesHelper args={[size]} />;
}

// Elegant grid with fade effect
function ElegantGrid({ visible = true, size = 200, divisions = 20 }: { visible?: boolean; size?: number; divisions?: number }) {
  if (!visible) return null;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper 
        args={[size, divisions, COLORS.gridAccent, COLORS.grid]} 
        rotation={[Math.PI / 2, 0, 0]}
      />
      {/* Subtle ground plane for shadow catching */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <shadowMaterial transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// Model loader component
function ModelLoader({ 
  url, 
  onLoad 
}: { 
  url?: string; 
  onLoad?: (object: THREE.Object3D) => void;
}) {
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!url) {
      setModel(null);
      setError(null);
      return;
    }

    const loadModel = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading model from URL:', url);
        
        let loadedModel: THREE.Object3D;
        const urlWithoutQuery = url.split('?')[0];

        if (urlWithoutQuery.toLowerCase().endsWith(".stl")) {
          const loader = new STLLoader();
          const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
            loader.load(
              url,
              (geo) => {
                geo.computeVertexNormals();
                geo.center();
                resolve(geo);
              },
              undefined,
              reject
            );
          });
          
          // Elegant metallic material
          const material = new THREE.MeshStandardMaterial({ 
            color: "#6366f1",
            metalness: 0.4,
            roughness: 0.35,
            envMapIntensity: 0.8,
          });
          loadedModel = new THREE.Mesh(geometry, material);
          loadedModel.castShadow = true;
          loadedModel.receiveShadow = true;
          
        } else if (urlWithoutQuery.toLowerCase().endsWith(".gltf") || urlWithoutQuery.toLowerCase().endsWith(".glb")) {
          const loader = new GLTFLoader();
          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
          loader.setDRACOLoader(dracoLoader);
          
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(url, resolve, undefined, reject);
          });
          loadedModel = gltf.scene;
          
          const box = new THREE.Box3().setFromObject(loadedModel);
          const center = box.getCenter(new THREE.Vector3());
          loadedModel.position.sub(center);
        } else {
          throw new Error("Unsupported file format");
        }

        // Auto-fit camera
        const box = new THREE.Box3().setFromObject(loadedModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = 50;
        const cameraDistance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));
        
        camera.position.set(cameraDistance * 1.2, cameraDistance * 0.8, cameraDistance * 1.2);
        camera.lookAt(0, 0, 0);

        setModel(loadedModel);
        console.log('Model loaded successfully!');
        
        if (onLoad) {
          onLoad(loadedModel);
        }
      } catch (err) {
        console.error("Error loading model:", err);
        setError(err instanceof Error ? err.message : "Failed to load model");
        setModel(null);
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [url, camera, onLoad]);

  if (error) {
    return (
      <Text position={[0, 0, 0]} fontSize={4} color={COLORS.xAxis} anchorX="center" anchorY="middle">
        {`Error: ${error}`}
      </Text>
    );
  }

  if (loading) {
    return (
      <group>
        <Text position={[0, 5, 0]} fontSize={4} color={COLORS.text} anchorX="center" anchorY="middle">
          Loading...
        </Text>
        {/* Animated loading indicator */}
        <mesh position={[0, -5, 0]}>
          <torusGeometry args={[3, 0.5, 8, 32]} />
          <meshStandardMaterial color={COLORS.zAxis} metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  return model ? <primitive object={model} /> : null;
}

// Scene lighting setup
function SceneLighting() {
  return (
    <>
      {/* Soft ambient light */}
      <ambientLight intensity={0.4} color="#f0f0ff" />
      
      {/* Main key light */}
      <directionalLight 
        position={[50, 80, 50]} 
        intensity={1.2} 
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      
      {/* Fill light */}
      <directionalLight 
        position={[-30, 40, -30]} 
        intensity={0.4} 
        color="#c7d2fe"
      />
      
      {/* Rim light for edge definition */}
      <directionalLight 
        position={[0, -20, -50]} 
        intensity={0.3} 
        color="#818cf8"
      />
      
      {/* Hemisphere light for natural feel */}
      <hemisphereLight 
        args={["#c7d2fe", "#27272a", 0.5]} 
      />
    </>
  );
}

// Control Panel Component
function ControlPanel({
  showGrid,
  setShowGrid,
  showAxes,
  setShowAxes,
  showRulers,
  setShowRulers,
  onResetCamera,
  isLoading,
}: {
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  showAxes: boolean;
  setShowAxes: (val: boolean) => void;
  showRulers: boolean;
  setShowRulers: (val: boolean) => void;
  onResetCamera: () => void;
  isLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`curvy-control-panel ${isOpen ? "open" : "closed"}`}>
      <button className="curvy-panel-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "⚙"} {isOpen ? "Close" : ""}
      </button>
      {isOpen && (
        <div className="curvy-panel-content">
          <h3>View Options</h3>
          
          {isLoading && (
            <div className="curvy-loading-indicator">
              <div className="curvy-spinner"></div>
              <span>Loading...</span>
            </div>
          )}
          
          <div className="curvy-control-group">
            <label>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Show Grid
            </label>
          </div>

          <div className="curvy-control-group">
            <label>
              <input
                type="checkbox"
                checked={showAxes}
                onChange={(e) => setShowAxes(e.target.checked)}
              />
              Show Axes
            </label>
          </div>

          <div className="curvy-control-group">
            <label>
              <input
                type="checkbox"
                checked={showRulers}
                onChange={(e) => setShowRulers(e.target.checked)}
              />
              Show Rulers
            </label>
          </div>

          <div className="curvy-control-group" style={{ marginTop: '0.75rem' }}>
            <button onClick={onResetCamera} className="curvy-btn">
              ↺ Reset View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <group>
      <Text 
        position={[0, 5, 0]} 
        fontSize={4} 
        color="#52525b" 
        anchorX="center" 
        anchorY="middle"
        fillOpacity={0.5}
      >
        No model loaded
      </Text>
      <Text 
        position={[0, -3, 0]} 
        fontSize={2.5} 
        color="#3f3f46" 
        anchorX="center" 
        anchorY="middle"
        fillOpacity={0.4}
      >
        Generate a 3D model to preview
      </Text>
    </group>
  );
}

export function CurvyViewer({ url }: CurvyViewerProps) {
  // Clean defaults - minimal appearance
  const [showGrid, setShowGrid] = useState(false);
  const [showAxes, setShowAxes] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | undefined>(url);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.toLowerCase().endsWith(".stl") || 
                 file.name.toLowerCase().endsWith(".gltf") || 
                 file.name.toLowerCase().endsWith(".glb"))) {
      const objectUrl = URL.createObjectURL(file);
      setModelUrl(objectUrl);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Reset camera
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(80, 60, 80);
      cameraRef.current.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, []);

  // Update model URL when prop changes
  useEffect(() => {
    if (url) {
      console.log('CurvyViewer: New URL received:', url);
      setModelUrl(url);
      setIsLoading(true);
    }
  }, [url]);

  const handleModelLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div
      className="curvy-viewer-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.gltf,.glb"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const objectUrl = URL.createObjectURL(file);
            setModelUrl(objectUrl);
          }
        }}
      />
      
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: `linear-gradient(180deg, #0f0f12 0%, #0a0a0c 50%, #09090b 100%)` }}
      >
        <PerspectiveCamera
          makeDefault
          position={[80, 60, 80]}
          fov={50}
          ref={cameraRef}
        />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={500}
          enablePan
          panSpeed={0.8}
          rotateSpeed={0.5}
          zoomSpeed={1}
        />
        
        <Suspense fallback={null}>
          <SceneLighting />
          
          {/* Grid */}
          <ElegantGrid visible={showGrid} />
          
          {/* Simple axes */}
          <SimpleAxes visible={showAxes} size={50} />
          
          {/* Rulers */}
          {showRulers && (
            <>
              <Ruler axis="x" visible={showRulers} />
              <Ruler axis="y" visible={showRulers} />
              <Ruler axis="z" visible={showRulers} />
            </>
          )}
          
          {/* Model or empty state */}
          {modelUrl ? (
            <ModelLoader url={modelUrl} onLoad={handleModelLoad} />
          ) : (
            <EmptyState />
          )}
        </Suspense>
      </Canvas>

      <ControlPanel
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        showAxes={showAxes}
        setShowAxes={setShowAxes}
        showRulers={showRulers}
        setShowRulers={setShowRulers}
        onResetCamera={handleResetCamera}
        isLoading={isLoading}
      />
    </div>
  );
}

export default CurvyViewer;
