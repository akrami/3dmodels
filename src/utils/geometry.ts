import * as THREE from "three";
import { ADDITION, Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createWavyGeometry, createLowResWavyGeometry } from "./wave";
import { getPointsOnCircle } from "./3d";

export function getLowResBottomGeometry(
  radius: number, 
  waveDensity: number, 
  height: number, 
  twistRatio: number
): THREE.BufferGeometry {
  const bodyGeometry = createLowResWavyGeometry(radius, 0.4, waveDensity, height, .1 * twistRatio, true);
  const bodyBrush = new Brush(bodyGeometry);

  const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 4, 28);
  floorGeometry.translate(0, 2, 0);
  const floorBrush = new Brush(floorGeometry);

  const waterHoleGeometry = new THREE.BoxGeometry(20, 15, 20);
  waterHoleGeometry.translate(radius, height - 5.5, 0);
  const waterHoleBrush = new Brush(waterHoleGeometry);

  const waterEntryGeometry = new THREE.BoxGeometry(25, 15, 25);
  waterEntryGeometry.translate(radius, height - 7.5, 0);
  const waterEntryBrush = new Brush(waterEntryGeometry);

  const cylinderHoleGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, height, 28);
  cylinderHoleGeometry.translate(0, (height / 2) + 4, 0);
  const cylinderHoleBrush = new Brush(cylinderHoleGeometry);

  const evaluator = new Evaluator();
  let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);
  result = evaluator.evaluate(result, waterEntryBrush, ADDITION);
  result = evaluator.evaluate(result, waterHoleBrush, SUBTRACTION);
  result = evaluator.evaluate(result, cylinderHoleBrush, SUBTRACTION);
  result.geometry = mergeVertices(result.geometry, 1e-4);
  result.geometry.deleteAttribute('normal');
  result.geometry.computeVertexNormals();

  return result.geometry;
}

export function getHighResBottomGeometry(
  radius: number, 
  waveDensity: number, 
  height: number, 
  twistRatio: number
): THREE.BufferGeometry {
  const bodyGeometry = createWavyGeometry(radius, 0.4, waveDensity, height, .1 * twistRatio, 2048, true);
  const bodyBrush = new Brush(bodyGeometry);

  const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 4, 64);
  floorGeometry.translate(0, 2, 0);
  const floorBrush = new Brush(floorGeometry);

  const waterHoleGeometry = new THREE.BoxGeometry(20, 15, 20);
  waterHoleGeometry.translate(radius, height - 5.5, 0);
  const waterHoleBrush = new Brush(waterHoleGeometry);

  const waterEntryGeometry = new THREE.BoxGeometry(25, 15, 25);
  waterEntryGeometry.translate(radius, height - 7.5, 0);
  const waterEntryBrush = new Brush(waterEntryGeometry);

  const cylinderHoleGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, height, 64);
  cylinderHoleGeometry.translate(0, (height / 2) + 4, 0);
  const cylinderHoleBrush = new Brush(cylinderHoleGeometry);

  const evaluator = new Evaluator();
  let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);
  result = evaluator.evaluate(result, waterEntryBrush, ADDITION);
  result = evaluator.evaluate(result, waterHoleBrush, SUBTRACTION);
  result = evaluator.evaluate(result, cylinderHoleBrush, SUBTRACTION);
  result.geometry = mergeVertices(result.geometry, 1e-5);
  result.geometry.deleteAttribute('normal');
  result.geometry.computeVertexNormals();

  return result.geometry;
}

export function getLowResTopGeometry(
  radius: number, 
  waveDensity: number, 
  height: number
): THREE.BufferGeometry {
  const bodyGeometry = createLowResWavyGeometry(radius, 0.4, waveDensity, height, .1, false);
  const bodyBrush = new Brush(bodyGeometry);
  const evaluator = new Evaluator();

  const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 2, 28);
  const floorBrush = new Brush(floorGeometry);
  floorBrush.position.setY(1);
  floorBrush.updateMatrixWorld(true);
  let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);

  const lockGeometry = new THREE.CylinderGeometry(radius - 5, radius - 5, 2, 28);
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

  result.geometry = mergeVertices(result.geometry, 1e-4);
  result.geometry.deleteAttribute('normal');
  result.geometry.computeVertexNormals();

  return result.geometry;
}

export function getHighResTopGeometry(
  radius: number, 
  waveDensity: number, 
  height: number
): THREE.BufferGeometry {
  const bodyGeometry = createWavyGeometry(radius, 0.4, waveDensity, height, .1, 2048, false);
  const bodyBrush = new Brush(bodyGeometry);
  const evaluator = new Evaluator();

  const floorGeometry = new THREE.CylinderGeometry(radius - 3, radius - 3, 2, 64);
  const floorBrush = new Brush(floorGeometry);
  floorBrush.position.setY(1);
  floorBrush.updateMatrixWorld(true);
  let result = evaluator.evaluate(bodyBrush, floorBrush, ADDITION);

  const lockGeometry = new THREE.CylinderGeometry(radius - 5, radius - 5, 2, 64);
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

  result.geometry = mergeVertices(result.geometry, 1e-5);
  result.geometry.deleteAttribute('normal');
  result.geometry.computeVertexNormals();

  return result.geometry;
}

export function getLowResConnectorGeometry(height: number): THREE.BufferGeometry {
  const bodyGeometry = new THREE.CylinderGeometry(8, 8, height, 28);
  bodyGeometry.translate(0, 0, 0);
  const bodyBrush = new Brush(bodyGeometry);

  const headGeometry = new THREE.CylinderGeometry(10, 10, 2, 28);
  headGeometry.translate(0, height / 2, 0);
  const headBrush = new Brush(headGeometry);

  const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, height, 28);
  mainHoleGeometry.translate(0, 2, 0);
  const mainHoleBrush = new Brush(mainHoleGeometry);

  const evaluator = new Evaluator();
  let result = evaluator.evaluate(bodyBrush, headBrush, ADDITION);
  result = evaluator.evaluate(result, mainHoleBrush, SUBTRACTION);

  const points = getPointsOnCircle(7, 4);

  const miniBottomHoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 16);
  for (let index = 0; index < points.length; index++) {
    const tempMiniBottomHoleGeometry = miniBottomHoleGeometry.clone();
    const miniBottomHoleBrush = new Brush(tempMiniBottomHoleGeometry);
    miniBottomHoleBrush.position.set(points[index].x, -height / 2 + 1, points[index].z);
    miniBottomHoleBrush.updateMatrixWorld(true);
    result = evaluator.evaluate(result, miniBottomHoleBrush, SUBTRACTION);
  }

  const sideHolesBrush = getLowResMeshBrush(evaluator, height - 10);
  result = evaluator.evaluate(result, sideHolesBrush, SUBTRACTION);

  return result.geometry;
}

export function getHighResConnectorGeometry(height: number): THREE.BufferGeometry {
  const bodyGeometry = new THREE.CylinderGeometry(8, 8, height, 64);
  bodyGeometry.translate(0, 0, 0);
  const bodyBrush = new Brush(bodyGeometry);

  const headGeometry = new THREE.CylinderGeometry(10, 10, 2, 64);
  headGeometry.translate(0, height / 2, 0);
  const headBrush = new Brush(headGeometry);

  const mainHoleGeometry = new THREE.CylinderGeometry(6, 6, height, 64);
  mainHoleGeometry.translate(0, 2, 0);
  const mainHoleBrush = new Brush(mainHoleGeometry);

  const evaluator = new Evaluator();
  let result = evaluator.evaluate(bodyBrush, headBrush, ADDITION);
  result = evaluator.evaluate(result, mainHoleBrush, SUBTRACTION);

  const points = getPointsOnCircle(7, 4);

  const miniBottomHoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 64);
  for (let index = 0; index < points.length; index++) {
    const tempMiniBottomHoleGeometry = miniBottomHoleGeometry.clone();
    const miniBottomHoleBrush = new Brush(tempMiniBottomHoleGeometry);
    miniBottomHoleBrush.position.set(points[index].x, -height / 2 + 1, points[index].z);
    miniBottomHoleBrush.updateMatrixWorld(true);
    result = evaluator.evaluate(result, miniBottomHoleBrush, SUBTRACTION);
  }

  const sideHolesBrush = getHighResMeshBrush(evaluator, height - 10);
  result = evaluator.evaluate(result, sideHolesBrush, SUBTRACTION);

  return result.geometry;
}

function getLowResMeshBrush(evaluator: Evaluator, height: number): Brush {
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

function getHighResMeshBrush(evaluator: Evaluator, height: number): Brush {
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