import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import exportStl from "@/utils/export";
import { getBottomGeometry } from "@/utils/geometry";
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
        return saved ? { ...wavyProperties, ...JSON.parse(saved) } : wavyProperties;
    });

    const getContrastColor = (hexColor: string) => {
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#ffffff';
    };

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
                        const highResGeometry = getBottomGeometry(
                            properties.radius, 
                            properties.waveDensity, 
                            properties.bottomHeight, 
                            properties.bottomHeight / properties.topHeight,
                            properties.waveTwist,
                            true
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
                            <div className="space-y-2">
                                <Label className="text-sm">Radius ({properties.radius})</Label>
                                <Slider
                                    defaultValue={[properties.radius]}
                                    max={200}
                                    step={5}
                                    min={5}
                                    onValueChange={(valueArray) => setProperties({...properties, radius: valueArray[0]})}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Height ({properties.bottomHeight})</Label>
                                <Slider
                                    defaultValue={[properties.bottomHeight]}
                                    max={200}
                                    step={5}
                                    min={5}
                                    onValueChange={(valueArray) => setProperties({...properties, bottomHeight: valueArray[0]})}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Wave Density ({properties.waveDensity})</Label>
                                <Slider
                                    defaultValue={[properties.waveDensity]}
                                    max={1}
                                    step={0.1}
                                    min={0.1}
                                    onValueChange={(valueArray) => setProperties({...properties, waveDensity: valueArray[0]})}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Wave Twist ({properties.waveTwist})</Label>
                                <Slider
                                    defaultValue={[properties.waveTwist]}
                                    max={1}
                                    step={0.1}
                                    min={0}
                                    onValueChange={(valueArray) => setProperties({...properties, waveTwist: valueArray[0]})}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2 mt-4">
                                <div className="relative">
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 border-2"
                                        style={{ 
                                            backgroundColor: properties.color,
                                            color: getContrastColor(properties.color),
                                            borderColor: getContrastColor(properties.color)
                                        }}
                                        onClick={() => document.getElementById('color-input-bottom')?.click()}
                                    >
                                        Color
                                    </Button>
                                    <input
                                        id="color-input-bottom"
                                        type="color"
                                        value={properties.color}
                                        onChange={(e) => setProperties({...properties, color: e.target.value})}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleDownload} disabled={isGenerating}>
                                <Download/> {isGenerating ? 'Generating...' : 'Download STL'}
                            </Button>
                        </SidebarContent>
                    </Sidebar>
                    <div className="flex-1 relative">
                        <Canvas
                            orthographic
                            camera={{ position: [200, 200, 200], zoom: 2, up: [0, 1, 0] }}
                            className="bg-gradient-to-br from-gray-50 to-gray-200"
                            shadows
                        >
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[50, 100, 70]} intensity={1} castShadow />
                            <gridHelper args={[500, 50, "#888888", "#444444"]} />
                            <group>
                                <mesh
                                    ref={meshRef}
                                    geometry={getBottomGeometry(properties.radius, properties.waveDensity, properties.bottomHeight, properties.bottomHeight / properties.topHeight, properties.waveTwist, false)}
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

