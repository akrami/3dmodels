import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import AppLayout from "@/layouts/appLayout";
import { getConnectorGeometry } from "@/utils/geometry";
import * as React from "react";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useModelProperties, useModelDownload } from "@/utils/common";
import WavyControls from "@/components/wavy-controls";
import Scene from "@/components/scene";

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
                                    customHeightLabel: "Height",
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
    )
}

