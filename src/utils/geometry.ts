import * as THREE from "three";
import { ADDITION, Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createWavyGeometry, createLowResWavyGeometry } from "./wave";
import { getPointsOnCircle } from "./3d";

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

  const lockRadius = radius - 3.15;
  const lockGeometry = new THREE.CylinderGeometry(lockRadius, lockRadius, 2, segmentCount);
  const lockBrush = new Brush(lockGeometry);
  lockBrush.position.setY(-1);
  lockBrush.updateMatrixWorld(true);
  result = evaluator.evaluate(result, lockBrush, ADDITION);

  const waterHoleTopGeometry = new THREE.CylinderGeometry(10, 10, 2);
  waterHoleTopGeometry.translate(0, 1, 0);
  const waterHoleTopBrush = new Brush(waterHoleTopGeometry);

  const waterHoleBottomGeometry = new THREE.CylinderGeometry(8, 8, 2);
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