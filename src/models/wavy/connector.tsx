import { Sidebar, SidebarContent, SidebarProvider } from '@/components/ui/sidebar';
import AppLayout from '@/layouts/appLayout';
import * as THREE from 'three';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useModelProperties, useModelDownload } from '@/utils/common';
import WavyControls from '@/components/wavy-controls';
import Scene from '@/components/scene';
import { ADDITION, Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { getPointsOnCircle } from '@/utils/3d';

export function getConnectorGeometry(height: number, isHighRes: boolean = false): THREE.BufferGeometry {
    const segmentCount = isHighRes ? 64 : 28;
    const miniHoleSegments = isHighRes ? 64 : 16;

    const bodyGeometry = new THREE.CylinderGeometry(8, 8, height, segmentCount);
    bodyGeometry.translate(0, 0, 0);
    const bodyBrush = new Brush(bodyGeometry);

    const headGeometry = new THREE.CylinderGeometry(10, 10, 2, segmentCount);
    headGeometry.translate(0, height / 2, 0);
    const headBrush = new Brush(headGeometry);

    const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, height, segmentCount);
    mainHoleGeometry.translate(0, 2, 0);
    const mainHoleBrush = new Brush(mainHoleGeometry);

    const evaluator = new Evaluator();
    let result = evaluator.evaluate(bodyBrush, headBrush, ADDITION);
    result = evaluator.evaluate(result, mainHoleBrush, SUBTRACTION);

    const points = getPointsOnCircle(7, 4);

    const miniBottomHoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, miniHoleSegments);
    for (let index = 0; index < points.length; index++) {
        const tempMiniBottomHoleGeometry = miniBottomHoleGeometry.clone();
        const miniBottomHoleBrush = new Brush(tempMiniBottomHoleGeometry);
        miniBottomHoleBrush.position.set(points[index].x, -height / 2 + 1, points[index].z);
        miniBottomHoleBrush.updateMatrixWorld(true);
        result = evaluator.evaluate(result, miniBottomHoleBrush, SUBTRACTION);
    }

    const sideHolesBrush = getMeshBrush(evaluator, height - 10);
    result = evaluator.evaluate(result, sideHolesBrush, SUBTRACTION);

    return result.geometry;
}

function getMeshBrush(evaluator: Evaluator, height: number): Brush {
    const capsuleHoleGeometry = new THREE.BoxGeometry(2, 20, height);
    let capsuleHoleBrush01 = new Brush(capsuleHoleGeometry);
    capsuleHoleBrush01.rotateX(Math.PI / 2);
    capsuleHoleBrush01.updateMatrixWorld(true);
    const capsuleHoleBrush02 = capsuleHoleBrush01.clone();
    capsuleHoleBrush02.rotateZ(Math.PI / 2);
    capsuleHoleBrush02.updateMatrixWorld(true);
    capsuleHoleBrush01 = evaluator.evaluate(capsuleHoleBrush01, capsuleHoleBrush02, ADDITION);

    const capsuleHoleBrush03 = capsuleHoleBrush01.clone();
    capsuleHoleBrush03.rotateY(Math.PI / 4);
    capsuleHoleBrush03.updateMatrixWorld(true);
    capsuleHoleBrush01 = evaluator.evaluate(capsuleHoleBrush01, capsuleHoleBrush03, ADDITION);
    return capsuleHoleBrush01;
}

export default function WavyConnector() {
    const [properties, setProperties] = useModelProperties();

    const { isGenerating, handleDownload, loadingMessage } = useModelDownload(
        () => getConnectorGeometry(properties.bottomHeight - 5, true),
        'wavy-connector',
        'Generating high-quality connector model...'
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
                                colorInputId="color-input-connector"
                                controls={{
                                    showRadius: false,
                                    showWaveDensity: false,
                                    showWaveTwist: false,
                                    customHeightLabel: 'Height',
                                    customHeightValue: properties.bottomHeight - 5
                                }}
                            />
                        </SidebarContent>
                    </Sidebar>
                    <div className="flex-1 relative">
                        <Scene
                            geometry={getConnectorGeometry(properties.bottomHeight - 5, false)}
                            color={properties.color}
                            position={[0, (properties.bottomHeight - 5) / 2, 0]}
                        />
                    </div>
                </div>
            </SidebarProvider>
        </AppLayout>
    );
}
