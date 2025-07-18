import * as THREE from "three";

export interface WavyProperties {
  color: string;
  radius: number;
  topHeight: number;
  bottomHeight: number;
  waveDensity: number;
}

export const wavyProperties: WavyProperties = {
  color: "#A7C7E7",
  radius: 75,
  topHeight: 100,
  bottomHeight: 50,
  waveDensity: 0.3,
};

export const getGlobalMaterial = (color: string) => new THREE.MeshMatcapMaterial({
  color: new THREE.Color(color),
});