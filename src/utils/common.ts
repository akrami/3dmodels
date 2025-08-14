import * as React from 'react';
import * as THREE from 'three';
import exportStl from '@/utils/export';
import { wavyProperties, type WavyProperties } from '@/utils/properties';

export const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
};

export const useModelProperties = () => {
    const [properties, setProperties] = React.useState<WavyProperties>(() => {
        const saved = localStorage.getItem('wavyProperties');
        return saved ? { ...wavyProperties, ...JSON.parse(saved) } : wavyProperties;
    });

    React.useEffect(() => {
        localStorage.setItem('wavyProperties', JSON.stringify(properties));
    }, [properties]);

    return [properties, setProperties] as const;
};

export const useModelDownload = (
    geometryFn: () => THREE.BufferGeometry,
    filename: string,
    loadingMessage: string
) => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    try {
                        const highResGeometry = geometryFn();
                        const tempMesh = new THREE.Mesh(highResGeometry);
                        exportStl(tempMesh, filename);
                        tempMesh.geometry.dispose();
                        resolve();
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error('Error generating high-res model:', error);
                        resolve();
                    }
                }, 10);
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error generating high-res model:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return { isGenerating, handleDownload, loadingMessage };
};

export const canvasConfig = {
    orthographic: true,
    camera: { position: [200, 200, 200] as [number, number, number], zoom: 2, up: [0, 1, 0] as [number, number, number] },
    className: 'bg-gradient-to-br from-gray-50 to-gray-200 w-full h-full',
    shadows: true,
};

export const defaultLights = [
    { type: 'ambient' as const, intensity: 0.6 },
    { type: 'directional' as const, position: [50, 100, 70] as [number, number, number], intensity: 1, castShadow: true },
];

export const defaultGridHelper = {
    args: [500, 50, '#888888', '#444444'] as [number, number, string, string],
};
