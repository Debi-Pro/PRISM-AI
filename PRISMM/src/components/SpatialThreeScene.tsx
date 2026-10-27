import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const SpatialThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState('AZIMUTH: 157.0°  CAM: +7.5 / +5.2');
  const [markerPos, setMarkerPos] = useState({
    sofa: { x: 0, y: 0, visible: true },
    table: { x: 0, y: 0, visible: true },
    hearth: { x: 0, y: 0, visible: true },
    shelving: { x: 0, y: 0, visible: true }
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 650;
    let height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b12, 0.038);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(7.5, 5.2, 8.5);
    camera.lookAt(0, 1.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    const roomGroup = new THREE.Group();
    roomGroup.position.set(0, -0.6, 0);
    scene.add(roomGroup);

    // Architectural Ground Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0xea580c, 0x1f2937);
    gridHelper.position.y = 0;
    roomGroup.add(gridHelper);

    // Materials
    const wireOrange = new THREE.LineBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.9 });
    const wireAmber = new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.75 });
    const wireCyan = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 });
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xea580c, wireframe: true, transparent: true, opacity: 0.09 });
    const floorPlateMat = new THREE.MeshBasicMaterial({ color: 0x0a101d, transparent: true, opacity: 0.8 });

    // Floor Plate
    const floorGeom = new THREE.PlaneGeometry(8.4, 7.2);
    const floorMesh = new THREE.Mesh(floorGeom, floorPlateMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.01;
    roomGroup.add(floorMesh);

    function addWireBox(w: number, h: number, d: number, x: number, y: number, z: number, lineMat: THREE.LineBasicMaterial, withFill = true) {
      const geom = new THREE.BoxGeometry(w, h, d);
      const edges = new THREE.EdgesGeometry(geom);
      const wire = new THREE.LineSegments(edges, lineMat || wireOrange);
      wire.position.set(x, y + h / 2, z);
      roomGroup.add(wire);

      if (withFill) {
        const fill = new THREE.Mesh(geom, fillMat);
        fill.position.copy(wire.position);
        roomGroup.add(fill);
      }
      return wire;
    }

    // 1. Room Boundary
    addWireBox(8.0, 3.2, 6.8, 0, 0, 0, wireCyan, false);

    // 2. Main Sectional Sofa
    addWireBox(2.8, 0.45, 1.1, -1.5, 0, 0.3, wireOrange);
    addWireBox(2.8, 0.45, 0.25, -1.5, 0.45, -0.15, wireOrange);
    addWireBox(1.1, 0.45, 1.5, -2.35, 0, 1.4, wireOrange);
    addWireBox(0.25, 0.35, 1.1, -0.05, 0.45, 0.3, wireAmber);

    // 3. Central Coffee Table
    addWireBox(1.6, 0.38, 0.9, 0.2, 0, 0.2, wireAmber);

    // 4. Feature Hearth / Fireplace
    addWireBox(1.8, 2.4, 0.4, 2.7, 0, -1.1, wireOrange);
    addWireBox(1.2, 0.7, 0.3, 2.7, 0.3, -0.9, wireAmber);

    // 5. Shelving / Media Credenza
    addWireBox(0.6, 2.2, 2.4, 2.9, 0, 1.3, wireCyan);
    addWireBox(0.58, 0.05, 2.38, 2.9, 0.7, 1.3, wireCyan, false);
    addWireBox(0.58, 0.05, 2.38, 2.9, 1.4, 1.3, wireCyan, false);

    // 6. Arc / Floor Lamp
    addWireBox(0.4, 0.06, 0.4, -3.2, 0, 1.8, wireAmber);
    const lampStemGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.2, 0, 1.8),
      new THREE.Vector3(-3.2, 2.1, 1.8),
      new THREE.Vector3(-2.6, 2.4, 1.5),
      new THREE.Vector3(-2.3, 2.2, 1.3)
    ]);
    const lampStem = new THREE.Line(lampStemGeom, wireAmber);
    roomGroup.add(lampStem);

    // 7. Dense 3D Point Cloud (LiDAR)
    const ptsCount = 1400;
    const positions = new Float32Array(ptsCount * 3);
    const colors = new Float32Array(ptsCount * 3);

    for (let i = 0; i < ptsCount; i++) {
      let px, py, pz;
      const type = Math.random();
      if (type < 0.35) {
        px = -1.5 + (Math.random() - 0.5) * 2.6;
        py = Math.random() * 0.9;
        pz = 0.5 + (Math.random() - 0.5) * 2.2;
      } else if (type < 0.6) {
        px = 2.7 + (Math.random() - 0.5) * 1.4;
        py = Math.random() * 2.2;
        pz = (Math.random() - 0.5) * 3.4;
      } else {
        px = (Math.random() - 0.5) * 7.6;
        py = Math.random() * 3.0;
        pz = (Math.random() - 0.5) * 6.4;
      }

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      const cMix = Math.random();
      if (cMix < 0.65) {
        colors[i * 3] = 0.92;
        colors[i * 3 + 1] = 0.36 + cMix * 0.3;
        colors[i * 3 + 2] = 0.08;
      } else if (cMix < 0.85) {
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.72;
        colors[i * 3 + 2] = 0.22;
      } else {
        colors[i * 3] = 0.45;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 0.95;
      }
    }

    const ptGeom = new THREE.BufferGeometry();
    ptGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    ptGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const ptMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.82
    });
    const lidarPoints = new THREE.Points(ptGeom, ptMaterial);
    roomGroup.add(lidarPoints);

    // Interactive Drag to Rotate
    let isInteracting = false;
    let lastX = 0;
    let lastY = 0;
    const baseRotationSpeed = 0.0035;

    const onPointerDown = (e: PointerEvent) => {
      isInteracting = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isInteracting) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      roomGroup.rotation.y += dx * 0.008;
      camera.position.y = Math.max(1.8, Math.min(8.5, camera.position.y + dy * 0.015));
      camera.lookAt(0, 1.1, 0);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerUp = () => {
      isInteracting = false;
    };

    const parentBox = container.parentElement;
    if (parentBox) {
      parentBox.addEventListener('pointerdown', onPointerDown);
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Dynamic 3D screen projection for live HTML badges
    const vSofa = new THREE.Vector3(-1.5, 0.45, 0.3);
    const vTable = new THREE.Vector3(0.2, 0.4, 0.2);
    const vHearth = new THREE.Vector3(2.7, 1.1, -1.1);
    const vShelving = new THREE.Vector3(2.9, 1.4, 1.3);
    const projVec = new THREE.Vector3();

    function projectToScreen(vec: THREE.Vector3) {
      projVec.copy(vec);
      projVec.applyEuler(roomGroup.rotation);
      projVec.add(roomGroup.position);
      projVec.project(camera);

      return {
        x: ((projVec.x * 0.5) + 0.5) * width,
        y: ((-projVec.y * 0.5) + 0.5) * height,
        visible: projVec.z <= 1
      };
    }

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 650;
      height = container.clientHeight || 460;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    let frameCounter = 0;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      if (!isInteracting) {
        roomGroup.rotation.y += baseRotationSpeed;
      }

      frameCounter++;
      if (frameCounter % 2 === 0) {
        const deg = Math.floor(((roomGroup.rotation.y * 180 / Math.PI) % 360 + 360) % 360);
        setTelemetry(`AZIMUTH: ${deg}.0°  CAM: +${camera.position.x.toFixed(1)} / +${camera.position.y.toFixed(1)}`);

        setMarkerPos({
          sofa: projectToScreen(vSofa),
          table: projectToScreen(vTable),
          hearth: projectToScreen(vHearth),
          shelving: projectToScreen(vShelving)
        });
      }

      renderer.render(scene, camera);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (parentBox) {
        parentBox.removeEventListener('pointerdown', onPointerDown);
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] min-h-[480px] lg:h-[600px] rounded-2xl overflow-hidden border border-[#ea580c]/40 bg-[#070b12]/95 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-md group flex flex-col justify-between p-5 md:p-8 select-none z-10 cursor-grab active:cursor-grabbing">
      <div className="arch-grid-matrix opacity-20 pointer-events-none"></div>

      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient(circle at 50% 50%, #0d1524 0%, transparent 70%) pointer-events-none opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-transparent to-[#070b12]/60 pointer-events-none"></div>
      </div>

      {/* Screen-Projected 3D HTML Spatial Markers */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {markerPos.sofa.visible && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-75"
            style={{ left: `${markerPos.sofa.x}px`, top: `${markerPos.sofa.y}px` }}
          >
            <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-ping"></span>
            <div className="px-2 py-0.5 rounded bg-black/85 border border-[#ea580c]/50 backdrop-blur-md font-mono text-[9px] text-[#ea580c] tracking-widest shadow-[0_0_15px_#ea580c]">
              SOFA // [X:-01.80 Y:+00.40 Z:+00.20]
            </div>
          </div>
        )}

        {markerPos.table.visible && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-75"
            style={{ left: `${markerPos.table.x}px`, top: `${markerPos.table.y}px` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse"></span>
            <div className="px-2 py-0.5 rounded bg-black/85 border border-white/20 backdrop-blur-md font-mono text-[8px] text-slate-200 tracking-wider">
              TABLE // [X:+00.00 Y:+00.25 Z:+00.00]
            </div>
          </div>
        )}

        {markerPos.hearth.visible && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-75"
            style={{ left: `${markerPos.hearth.x}px`, top: `${markerPos.hearth.y}px` }}
          >
            <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-ping"></span>
            <div className="px-2 py-0.5 rounded bg-black/85 border border-[#ea580c]/60 backdrop-blur-md font-mono text-[9px] text-[#ea580c] tracking-widest shadow-[0_0_15px_#ea580c]">
              HEARTH // [X:+02.80 Y:+00.90 Z:-01.20]
            </div>
          </div>
        )}

        {markerPos.shelving.visible && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-all duration-75"
            style={{ left: `${markerPos.shelving.x}px`, top: `${markerPos.shelving.y}px` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
            <div className="px-2 py-0.5 rounded bg-black/85 border border-white/20 backdrop-blur-md font-mono text-[8px] text-slate-300 tracking-wider">
              SHELVING // [X:+03.10 Y:+01.75 Z:+01.80]
            </div>
          </div>
        )}
      </div>

      {/* Top HUD Controls Overlay */}
      <div className="relative z-20 flex items-center justify-between font-mono text-[9px] md:text-[10px] tracking-[0.24em] uppercase text-slate-400 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-ping"></span>
          <span className="text-[#ea580c] font-bold">ROTATION // 6DoF CONTINUOUS FIELD</span>
        </div>
        <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
          <span className="text-slate-300">VOXEL GRID // DENSE MESH</span>
        </div>
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="relative z-20 flex items-center justify-between font-mono text-[9px] md:text-[10px] tracking-widest text-slate-400 border-t border-white/10 pt-3 pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">DATUM:</span>
          <span className="text-slate-200 font-semibold">{telemetry}</span>
        </div>
        <div className="flex items-center gap-2 text-[#ea580c]">
          <span className="material-symbols-outlined text-xs">3d_rotation</span>
          <span className="tracking-wider">DRAG TO ORBIT</span>
        </div>
      </div>
    </div>
  );
};
