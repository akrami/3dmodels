import { Sidebar, SidebarContent, SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/layouts/appLayout';
import * as THREE from 'three';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useModelProperties, useModelDownload } from '@/utils/common';
import WavyControls from '@/components/wavy-controls';
import Scene from '@/components/scene';
import { createLowResWavyGeometry, createWavyGeometry } from '@/utils/wave';
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { getPointsOnCircle } from '@/utils/3d';
import { mergeVertices } from 'three-stdlib';

export function getTopGeometry(
    radius: number,
    waveDensity: number,
    height: number,
    waveTwist: number,
    isHighRes: boolean = false
): THREE.BufferGeometry {
    const segmentCount = isHighRes ? 64 : 28;
    const waveSegments = isHighRes ? 2048 : undefined;
    const mergeThreshold = isHighRes ? 1e-5 : 1e-4;

    const bodyGeometry = isHighRes
        ? createWavyGeometry(radius, 0.4, waveDensity, height, waveTwist, waveSegments, false)
        : createLowResWavyGeometry(radius, 0.4, waveDensity, height, waveTwist, false);
    const bodyBrush = new Brush(bodyGeometry);
    const evaluator = new Evaluator();

    const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 2, segmentCount);
    const floorBrush = new Brush(floorGeometry);
    floorBrush.position.setY(1);
    floorBrush.updateMatrixWorld(true);
    let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);

    const lockGeometry = new THREE.CylinderGeometry(radius - 3.15, radius - 3.15, 2, segmentCount);
    const lockBrush = new Brush(lockGeometry);
    lockBrush.position.setY(-1);
    lockBrush.updateMatrixWorld(true);
    result = evaluator.evaluate(result, lockBrush, ADDITION);

    const waterHoleTopGeometry = new THREE.CylinderGeometry(20, 20, 2);
    waterHoleTopGeometry.translate(0, 1, 0);
    const waterHoleTopBrush = new Brush(waterHoleTopGeometry);

    const waterHoleBottomGeometry = new THREE.CylinderGeometry(16, 16, 2);
    waterHoleBottomGeometry.translate(0, -1, 0);
    const waterHoleBottomBrush = new Brush(waterHoleBottomGeometry);

    let holeCount = 1;
    switch (true) {
        case radius >= 50 && radius < 100:
            holeCount = 3;
            break;
        case radius >= 100:
            holeCount = 5;
            break;
    }

    const waterHoleResult = evaluator.evaluate(waterHoleTopBrush, waterHoleBottomBrush, ADDITION);
    if (holeCount == 1) {
        result = evaluator.evaluate(result, waterHoleResult, SUBTRACTION);
    } else {
        const points = getPointsOnCircle(radius, holeCount);
        for (let index = 0; index < points.length; index++) {
            const point = points[index];
            const waterHoleBrush = waterHoleResult.clone();
            waterHoleBrush.translateX(point.x);
            waterHoleBrush.translateZ(point.z);
            waterHoleBrush.updateMatrixWorld(true);
            result = evaluator.evaluate(result, waterHoleBrush, SUBTRACTION);
        }
    }

    result.geometry = mergeVertices(result.geometry, mergeThreshold);
    result.geometry.deleteAttribute('normal');
    result.geometry.computeVertexNormals();

    return result.geometry;
}

export default function WavyTop() {
    const [properties, setProperties] = useModelProperties();

    const { isGenerating, handleDownload, loadingMessage } = useModelDownload(
        () => getTopGeometry(properties.radius, properties.waveDensity, properties.topHeight, properties.waveTwist, true),
        'wavy-top',
        'Generating high-quality wavy top model...'
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
                                colorInputId="color-input-top"
                                controls={{
                                    showRadius: true,
                                    showTopHeight: true,
                                    showWaveDensity: true,
                                    showWaveTwist: true
                                }}
                            />
                        </SidebarContent>
                    </Sidebar>
                    <div className="flex-1 relative">
                        <Scene
                            geometry={getTopGeometry(properties.radius, properties.waveDensity, properties.topHeight, properties.waveTwist, false)}
                            color={properties.color}
                        />
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    );
}

