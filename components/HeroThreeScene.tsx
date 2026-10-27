"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const _tempVec = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _instanceColor = new THREE.Color();

export function HeroThreeScene({
  activeTrack = "exam",
  pulseTrigger = 0,
}: {
  activeTrack?: "exam" | "code" | "lang";
  pulseTrigger?: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const impulseRef = useRef<number>(0);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const trackRef = useRef<"exam" | "code" | "lang">(activeTrack);
  const [webglReady, setWebglReady] = useState(true);

  useEffect(() => {
    trackRef.current = activeTrack;
    impulseRef.current = Math.min(impulseRef.current + 0.85, 2.2);
  }, [activeTrack, pulseTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const isHeadless =
      typeof navigator !== "undefined" &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 8.8);

    // 3-Point Warm/Cool Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xfffcf5, 0x9aab65, 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6e0, 2.2);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffb2dd, 1.4);
    rimLight.position.set(-6, -3, -4);
    scene.add(rimLight);

    // PBR Palette Materials matching Classly / Mentra tokens
    const matPink = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#FFB2DD"),
      roughness: 0.22,
      metalness: 0.08,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
    });

    const matYellow = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#F7D66E"),
      roughness: 0.28,
      metalness: 0.15,
      clearcoat: 0.6,
    });

    const matGreen = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#9AAB65"),
      roughness: 0.48,
      metalness: 0.05,
    });

    const matCream = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#FFFCF5"),
      roughness: 0.18,
      metalness: 0.04,
      clearcoat: 0.9,
    });

    const matInk = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#2D2D2B"),
      roughness: 0.35,
      metalness: 0.3,
    });

    // Root Sculpture Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. 6-Petal 3D Blossom Sculpture (Right-Top cluster)
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(2.35, 0.95, -0.4);
    const petalGeo = new THREE.CapsuleGeometry(0.32, 0.72, 16, 24);
    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(petalGeo, matPink);
      const angle = (i * Math.PI) / 3;
      petal.position.set(Math.cos(angle) * 0.52, Math.sin(angle) * 0.52, 0);
      petal.rotation.z = angle - Math.PI / 2;
      flowerGroup.add(petal);
    }
    const coreGeo = new THREE.SphereGeometry(0.42, 28, 28);
    const flowerCore = new THREE.Mesh(coreGeo, matYellow);
    flowerCore.position.z = 0.16;
    flowerGroup.add(flowerCore);
    rootGroup.add(flowerGroup);

    // 2. 10-Point 3D Starburst Sculpture (Left-Top cluster)
    const burstGroup = new THREE.Group();
    burstGroup.position.set(-2.6, 1.05, -0.6);
    const rayGeo = new THREE.ConeGeometry(0.24, 1.15, 16);
    for (let i = 0; i < 8; i++) {
      const ray = new THREE.Mesh(rayGeo, i % 2 === 0 ? matYellow : matCream);
      const angle = (i * Math.PI) / 4;
      ray.position.set(Math.cos(angle) * 0.45, Math.sin(angle) * 0.45, 0);
      ray.rotation.z = angle - Math.PI / 2;
      burstGroup.add(ray);
    }
    const burstHub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 24), matGreen);
    burstHub.rotation.x = Math.PI / 2;
    burstGroup.add(burstHub);
    rootGroup.add(burstGroup);

    // 3. 3D Squiggle Wave & Knowledge Torus (Bottom-Right)
    const waveGroup = new THREE.Group();
    waveGroup.position.set(1.5, -1.15, 0.2);
    const curvePoints = [
      new THREE.Vector3(-1.1, -0.3, 0),
      new THREE.Vector3(-0.55, 0.45, 0.2),
      new THREE.Vector3(0.0, -0.35, -0.15),
      new THREE.Vector3(0.55, 0.45, 0.2),
      new THREE.Vector3(1.1, -0.3, 0),
    ];
    const waveCurve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(waveCurve, 48, 0.2, 16, false);
    const waveMesh = new THREE.Mesh(tubeGeo, matGreen);
    waveGroup.add(waveMesh);

    const ringGeo = new THREE.TorusGeometry(0.52, 0.14, 20, 48);
    const ringMesh = new THREE.Mesh(ringGeo, matCream);
    ringMesh.position.set(0, 0.08, 0.32);
    ringMesh.rotation.y = 0.4;
    waveGroup.add(ringMesh);

    const boltKnob = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), matInk);
    boltKnob.position.set(0, 0.08, 0.32);
    waveGroup.add(boltKnob);
    rootGroup.add(waveGroup);

    // Original, low-polygon study-book vignette balances the existing hero shapes.
    // No externally licensed GLB assets are bundled with the public repository.
    const bookGeometry = new THREE.BoxGeometry(0.96, 0.15, 0.7);
    const bookGroup = new THREE.Group();
    bookGroup.position.set(-2.25, -1.4, -0.15);
    [
      { y: 0, angle: -0.22, material: matGreen },
      { y: 0.18, angle: 0.16, material: matCream },
      { y: 0.36, angle: -0.1, material: matPink },
    ].forEach(({ y, angle, material }) => {
      const book = new THREE.Mesh(bookGeometry, material);
      book.position.y = y;
      book.rotation.y = angle;
      book.castShadow = !isHeadless;
      bookGroup.add(book);
    });
    rootGroup.add(bookGroup);

    // 4. Instanced Orbiting Knowledge Nodes (24 spheres)
    const nodeCount = 24;
    const nodeGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const nodeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 0.8,
    });
    const nodesInstanced = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    const paletteHex = ["#FFB2DD", "#F7D66E", "#9AAB65", "#FFFCF5"];
    const nodeOrbits: {
      radius: number;
      speed: number;
      angle: number;
      yOffset: number;
      scale: number;
    }[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const radius = 2.8 + (i % 4) * 0.55;
      const angle = (i / nodeCount) * Math.PI * 2;
      const yOffset = ((i % 5) - 2) * 0.55;
      const scale = 0.75 + (i % 3) * 0.3;
      nodeOrbits.push({
        radius,
        speed: 0.25 + (i % 4) * 0.08,
        angle,
        yOffset,
        scale,
      });

      _dummyObj.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius - 1.2);
      _dummyObj.scale.setScalar(scale);
      _dummyObj.updateMatrix();
      nodesInstanced.setMatrixAt(i, _dummyObj.matrix);
      _instanceColor.set(paletteHex[i % paletteHex.length]);
      nodesInstanced.setColorAt(i, _instanceColor);
    }
    nodesInstanced.instanceMatrix.needsUpdate = true;
    if (nodesInstanced.instanceColor) nodesInstanced.instanceColor.needsUpdate = true;
    nodesInstanced.computeBoundingSphere();
    rootGroup.add(nodesInstanced);

    renderer.compile(scene, camera);

    const handleCanvasLoss = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener("webglcontextlost", handleCanvasLoss);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let rotBoost = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Smoothly decay click/action impulse
      impulseRef.current = THREE.MathUtils.damp(impulseRef.current, 0, 3.2, dt);
      rotBoost += impulseRef.current * dt * 3.8;

      // Exponentially damp root group toward pointer parallax
      const targetRotY = pointerRef.current.x * 0.38;
      const targetRotX = -pointerRef.current.y * 0.26;
      rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, targetRotY, 4.5, dt);
      rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetRotX, 4.5, dt);

      // Animate 6-petal flower
      const scaleBounce = 1 + impulseRef.current * 0.16;
      flowerGroup.rotation.z = elapsed * 0.35 + rotBoost;
      flowerGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.35;
      flowerGroup.position.y = 0.95 + Math.sin(elapsed * 1.6) * 0.14;
      flowerGroup.scale.setScalar(THREE.MathUtils.damp(flowerGroup.scale.x, scaleBounce, 8, dt));

      // Animate 10-point starburst
      burstGroup.rotation.z = -elapsed * 0.42 - rotBoost * 0.8;
      burstGroup.rotation.x = Math.cos(elapsed * 0.8) * 0.3;
      burstGroup.position.y = 1.05 + Math.cos(elapsed * 1.4) * 0.12;
      burstGroup.scale.setScalar(THREE.MathUtils.damp(burstGroup.scale.x, scaleBounce, 8, dt));

      // Animate squiggle wave
      waveGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.4 + rotBoost * 0.5;
      waveGroup.position.y = -1.15 + Math.sin(elapsed * 1.9 + 1) * 0.1;
      ringMesh.rotation.x = elapsed * 1.1;
      boltKnob.rotation.y = -elapsed * 1.5;

      // Update instanced orbiting knowledge spheres
      for (let i = 0; i < nodeCount; i++) {
        const o = nodeOrbits[i];
        const a = o.angle + elapsed * o.speed + rotBoost * 0.25;
        _tempVec.set(
          Math.cos(a) * o.radius,
          o.yOffset + Math.sin(elapsed * 1.5 + i) * 0.15,
          Math.sin(a) * (o.radius * 0.45) - 1.1,
        );
        _dummyObj.position.copy(_tempVec);
        _dummyObj.scale.setScalar(o.scale * (1 + impulseRef.current * 0.12));
        _dummyObj.updateMatrix();
        nodesInstanced.setMatrixAt(i, _dummyObj.matrix);
      }
      nodesInstanced.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("webglcontextlost", handleCanvasLoss);
      bookGeometry.dispose();
      petalGeo.dispose();
      coreGeo.dispose();
      rayGeo.dispose();
      tubeGeo.dispose();
      ringGeo.dispose();
      nodeGeo.dispose();
      matPink.dispose();
      matYellow.dispose();
      matGreen.dispose();
      matCream.dispose();
      matInk.dispose();
      nodeMat.dispose();
      envTexture.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerRef.current = { x: nx, y: ny };
  };

  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0 };
  };

  const handleClickBounce = () => {
    impulseRef.current = Math.min(impulseRef.current + 1.25, 2.5);
  };

  if (!webglReady) {
    return null;
  }

  return (
    <div
      ref={mountRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClickBounce}
      title="Click or move cursor to interact with 3D study sculptures"
      className="absolute inset-0 z-[1] cursor-grab active:cursor-grabbing"
    />
  );
}
