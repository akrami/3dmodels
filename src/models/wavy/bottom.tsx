import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import * as THREE from 'three';
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useModelProperties, useModelDownload } from "@/utils/common";
import WavyControls from "@/components/wavy-controls";
import Scene from "@/components/scene";
import { mergeVertices } from "three-stdlib";
import { ADDITION, Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { createLowResWavyGeometry, createWavyGeometry } from "@/utils/wave";

export function getBottomGeometry(
    radius: number,
    waveDensity: number,
    height: number,
    twistRatio: number,
    waveTwist: number,
    isHighRes: boolean = false
): THREE.BufferGeometry {
    const segmentCount = isHighRes ? 64 : 28;
    const waveSegments = isHighRes ? 2048 : undefined;
    const mergeThreshold = isHighRes ? 1e-5 : 1e-4;

    const bodyGeometry = isHighRes
        ? createWavyGeometry(radius, 0.4, waveDensity, height, waveTwist * twistRatio, waveSegments, true)
        : createLowResWavyGeometry(radius, 0.4, waveDensity, height, waveTwist * twistRatio, true);
    const bodyBrush = new Brush(bodyGeometry);

    const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 4, segmentCount);
    floorGeometry.translate(0, 2, 0);
    const floorBrush = new Brush(floorGeometry);

    const waterHoleGeometry = new THREE.BoxGeometry(20, 15, 20);
    waterHoleGeometry.translate(radius, height - 5.5, 0);
    const waterHoleBrush = new Brush(waterHoleGeometry);

    const waterEntryGeometry = new THREE.BoxGeometry(25, 15, 25);
    waterEntryGeometry.translate(radius, height - 7.5, 0);
    const waterEntryBrush = new Brush(waterEntryGeometry);

    const cylinderHoleGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, height, segmentCount);
    cylinderHoleGeometry.translate(0, (height / 2) + 4, 0);
    const cylinderHoleBrush = new Brush(cylinderHoleGeometry);

    const evaluator = new Evaluator();
    let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);
    result = evaluator.evaluate(result, waterEntryBrush, ADDITION);
    result = evaluator.evaluate(result, waterHoleBrush, SUBTRACTION);
    result = evaluator.evaluate(result, cylinderHoleBrush, SUBTRACTION);
    result.geometry = mergeVertices(result.geometry, mergeThreshold);
    result.geometry.deleteAttribute('normal');
    result.geometry.computeVertexNormals();

    return result.geometry;
}

export default function WavyBottom() {
    const [properties, setProperties] = useModelProperties();

    const { isGenerating, handleDownload, loadingMessage } = useModelDownload(
        () => getBottomGeometry(
            properties.radius,
            properties.waveDensity,
            properties.bottomHeight,
            properties.bottomHeight / properties.topHeight,
            properties.waveTwist,
            true
        ),
        'wavy-bottom',
        'Generating high-quality wavy bottom model...'
    );

    return (
        <AppLayout>
            <LoadingOverlay isVisible={isGenerating} message={loadingMessage} />
            <SidebarProvider>
                <div className="flex flex-1">
                    <Sidebar collapsible="none" className="border-r w-64">
                        <SidebarContent className="p-4">
                            <WavyControls
                                properties={properties}
                                setProperties={setProperties}
                                onDownload={handleDownload}
                                isGenerating={isGenerating}
                                colorInputId="color-input-bottom"
                                controls={{
                                    showRadius: true,
                                    showBottomHeight: true,
                                    showWaveDensity: true,
                                    showWaveTwist: true
                                }}
                            />
                        </SidebarContent>
                    </Sidebar>
                    <div className="flex-1 relative">
                        <Scene
                            geometry={getBottomGeometry(properties.radius, properties.waveDensity, properties.bottomHeight, properties.bottomHeight / properties.topHeight, properties.waveTwist, false)}
                            color={properties.color}
                        />
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    )
}

