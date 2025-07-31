import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import exportStl from "@/utils/export";
import { getLowResBottomGeometry, getHighResBottomGeometry } from "@/utils/geometry";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { getGlobalMaterial, wavyProperties, type WavyProperties } from "@/utils/properties";
import { Slider } from "@/components/ui/slider";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Download } from "lucide-react";

export default function WavyBottom() {

    const [properties, setProperties] = React.useState<WavyProperties>(() => {
        const saved = localStorage.getItem('wavyProperties');
        return saved ? JSON.parse(saved) : wavyProperties;
    });
    React.useEffect(() => {
        localStorage.setItem('wavyProperties', JSON.stringify(properties));
    }, [properties]);

    const meshRef = React.useRef<THREE.Mesh>(null!);
    const [isGenerating, setIsGenerating] = React.useState(false);
    
    const handleDownload = async () => {
        setIsGenerating(true);
        
        // Force a delay to allow React to render the overlay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            // Wrap the heavy computation in setTimeout to prevent blocking
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    try {
                        const highResGeometry = getHighResBottomGeometry(
                            properties.radius, 
                            properties.waveDensity, 
                            properties.bottomHeight, 
                            properties.bottomHeight / properties.topHeight
                        );
                        const tempMesh = new THREE.Mesh(highResGeometry);
                        exportStl(tempMesh, 'wavy-bottom');
                        tempMesh.geometry.dispose();
                        resolve();
                    } catch (error) {
                        console.error('Error generating high-res model:', error);
                        resolve();
                    }
                }, 10);
            });
            
        } catch (error) {
            console.error('Error generating high-res model:', error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <AppLayout>
            <LoadingOverlay isVisible={isGenerating} message="Generating high-quality wavy bottom model..." />
            <SidebarProvider>
                <div className="flex flex-1">
                    <Sidebar collapsible="none" className="border-r w-64">
                        <SidebarContent className="p-4">
                            <Label>Radius ({properties.radius})</Label>
                            <Slider
                                defaultValue={[properties.radius]}
                                max={200}
                                step={5}
                                min={5}
                                onValueChange={(valueArray) => setProperties({...properties, radius: valueArray[0]})}
                            />
                            <Label>Height ({properties.bottomHeight})</Label>
                            <Slider
                                defaultValue={[properties.bottomHeight]}
                                max={200}
                                step={5}
                                min={5}
                                onValueChange={(valueArray) => setProperties({...properties, bottomHeight: valueArray[0]})}
                            />
                            <Label>Wave Density ({properties.waveDensity})</Label>
                            <Slider
                                defaultValue={[properties.waveDensity]}
                                max={1}
                                step={0.1}
                                min={0.1}
                                onValueChange={(valueArray) => setProperties({...properties, waveDensity: valueArray[0]})}
                            />
                            <Button onClick={handleDownload} disabled={isGenerating}>
                                <Download/> {isGenerating ? 'Generating...' : 'Download STL'}
                            </Button>
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
                                    ref={meshRef}
                                    geometry={getLowResBottomGeometry(properties.radius, properties.waveDensity, properties.bottomHeight, (properties.bottomHeight / properties.topHeight))}
                                    material={getGlobalMaterial(properties.color)} />
                            </group>
                            <OrbitControls />
                        </Canvas>
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )
}

