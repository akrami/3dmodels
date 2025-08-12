import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { getBottomGeometry } from "@/utils/geometry";
import * as React from "react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useModelProperties, useModelDownload } from "@/utils/common";
import WavyControls from "@/components/wavy-controls";
import Scene from "@/components/scene";

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

