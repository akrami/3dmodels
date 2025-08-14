import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@radix-ui/react-dropdown-menu';
import { Download } from 'lucide-react';
import { getContrastColor } from '@/utils/common';
import { type WavyProperties } from '@/utils/properties';

interface WavyControlsProps {
    properties: WavyProperties;
    setProperties: (props: WavyProperties) => void;
    onDownload: () => void;
    isGenerating: boolean;
    colorInputId: string;
    controls?: {
        showRadius?: boolean;
        showTopHeight?: boolean;
        showBottomHeight?: boolean;
        showWaveDensity?: boolean;
        showWaveTwist?: boolean;
        customHeightLabel?: string;
        customHeightValue?: number;
    };
}

export default function WavyControls({
    properties,
    setProperties,
    onDownload,
    isGenerating,
    colorInputId,
    controls = {}
}: WavyControlsProps) {
    const {
        showRadius = true,
        showTopHeight = false,
        showBottomHeight = false,
        showWaveDensity = true,
        showWaveTwist = true,
        customHeightLabel,
        customHeightValue
    } = controls;

    return (
        <>
            {showRadius && (
                <div className="space-y-2">
                    <Label className="text-sm">Radius ({properties.radius})</Label>
                    <Slider
                        defaultValue={[properties.radius]}
                        max={200}
                        step={5}
                        min={5}
                        onValueChange={(valueArray) => setProperties({ ...properties, radius: valueArray[0] })}
                        className="w-full"
                    />
                </div>
            )}
            
            {showTopHeight && (
                <div className="space-y-2">
                    <Label className="text-sm">Height ({properties.topHeight})</Label>
                    <Slider
                        defaultValue={[properties.topHeight]}
                        max={200}
                        step={5}
                        min={5}
                        onValueChange={(valueArray) => setProperties({ ...properties, topHeight: valueArray[0] })}
                        className="w-full"
                    />
                </div>
            )}
            
            {showBottomHeight && (
                <div className="space-y-2">
                    <Label className="text-sm">Height ({properties.bottomHeight})</Label>
                    <Slider
                        defaultValue={[properties.bottomHeight]}
                        max={200}
                        step={5}
                        min={5}
                        onValueChange={(valueArray) => setProperties({ ...properties, bottomHeight: valueArray[0] })}
                        className="w-full"
                    />
                </div>
            )}

            {customHeightLabel && customHeightValue !== undefined && (
                <div className="space-y-2">
                    <Label className="text-sm">{customHeightLabel} ({customHeightValue})</Label>
                    <Slider
                        defaultValue={[properties.bottomHeight]}
                        max={200}
                        step={5}
                        min={5}
                        onValueChange={(valueArray) => setProperties({ ...properties, bottomHeight: valueArray[0] })}
                        className="w-full"
                    />
                </div>
            )}
            
            {showWaveDensity && (
                <div className="space-y-2">
                    <Label className="text-sm">Wave Density ({properties.waveDensity})</Label>
                    <Slider
                        defaultValue={[properties.waveDensity]}
                        max={1}
                        step={0.1}
                        min={0.1}
                        onValueChange={(valueArray) => setProperties({ ...properties, waveDensity: valueArray[0] })}
                        className="w-full"
                    />
                </div>
            )}
            
            {showWaveTwist && (
                <div className="space-y-2">
                    <Label className="text-sm">Wave Twist ({properties.waveTwist})</Label>
                    <Slider
                        defaultValue={[properties.waveTwist]}
                        max={1}
                        step={0.1}
                        min={0}
                        onValueChange={(valueArray) => setProperties({ ...properties, waveTwist: valueArray[0] })}
                        className="w-full"
                    />
                </div>
            )}
            
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
                        onClick={() => document.getElementById(colorInputId)?.click()}
                    >
                        Color
                    </Button>
                    <input
                        id={colorInputId}
                        type="color"
                        value={properties.color}
                        onChange={(e) => setProperties({ ...properties, color: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>
            
            <Button onClick={onDownload} disabled={isGenerating}>
                <Download /> {isGenerating ? 'Generating...' : 'Download STL'}
            </Button>
        </>
    );
}
