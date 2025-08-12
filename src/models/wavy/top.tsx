import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { getTopGeometry } from "@/utils/geometry";
import * as React from "react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useModelProperties, useModelDownload } from "@/utils/common";
import WavyControls from "@/components/wavy-controls";
import Scene from "@/components/scene";

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
    )
}

