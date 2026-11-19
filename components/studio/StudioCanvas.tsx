'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { ProfileData, StudioFrameData } from '@/types/portfolio';
import { STUDIO_FRAME_DIMENSIONS, STUDIO_FRAME_PLACEMENTS } from '@/lib/frame-math';
import {
  createWalnutFloorTexture,
  createAcousticSlatsTexture,
  createUndersideGridTexture,
  createMonitorHeroTexture,
  createWallFrameTexture,
  createCurvedMonitorGeometry,
  loadCoverFitFrameTexture,
} from './studioTextures';

interface StudioCanvasProps {
  profile: ProfileData;
  wallFrames: StudioFrameData[];
  monitorProgress: number;
  setMonitorProgress: (progress: number | ((prev: number) => number)) => void;
  cameraMode: 'OVERVIEW' | 'FRAME_INSPECT' | 'MONITOR_PORTFOLIO';
  setCameraMode: (mode: 'OVERVIEW' | 'FRAME_INSPECT' | 'MONITOR_PORTFOLIO') => void;
  activeFrameIndex: number | null;
  setActiveFrameIndex: React.Dispatch<React.SetStateAction<number | null>>;
  onEnterMonitor: () => void;
}

export default function StudioCanvas({
  profile,
  wallFrames,
  monitorProgress,
  setMonitorProgress,
  cameraMode,
  setCameraMode,
  activeFrameIndex,
  setActiveFrameIndex,
  onEnterMonitor,
}: StudioCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    monitorProgress,
    cameraMode,
    activeFrameIndex,
    hoveredFrameIndex: null as number | null,
    pointerX: 0,
    pointerY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    panOffsetX: 0,
    panOffsetY: 0,
    zoomFactor: 1.0,
  });

  useEffect(() => {
    stateRef.current.monitorProgress = monitorProgress;
    stateRef.current.cameraMode = cameraMode;
    stateRef.current.activeFrameIndex = activeFrameIndex;
  }, [monitorProgress, cameraMode, activeFrameIndex]);

  const frameCount = Math.max(1, wallFrames.length);

  const handleNextFrame = useCallback(() => {
    setActiveFrameIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % frameCount;
    });
  }, [setActiveFrameIndex, frameCount]);

  const handlePrevFrame = useCallback(() => {
    setActiveFrameIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + frameCount) % frameCount;
    });
  }, [setActiveFrameIndex, frameCount]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cancelLoaders: (() => void)[] = [];

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b0d);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(5.8, 5.0, 5.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const disposables: { dispose: () => void }[] = [];

    // PMREMGenerator & RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnvScene = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnvScene, 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.32;
    roomEnvScene.dispose();
    pmremGenerator.dispose();
    disposables.push(envTexture);

    // Procedural Textures
    const floorTexture = createWalnutFloorTexture();
    floorTexture.anisotropy = maxAnisotropy;
    const slatsTexture = createAcousticSlatsTexture();
    const gridTexture = createUndersideGridTexture();
    let monitorTexture = createMonitorHeroTexture(profile);
    disposables.push(floorTexture, slatsTexture, gridTexture, monitorTexture);

    // Shared Materials
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.48,
      metalness: 0.08,
    });
    const slatsMaterial = new THREE.MeshStandardMaterial({
      map: slatsTexture,
      roughness: 0.75,
      metalness: 0.1,
    });
    const charcoalWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x18191c,
      roughness: 0.85,
      metalness: 0.08,
    });
    const steelTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a929e,
      roughness: 0.28,
      metalness: 0.85,
    });
    const walnutWoodMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.45,
      metalness: 0.1,
      color: 0x3d2b1f,
    });
    const matteBlackMetalMat = new THREE.MeshStandardMaterial({
      color: 0x141518,
      roughness: 0.45,
      metalness: 0.8,
    });
    const deskMatFabric = new THREE.MeshStandardMaterial({
      color: 0x1c1e24,
      roughness: 0.92,
      metalness: 0.04,
    });

    disposables.push(
      floorMaterial,
      slatsMaterial,
      charcoalWallMaterial,
      steelTrimMaterial,
      walnutWoodMat,
      matteBlackMetalMat,
      deskMatFabric
    );

    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // 2. Room Shell (Floor & Walls)
    const floorGeom = new THREE.BoxGeometry(8.0, 0.28, 8.0);
    const floorMesh = new THREE.Mesh(floorGeom, floorMaterial);
    floorMesh.position.set(0, -0.14, 0);
    floorMesh.receiveShadow = true;
    roomGroup.add(floorMesh);

    const underGeom = new THREE.PlaneGeometry(8.0, 8.0);
    const underMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      depthWrite: false,
    });
    const underMesh = new THREE.Mesh(underGeom, underMat);
    underMesh.rotation.x = Math.PI / 2;
    underMesh.position.set(0, -0.286, 0);
    roomGroup.add(underMesh);

    const trimGeom = new THREE.BoxGeometry(8.04, 0.04, 8.04);
    const trimMesh = new THREE.Mesh(trimGeom, steelTrimMaterial);
    trimMesh.position.set(0, -0.028, 0);
    roomGroup.add(trimMesh);

    const leftWallGeom = new THREE.BoxGeometry(0.2, 4.4, 7.8);
    const leftWallMesh = new THREE.Mesh(leftWallGeom, slatsMaterial);
    leftWallMesh.position.set(-3.9, 2.2, 0);
    leftWallMesh.receiveShadow = true;
    roomGroup.add(leftWallMesh);

    const backWallGeom = new THREE.BoxGeometry(7.8, 4.4, 0.2);
    const backWallMesh = new THREE.Mesh(backWallGeom, charcoalWallMaterial);
    backWallMesh.position.set(0, 2.2, -3.9);
    backWallMesh.receiveShadow = true;
    roomGroup.add(backWallMesh);

    const corniceBackGeom = new THREE.BoxGeometry(7.8, 0.08, 0.24);
    const corniceBack = new THREE.Mesh(corniceBackGeom, steelTrimMaterial);
    corniceBack.position.set(0, 4.44, -3.9);
    roomGroup.add(corniceBack);

    const corniceLeftGeom = new THREE.BoxGeometry(0.24, 0.08, 7.8);
    const corniceLeft = new THREE.Mesh(corniceLeftGeom, steelTrimMaterial);
    corniceLeft.position.set(-3.9, 4.44, 0);
    roomGroup.add(corniceLeft);

    disposables.push(
      floorGeom,
      underGeom,
      underMat,
      trimGeom,
      leftWallGeom,
      backWallGeom,
      corniceBackGeom,
      corniceLeftGeom
    );

    // 3. Workstation Assembly
    const workstation = new THREE.Group();
    workstation.position.set(-0.25, 0, -1.05);
    roomGroup.add(workstation);

    const DESK_TOP_Y = 1.05;
    const DESK_THICKNESS = 0.065;
    const DESK_SURFACE_Y = DESK_TOP_Y + DESK_THICKNESS / 2;

    const deskTopGeom = new THREE.BoxGeometry(2.7, DESK_THICKNESS, 1.25);
    const deskTop = new THREE.Mesh(deskTopGeom, walnutWoodMat);
    deskTop.position.set(0, DESK_TOP_Y, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    workstation.add(deskTop);

    const deskEdgeGeom = new THREE.BoxGeometry(2.72, 0.02, 1.27);
    const deskEdge = new THREE.Mesh(deskEdgeGeom, steelTrimMaterial);
    deskEdge.position.set(0, DESK_TOP_Y - 0.018, 0);
    workstation.add(deskEdge);

    [-1.15, 1.15].forEach((lx) => {
      const legH = DESK_TOP_Y - DESK_THICKNESS / 2;
      const legPostGeom = new THREE.BoxGeometry(0.06, legH, 0.06);
      const postL = new THREE.Mesh(legPostGeom, matteBlackMetalMat);
      postL.position.set(lx, legH / 2, -0.48);
      postL.castShadow = true;

      const postR = new THREE.Mesh(legPostGeom, matteBlackMetalMat);
      postR.position.set(lx, legH / 2, 0.48);
      postR.castShadow = true;

      const legBaseGeom = new THREE.BoxGeometry(0.08, 0.04, 1.12);
      const foot = new THREE.Mesh(legBaseGeom, matteBlackMetalMat);
      foot.position.set(lx, 0.028, 0);
      foot.castShadow = true;

      workstation.add(postL, postR, foot);
      disposables.push(legPostGeom, legBaseGeom);
    });

    const matGeom = new THREE.BoxGeometry(1.7, 0.008, 0.68);
    const deskMat = new THREE.Mesh(matGeom, deskMatFabric);
    deskMat.position.set(0, DESK_SURFACE_Y + 0.004, 0.06);
    deskMat.receiveShadow = true;
    workstation.add(deskMat);
    disposables.push(deskTopGeom, deskEdgeGeom, matGeom);

    // Monitor Arm
    const armGroup = new THREE.Group();
    armGroup.position.set(0, DESK_SURFACE_Y, -0.58);

    const clampBaseGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 20);
    const clampBase = new THREE.Mesh(clampBaseGeom, steelTrimMaterial);
    clampBase.position.y = 0.025;
    clampBase.castShadow = true;

    const armPostGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.32, 16);
    const armPost = new THREE.Mesh(armPostGeom, steelTrimMaterial);
    armPost.position.set(0, 0.18, 0);
    armPost.castShadow = true;

    const armJointGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.065, 16);
    const armJoint1 = new THREE.Mesh(armJointGeom, steelTrimMaterial);
    armJoint1.rotation.z = Math.PI / 2;
    armJoint1.position.set(0, 0.34, 0);

    const armUpperGeom = new THREE.BoxGeometry(0.038, 0.038, 0.22);
    const armUpper = new THREE.Mesh(armUpperGeom, steelTrimMaterial);
    armUpper.position.set(0, 0.36, 0.09);
    armUpper.rotation.x = -Math.PI / 10;
    armUpper.castShadow = true;

    const vesaPlateGeom = new THREE.BoxGeometry(0.14, 0.14, 0.02);
    const vesaPlate = new THREE.Mesh(vesaPlateGeom, matteBlackMetalMat);
    vesaPlate.position.set(0, 0.4575, 0.145);
    vesaPlate.castShadow = true;

    armGroup.add(clampBase, armPost, armJoint1, armUpper, vesaPlate);
    workstation.add(armGroup);
    disposables.push(clampBaseGeom, armPostGeom, armJointGeom, armUpperGeom, vesaPlateGeom);

    // Curved Ultrawide Monitor
    const screenRadius = 2.4;
    const screenArc = 0.72;
    const screenH = 0.66;
    const screenGeo = createCurvedMonitorGeometry(screenRadius, screenArc, screenH, 48, 1, false);

    const monitorScreenMat = new THREE.MeshStandardMaterial({
      map: monitorTexture,
      emissiveMap: monitorTexture,
      emissive: 0xffffff,
      emissiveIntensity: 0.95,
      roughness: 0.22,
      metalness: 0.06,
      side: THREE.FrontSide,
    });

    const monitorScreen = new THREE.Mesh(screenGeo, monitorScreenMat);
    monitorScreen.position.set(0, 1.54, -0.38);
    monitorScreen.userData = { isMonitor: true };
    workstation.add(monitorScreen);

    // If profile has an uploaded R2 portrait, upgrade the monitor texture dynamically
    if (profile.portraitUrl) {
      let cancelled = false;
      const portraitImg = new Image();
      portraitImg.crossOrigin = 'anonymous';
      portraitImg.onload = () => {
        if (cancelled) return;
        const upgraded = createMonitorHeroTexture(profile, portraitImg);
        const prev = monitorTexture;
        monitorTexture = upgraded;
        monitorScreenMat.map = upgraded;
        monitorScreenMat.emissiveMap = upgraded;
        monitorScreenMat.needsUpdate = true;
        disposables.push(upgraded);
        prev.dispose();
      };
      portraitImg.src = profile.portraitUrl;
      cancelLoaders.push(() => {
        cancelled = true;
        portraitImg.onload = null;
      });
    }

    const monitorBezelGroup = new THREE.Group();
    monitorBezelGroup.position.set(0, 1.54, -0.38);

    const backHousingGeo = createCurvedMonitorGeometry(
      screenRadius + 0.016,
      screenArc + 0.03,
      screenH + 0.032,
      48,
      1,
      true
    );
    const backHousing = new THREE.Mesh(backHousingGeo, matteBlackMetalMat);
    backHousing.position.z = -0.018;
    monitorBezelGroup.add(backHousing);

    const vesaRearBoxGeom = new THREE.BoxGeometry(0.18, 0.18, 0.035);
    const vesaRearBox = new THREE.Mesh(vesaRearBoxGeom, steelTrimMaterial);
    vesaRearBox.position.set(0, 0, -0.035);
    vesaRearBox.castShadow = true;
    monitorBezelGroup.add(vesaRearBox);

    workstation.add(monitorBezelGroup);
    disposables.push(screenGeo, monitorScreenMat, backHousingGeo, vesaRearBoxGeom);

    // Studio Reference Speakers
    const speakerGeom = new THREE.BoxGeometry(0.24, 0.4, 0.26);
    const coneGeom = new THREE.CylinderGeometry(0.065, 0.03, 0.025, 24);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xdedfe2,
      roughness: 0.25,
      metalness: 0.15,
    });
    const tweeterGeom = new THREE.SphereGeometry(0.018, 16, 16);
    const tweeterMat = new THREE.MeshStandardMaterial({
      color: 0x33363f,
      roughness: 0.15,
      metalness: 0.9,
    });
    disposables.push(speakerGeom, coneGeom, coneMat, tweeterGeom, tweeterMat);

    [-1.15, 1.15].forEach((sx) => {
      const spk = new THREE.Group();
      spk.position.set(sx, DESK_SURFACE_Y, -0.25);
      spk.rotation.y = sx < 0 ? Math.PI / 8 : -Math.PI / 8;

      const body = new THREE.Mesh(speakerGeom, matteBlackMetalMat);
      body.position.y = 0.2;
      body.castShadow = true;
      spk.add(body);

      const woofer = new THREE.Mesh(coneGeom, coneMat);
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(0, 0.17, 0.125);
      spk.add(woofer);

      const tweeter = new THREE.Mesh(tweeterGeom, tweeterMat);
      tweeter.position.set(0, 0.31, 0.132);
      spk.add(tweeter);

      workstation.add(spk);
    });

    // Pen Display Tablet
    const tabletGroup = new THREE.Group();
    tabletGroup.position.set(0.0, DESK_SURFACE_Y + 0.014, 0.1);
    tabletGroup.rotation.x = -THREE.MathUtils.degToRad(15);

    const tabletBodyGeom = new THREE.BoxGeometry(0.48, 0.02, 0.34);
    const tabletBody = new THREE.Mesh(tabletBodyGeom, matteBlackMetalMat);
    tabletBody.castShadow = true;

    const tabletScreenGeom = new THREE.PlaneGeometry(0.42, 0.28);
    const tabletScreenMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.12,
      metalness: 0.25,
    });
    const tabletScreen = new THREE.Mesh(tabletScreenGeom, tabletScreenMat);
    tabletScreen.rotation.x = -Math.PI / 2;
    tabletScreen.position.y = 0.011;

    const stylusGeom = new THREE.CylinderGeometry(0.0055, 0.004, 0.16, 16);
    const stylus = new THREE.Mesh(stylusGeom, steelTrimMaterial);
    stylus.rotation.z = Math.PI / 2.2;
    stylus.position.set(0.28, 0.012, 0.02);

    tabletGroup.add(tabletBody, tabletScreen, stylus);
    workstation.add(tabletGroup);
    disposables.push(tabletBodyGeom, tabletScreenGeom, tabletScreenMat, stylusGeom);

    // Keyboard & Mouse
    const kbGeom = new THREE.BoxGeometry(0.4, 0.016, 0.14);
    const kb = new THREE.Mesh(kbGeom, steelTrimMaterial);
    kb.position.set(-0.62, DESK_SURFACE_Y + 0.008, 0.1);
    kb.castShadow = true;

    const mouseGeom = new THREE.BoxGeometry(0.07, 0.026, 0.11);
    const mouse = new THREE.Mesh(mouseGeom, matteBlackMetalMat);
    mouse.position.set(0.48, DESK_SURFACE_Y + 0.008, 0.1);
    mouse.castShadow = true;
    workstation.add(kb, mouse);
    disposables.push(kbGeom, mouseGeom);

    // Mug & Sketchbook
    const mugGeom = new THREE.CylinderGeometry(0.04, 0.035, 0.09, 20);
    const mug = new THREE.Mesh(mugGeom, coneMat);
    mug.position.set(0.82, DESK_SURFACE_Y + 0.045, -0.12);
    mug.castShadow = true;

    const bookGeom = new THREE.BoxGeometry(0.22, 0.025, 0.3);
    const sketchbook = new THREE.Mesh(bookGeom, charcoalWallMaterial);
    sketchbook.position.set(-0.85, DESK_SURFACE_Y + 0.012, -0.15);
    sketchbook.rotation.y = Math.PI / 14;
    sketchbook.castShadow = true;
    workstation.add(mug, sketchbook);
    disposables.push(mugGeom, bookGeom);

    // Desk Lamp
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-1.24, DESK_SURFACE_Y, -0.42);

    const lampClampGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20);
    const lampClamp = new THREE.Mesh(lampClampGeom, matteBlackMetalMat);
    lampClamp.position.y = 0.02;

    const lampArmGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.44, 12);
    const lampArm1 = new THREE.Mesh(lampArmGeom, matteBlackMetalMat);
    lampArm1.rotation.set(-0.15, 0.25, -Math.PI / 4.8);
    lampArm1.position.set(0.08, 0.18, 0.04);
    lampArm1.castShadow = true;

    const lampShadeGeom = new THREE.ConeGeometry(0.085, 0.15, 24, 1, true);
    const lampShade = new THREE.Mesh(lampShadeGeom, matteBlackMetalMat);
    lampShade.rotation.set(0.35, -0.2, -Math.PI / 2.8);
    lampShade.position.set(0.38, 0.6, 0.2);
    lampShade.castShadow = true;

    const bulbGeom = new THREE.SphereGeometry(0.028, 16, 16);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.0,
      toneMapped: false,
    });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.set(0.38, 0.58, 0.2);

    const deskLampLight = new THREE.PointLight(0xf59e0b, 1.1, 7.0, 1.4);
    deskLampLight.position.set(0.38, 0.56, 0.2);
    deskLampLight.castShadow = true;
    deskLampLight.shadow.bias = -0.0003;
    deskLampLight.shadow.normalBias = 0.02;

    lampGroup.add(lampClamp, lampArm1, lampShade, bulb, deskLampLight);
    workstation.add(lampGroup);
    disposables.push(lampClampGeom, lampArmGeom, lampShadeGeom, bulbGeom, bulbMat);

    // Ergonomic Chair
    const chair = new THREE.Group();
    chair.position.set(-0.45, 0, 0.45);
    chair.rotation.y = Math.PI / 9;
    roomGroup.add(chair);

    const starHubGeom = new THREE.CylinderGeometry(0.065, 0.075, 0.045, 20);
    const starHub = new THREE.Mesh(starHubGeom, steelTrimMaterial);
    starHub.position.y = 0.065;
    chair.add(starHub);

    for (let c = 0; c < 5; c++) {
      const ang = (c * Math.PI * 2) / 5;
      const legGeom = new THREE.BoxGeometry(0.038, 0.028, 0.28);
      const leg = new THREE.Mesh(legGeom, steelTrimMaterial);
      leg.rotation.y = ang;
      leg.position.set(Math.sin(ang) * 0.14, 0.055 + 0.008, Math.cos(ang) * 0.14);
      chair.add(leg);

      const wheelCasterGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.016, 14);
      const wheelCaster = new THREE.Mesh(wheelCasterGeom, matteBlackMetalMat);
      wheelCaster.rotation.z = Math.PI / 2;
      wheelCaster.position.set(Math.sin(ang) * 0.26, 0.03, Math.cos(ang) * 0.26);
      chair.add(wheelCaster);
      disposables.push(legGeom, wheelCasterGeom);
    }

    const chairPistonGeom = new THREE.CylinderGeometry(0.026, 0.032, 0.36, 16);
    const chairPiston = new THREE.Mesh(chairPistonGeom, steelTrimMaterial);
    chairPiston.position.y = 0.24;
    chair.add(chairPiston);

    const seatGeom = new THREE.BoxGeometry(0.52, 0.075, 0.48);
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x1e2026,
      roughness: 0.85,
      metalness: 0.06,
    });
    const seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.set(0, 0.47, -0.01);
    seat.castShadow = true;
    chair.add(seat);

    const backGeom = new THREE.BoxGeometry(0.46, 0.52, 0.045);
    const backrest = new THREE.Mesh(backGeom, seatMat);
    backrest.position.set(0, 0.84, 0.2);
    backrest.rotation.x = Math.PI / 18;
    backrest.castShadow = true;
    chair.add(backrest);

    disposables.push(starHubGeom, chairPistonGeom, seatGeom, seatMat, backGeom);

    // 4. Six Clickable Wall Picture Frames:
    //    - Left Wall (slots 0, 1, 2): 3 vertical 9:16 portrait frames
    //    - Back Wall (slots 3, 4, 5): 3 horizontal 16:9 landscape frames
    const portraitDims = STUDIO_FRAME_DIMENSIONS['9:16'];
    const landscapeDims = STUDIO_FRAME_DIMENSIONS['16:9'];

    const portraitOuterGeom = new THREE.BoxGeometry(
      portraitDims.outerWidth,
      portraitDims.outerHeight,
      portraitDims.outerDepth
    );
    const portraitArtGeom = new THREE.PlaneGeometry(
      portraitDims.artWidth,
      portraitDims.artHeight
    );
    const portraitLedGeom = new THREE.BoxGeometry(
      portraitDims.ledWidth,
      portraitDims.ledHeight,
      portraitDims.ledDepth
    );

    const landscapeOuterGeom = new THREE.BoxGeometry(
      landscapeDims.outerWidth,
      landscapeDims.outerHeight,
      landscapeDims.outerDepth
    );
    const landscapeArtGeom = new THREE.PlaneGeometry(
      landscapeDims.artWidth,
      landscapeDims.artHeight
    );
    const landscapeLedGeom = new THREE.BoxGeometry(
      landscapeDims.ledWidth,
      landscapeDims.ledHeight,
      landscapeDims.ledDepth
    );

    disposables.push(
      portraitOuterGeom,
      portraitArtGeom,
      portraitLedGeom,
      landscapeOuterGeom,
      landscapeArtGeom,
      landscapeLedGeom
    );

    const frameMeshList: {
      group: THREE.Group;
      ledMat: THREE.MeshStandardMaterial;
      artMesh: THREE.Mesh;
      index: number;
      wall: 'left' | 'back';
      aspectRatio: '9:16' | '16:9';
      targetPos: THREE.Vector3;
      targetLook: THREE.Vector3;
    }[] = [];

    STUDIO_FRAME_PLACEMENTS.forEach((placement, idx) => {
      const frameData: StudioFrameData = wallFrames[idx] ?? {
        id: `slot-${idx}`,
        slotIndex: idx,
        wall: placement.wall,
        aspectRatio: placement.aspectRatio,
        index: `0${idx + 1} / 06`,
        title: `Frame 0${idx + 1}`,
        subtitle: placement.aspectRatio === '9:16' ? '9:16 Portrait' : '16:9 Landscape',
        category: 'Studio',
        description: 'Editable from the Studio Dashboard.',
        accentColor: placement.defaultLedColor,
        primaryMetric: placement.aspectRatio,
        tags: [placement.aspectRatio],
        imageAssetId: null,
        imageUrl: null,
      };

      const isPortrait = placement.aspectRatio === '9:16';
      const outerGeom = isPortrait ? portraitOuterGeom : landscapeOuterGeom;
      const artGeom = isPortrait ? portraitArtGeom : landscapeArtGeom;
      const ledGeom = isPortrait ? portraitLedGeom : landscapeLedGeom;

      const frameGroup = new THREE.Group();
      frameGroup.position.set(...placement.position);
      frameGroup.rotation.y = placement.rotationY;

      const outerBox = new THREE.Mesh(outerGeom, matteBlackMetalMat);
      outerBox.castShadow = true;
      frameGroup.add(outerBox);

      const fallbackTex = createWallFrameTexture({
        ...frameData,
        aspectRatio: placement.aspectRatio,
      });
      fallbackTex.anisotropy = Math.min(8, maxAnisotropy);
      disposables.push(fallbackTex);

      const artMat = new THREE.MeshStandardMaterial({
        map: fallbackTex,
        emissiveMap: fallbackTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.82,
        roughness: 0.25,
        metalness: 0.05,
      });

      // Load real R2 image asynchronously with cover-fit cropping when configured
      if (frameData.imageUrl) {
        const cancel = loadCoverFitFrameTexture(
          frameData.imageUrl,
          placement.aspectRatio,
          maxAnisotropy,
          (loadedTex) => {
            artMat.map = loadedTex;
            artMat.emissiveMap = loadedTex;
            artMat.emissiveIntensity = 0.72;
            artMat.needsUpdate = true;
            disposables.push(loadedTex);
            fallbackTex.dispose();
          }
        );
        cancelLoaders.push(cancel);
      }

      const artMesh = new THREE.Mesh(artGeom, artMat);
      artMesh.position.set(0, 0, 0.022);
      artMesh.userData = { isWallFrame: true, frameIndex: idx };
      frameGroup.add(artMesh);
      disposables.push(artMat);

      const ledColor = new THREE.Color(frameData.accentColor || placement.defaultLedColor);
      const ledMat = new THREE.MeshStandardMaterial({
        color: ledColor,
        emissive: ledColor,
        emissiveIntensity: 1.0,
        roughness: 0.2,
        metalness: 0.5,
        toneMapped: false,
      });
      const ledTrim = new THREE.Mesh(ledGeom, ledMat);
      ledTrim.position.set(0, 0, -0.012);
      frameGroup.add(ledTrim);
      disposables.push(ledMat);

      roomGroup.add(frameGroup);

      frameMeshList.push({
        group: frameGroup,
        ledMat,
        artMesh,
        index: idx,
        wall: placement.wall,
        aspectRatio: placement.aspectRatio,
        targetPos: new THREE.Vector3(...placement.inspectCam),
        targetLook: new THREE.Vector3(...placement.inspectLook),
      });
    });

    // 5. Curated Floating Bookshelf (Above back-wall 16:9 frames at y = 3.65, z = -3.65)
    const shelfGeom = new THREE.BoxGeometry(2.6, 0.045, 0.28);
    const backShelf = new THREE.Mesh(shelfGeom, walnutWoodMat);
    backShelf.position.set(0.0, 3.65, -3.65);
    backShelf.castShadow = true;
    roomGroup.add(backShelf);

    const bookColors = [0x22242a, 0x475569, 0xd6cfc4, 0x9a3412, 0x2d3139, 0x78716c, 0x1e2025];
    for (let b = 0; b < 7; b++) {
      const bW = 0.042 + (b % 3) * 0.012;
      const bH = 0.24 + (b % 4) * 0.025;
      const bGeom = new THREE.BoxGeometry(bW, bH, 0.2);
      const bMat = new THREE.MeshStandardMaterial({
        color: bookColors[b % bookColors.length],
        roughness: 0.8,
      });
      const book = new THREE.Mesh(bGeom, bMat);
      book.castShadow = true;

      if (b === 6) {
        book.position.set(-0.95 + b * 0.055 + 0.02, 3.65 + 0.022 + bH / 2 - 0.015, -3.64);
        book.rotation.z = -0.22;
      } else {
        book.position.set(-0.95 + b * 0.055, 3.65 + 0.022 + bH / 2, -3.64);
      }
      roomGroup.add(book);
      disposables.push(bGeom, bMat);
    }

    [0.18, 0.42].forEach((lx, i) => {
      const lensGeom = new THREE.CylinderGeometry(0.068, 0.064, 0.17 + i * 0.04, 24);
      const lens = new THREE.Mesh(lensGeom, matteBlackMetalMat);
      lens.position.set(lx, 3.65 + 0.022 + (0.17 + i * 0.04) / 2, -3.64);
      roomGroup.add(lens);
      disposables.push(lensGeom);
    });

    // Monstera Plant
    const plantGroup = new THREE.Group();
    plantGroup.position.set(-3.15, 0, -3.15);

    const potGeom = new THREE.CylinderGeometry(0.26, 0.2, 0.46, 24);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xb5654b, roughness: 0.82 });
    const pot = new THREE.Mesh(potGeom, potMat);
    pot.position.y = 0.23 + 0.008;
    pot.castShadow = true;
    plantGroup.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.42,
      side: THREE.DoubleSide,
    });
    for (let l = 0; l < 8; l++) {
      const ang = (l * Math.PI * 2) / 8 + 0.15;
      const leafGeo = new THREE.PlaneGeometry(0.28, 0.44);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.sin(ang) * 0.22, 0.48 + l * 0.05, Math.cos(ang) * 0.22);
      leaf.rotation.set(-0.35, ang, 0.28);
      leaf.castShadow = true;
      plantGroup.add(leaf);
      disposables.push(leafGeo);
    }
    roomGroup.add(plantGroup);
    disposables.push(shelfGeom, potGeom, potMat, leafMat);

    // 6. Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0x64748b, 0x29221c, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ea, 1.45);
    keyLight.position.set(9, 14, 11);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.left = -7.5;
    keyLight.shadow.camera.right = 7.5;
    keyLight.shadow.camera.top = 7.5;
    keyLight.shadow.camera.bottom = -7.5;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    scene.add(keyLight);

    const cyanWallWash = new THREE.PointLight(0x06b6d4, 1.1, 18.0, 1.2);
    cyanWallWash.position.set(-2.6, 3.2, 0.1);
    scene.add(cyanWallWash);

    const amberWallWash = new THREE.PointLight(0xf59e0b, 1.0, 18.0, 1.2);
    amberWallWash.position.set(0.1, 3.3, -2.6);
    scene.add(amberWallWash);

    // 7. Camera Controller & Raycasting
    const CAM_OVERVIEW = new THREE.Vector3(5.8, 5.0, 5.8);
    const LOOK_OVERVIEW = new THREE.Vector3(-0.35, 1.35, -0.55);
    const LOOK_MONITOR = new THREE.Vector3(-0.25, 1.54, -1.43);

    const currentCamPos = CAM_OVERVIEW.clone();
    const currentLookTarget = LOOK_OVERVIEW.clone();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getPointerNDC = (e: MouseEvent | Touch) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const ndc = getPointerNDC(e);
      pointer.x = ndc.x;
      pointer.y = ndc.y;
      stateRef.current.pointerX = ndc.x;
      stateRef.current.pointerY = ndc.y;

      if (stateRef.current.isDragging && stateRef.current.cameraMode === 'FRAME_INSPECT') {
        const dx = (e.clientX - stateRef.current.dragStartX) * 0.0035;
        const dy = (e.clientY - stateRef.current.dragStartY) * 0.0035;
        const activeIdx = stateRef.current.activeFrameIndex;
        const maxPanY = activeIdx !== null && activeIdx < 3 ? 0.65 : 0.42;
        stateRef.current.panOffsetX = Math.max(-0.65, Math.min(0.65, stateRef.current.panOffsetX - dx));
        stateRef.current.panOffsetY = Math.max(-maxPanY, Math.min(maxPanY, stateRef.current.panOffsetY + dy));
        stateRef.current.dragStartX = e.clientX;
        stateRef.current.dragStartY = e.clientY;
      }

      if (stateRef.current.cameraMode === 'OVERVIEW' && stateRef.current.monitorProgress < 0.25) {
        raycaster.setFromCamera(pointer, camera);
        const pickables = [monitorScreen, ...frameMeshList.map((f) => f.artMesh)];
        const intersects = raycaster.intersectObjects(pickables, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          renderer.domElement.style.cursor = 'pointer';
          if (hit.userData.isWallFrame) {
            stateRef.current.hoveredFrameIndex = hit.userData.frameIndex;
          } else {
            stateRef.current.hoveredFrameIndex = null;
          }
        } else {
          renderer.domElement.style.cursor = 'default';
          stateRef.current.hoveredFrameIndex = null;
        }
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      stateRef.current.isDragging = true;
      stateRef.current.dragStartX = e.clientX;
      stateRef.current.dragStartY = e.clientY;

      if (stateRef.current.monitorProgress >= 0.85) return;

      const ndc = getPointerNDC(e);
      pointer.x = ndc.x;
      pointer.y = ndc.y;
      raycaster.setFromCamera(pointer, camera);

      const pickables = [monitorScreen, ...frameMeshList.map((f) => f.artMesh)];
      const intersects = raycaster.intersectObjects(pickables, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData.isMonitor) {
          setMonitorProgress(1.0);
          setCameraMode('MONITOR_PORTFOLIO');
          onEnterMonitor();
        } else if (hit.userData.isWallFrame) {
          setActiveFrameIndex(hit.userData.frameIndex);
          setCameraMode('FRAME_INSPECT');
          stateRef.current.panOffsetX = 0;
          stateRef.current.panOffsetY = 0;
          stateRef.current.zoomFactor = 1.0;
        }
      } else if (stateRef.current.cameraMode === 'FRAME_INSPECT') {
        setCameraMode('OVERVIEW');
        setActiveFrameIndex(null);
      }
    };

    const handlePointerUp = () => {
      stateRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (stateRef.current.cameraMode === 'FRAME_INSPECT') {
        e.preventDefault();
        const zoomDelta = e.deltaY * -0.0015;
        stateRef.current.zoomFactor = Math.max(0.7, Math.min(1.85, stateRef.current.zoomFactor + zoomDelta));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (stateRef.current.cameraMode === 'FRAME_INSPECT') {
          setCameraMode('OVERVIEW');
          setActiveFrameIndex(null);
        } else if (stateRef.current.cameraMode === 'MONITOR_PORTFOLIO') {
          const hasActiveModal =
            document.querySelector('[role="dialog"]') !== null ||
            document.querySelector('dialog[open]') !== null;
          if (!hasActiveModal) {
            setMonitorProgress(0.0);
            setCameraMode('OVERVIEW');
          }
        }
      } else if (stateRef.current.cameraMode === 'FRAME_INSPECT') {
        if (e.key === 'ArrowRight') handleNextFrame();
        else if (e.key === 'ArrowLeft') handlePrevFrame();
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', handlePointerMove);
    domEl.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    domEl.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    const updateCameraFov = (currentP: number) => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const aspect = w / h;

      const baseOverviewFov =
        aspect < 1.1 ? THREE.MathUtils.clamp(48 + (1.1 - aspect) * 26, 48, 68) : 48;
      const dynamicFov = THREE.MathUtils.lerp(
        baseOverviewFov,
        48,
        THREE.MathUtils.smoothstep(currentP, 0.0, 0.65)
      );

      if (Math.abs(camera.fov - dynamicFov) > 0.05 || camera.aspect !== aspect) {
        camera.fov = dynamicFov;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      updateCameraFov(stateRef.current.monitorProgress);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    let lastTime = performance.now();
    let currentMonitorExp = 0.0;

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const targetP = stateRef.current.monitorProgress;
      const smoothFactor = prefersReducedMotion ? 1.0 : 1.0 - Math.exp(-4.0 * dt);
      currentMonitorExp += (targetP - currentMonitorExp) * smoothFactor;
      if (Math.abs(targetP - currentMonitorExp) < 0.004) {
        currentMonitorExp = targetP;
      }

      updateCameraFov(currentMonitorExp);

      // LED Highlights (reads live ref, never stale)
      frameMeshList.forEach((fm) => {
        const isSelected = stateRef.current.activeFrameIndex === fm.index;
        const isHovered = stateRef.current.hoveredFrameIndex === fm.index;
        const targetIntensity = isSelected ? 3.0 : isHovered ? 2.1 : 0.85;
        fm.ledMat.emissiveIntensity += (targetIntensity - fm.ledMat.emissiveIntensity) * 0.15;
      });

      // Camera State Machine
      if (
        stateRef.current.cameraMode === 'FRAME_INSPECT' &&
        stateRef.current.activeFrameIndex !== null
      ) {
        const activeCfg = frameMeshList[stateRef.current.activeFrameIndex];
        if (activeCfg) {
          const targetCam = activeCfg.targetPos.clone();
          const targetLook = activeCfg.targetLook.clone();

          const panX = stateRef.current.panOffsetX;
          const panY = stateRef.current.panOffsetY;
          const zoom = stateRef.current.zoomFactor;

          if (activeCfg.wall === 'left') {
            targetCam.z += panX;
            targetCam.y += panY;
            targetLook.z += panX;
            targetLook.y += panY;
            targetCam.x = THREE.MathUtils.lerp(-3.76, targetCam.x, 1 / zoom);
          } else {
            targetCam.x += panX;
            targetCam.y += panY;
            targetLook.x += panX;
            targetLook.y += panY;
            targetCam.z = THREE.MathUtils.lerp(-3.76, targetCam.z, 1 / zoom);
          }

          targetCam.x = Math.max(-3.1, Math.min(3.2, targetCam.x));
          targetCam.z = Math.max(-3.1, Math.min(3.2, targetCam.z));

          currentCamPos.lerp(targetCam, 0.08);
          currentLookTarget.lerp(targetLook, 0.08);
        }
      } else {
        const p = THREE.MathUtils.clamp(currentMonitorExp, 0.0, 1.0);

        if (p <= 0.55) {
          const s1 = p / 0.55;
          const t1 = THREE.MathUtils.smoothstep(s1, 0.0, 1.0);

          const angle0 = 0.77;
          const radius0 = 8.8398;
          const height0 = 5.0;

          const angle1 = 0.0;
          const radius1 = 1.78;
          const height1 = 1.54;

          const angle = THREE.MathUtils.lerp(angle0, angle1, t1);
          const radius = THREE.MathUtils.lerp(radius0, radius1, t1);
          const camY = THREE.MathUtils.lerp(height0, height1, t1);

          currentLookTarget.lerpVectors(LOOK_OVERVIEW, LOOK_MONITOR, t1);

          const parallaxWeight = Math.max(0, 1 - p / 0.4) * (prefersReducedMotion ? 0 : 0.35);
          const px = stateRef.current.pointerX * parallaxWeight;
          const py = stateRef.current.pointerY * parallaxWeight;

          currentCamPos.set(
            currentLookTarget.x + Math.sin(angle) * radius + px,
            camY + py,
            currentLookTarget.z + Math.cos(angle) * radius
          );
        } else {
          const s2 = (p - 0.55) / 0.45;
          const t2 = THREE.MathUtils.smoothstep(s2, 0.0, 1.0);

          const startZ = LOOK_MONITOR.z + 1.78;
          const targetZ = -0.98;
          const curZ = THREE.MathUtils.lerp(startZ, targetZ, t2);

          currentCamPos.set(LOOK_MONITOR.x, LOOK_MONITOR.y, curZ);
          currentLookTarget.copy(LOOK_MONITOR);
        }
      }

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookTarget);
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    return () => {
      cancelLoaders.forEach((cancel) => cancel());
      renderer.setAnimationLoop(null);
      domEl.removeEventListener('pointermove', handlePointerMove);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      domEl.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);

      disposables.forEach((item) => {
        try {
          item.dispose();
        } catch {
          // Ignore already disposed
        }
      });

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, [
    profile,
    wallFrames,
    setMonitorProgress,
    setCameraMode,
    setActiveFrameIndex,
    onEnterMonitor,
    handleNextFrame,
    handlePrevFrame,
  ]);

  const activeFrameData =
    activeFrameIndex !== null ? wallFrames[activeFrameIndex] ?? null : null;

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Frame Inspection Overlay UI */}
      {cameraMode === 'FRAME_INSPECT' && activeFrameData && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6 sm:p-10">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 bg-black/65 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-white/80">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: activeFrameData.accentColor }}
              />
              <span>
                {activeFrameData.aspectRatio === '9:16'
                  ? '9:16 PORTRAIT · LEFT WALL'
                  : '16:9 LANDSCAPE · BACK WALL'}
              </span>
              <span className="text-white/40 hidden sm:inline">·</span>
              <span className="text-white/60 hidden sm:inline">Drag to Pan · Wheel to Zoom</span>
            </div>

            <button
              onClick={() => {
                setCameraMode('OVERVIEW');
                setActiveFrameIndex(null);
              }}
              className="bg-black/70 hover:bg-black/90 active:scale-95 transition-all text-white/90 hover:text-white px-4 py-2 rounded-full border border-white/15 text-xs font-mono flex items-center gap-2 cursor-pointer"
            >
              <span>[ESC] CLOSE</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-end justify-between gap-4 pointer-events-auto">
            <div className="max-w-md bg-black/75 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-white/15 shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-xs font-mono font-bold tracking-wider"
                  style={{ color: activeFrameData.accentColor }}
                >
                  {activeFrameData.index}
                </span>
                <span className="text-xs font-mono text-white/40">·</span>
                <span className="text-xs font-mono text-white/70 uppercase">
                  {activeFrameData.category}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 tracking-tight">
                {activeFrameData.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-4">
                {activeFrameData.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeFrameData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10">
              <button
                onClick={handlePrevFrame}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors cursor-pointer"
                aria-label="Previous Frame"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs font-mono px-3 text-white/70">
                {activeFrameData.index.split(' / ')[0]} / 06
              </span>
              <button
                onClick={handleNextFrame}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors cursor-pointer"
                aria-label="Next Frame"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Studio Overview Bottom Hints */}
      {cameraMode === 'OVERVIEW' && monitorProgress < 0.25 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center gap-2 text-center">
          <div className="bg-black/65 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-lg text-xs font-mono text-white/80 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#d7ff3f] pulse-dot" />
            <span>Click Curved Monitor or Scroll Down to Enter Portfolio</span>
            <span className="text-white/30">|</span>
            <span className="text-white/50">Click Wall Frames to Inspect</span>
          </div>
          <div className="text-[11px] font-mono text-white/40 tracking-wider">
            SCROLL RUNWAY 0% → 100%
          </div>
        </div>
      )}
    </div>
  );
}
