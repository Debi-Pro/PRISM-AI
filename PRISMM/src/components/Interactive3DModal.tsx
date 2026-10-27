import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProjectJob } from '../types';

interface Interactive3DModalProps {
  project: ProjectJob;
  onClose: () => void;
}

export const Interactive3DModal: React.FC<Interactive3DModalProps> = ({ project, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewPreset, setViewPreset] = useState<'perspective' | 'top' | 'hearth' | 'sofa'>('perspective');
  const [renderMode, setRenderMode] = useState<'splat' | 'wireframe' | 'dense'>('splat');
  const [telemetry, setTelemetry] = useState({ azimuth: '142°', elevation: '+4.5m', fov: '46°', splats: '4,284,102' });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060910, 0.035);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(7.5, 4.8, 8.5);
    camera.lookAt(0, 1.0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x060910, 1);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Floor Grid
    const grid = new THREE.GridHelper(12, 24, 0xea580c, 0x1e2738);
    group.add(grid);

    // Floor Plane
    const floorGeo = new THREE.PlaneGeometry(10, 8);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x090e17, transparent: true, opacity: 0.85 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    group.add(floor);

    // Wireframes
    const orangeMat = new THREE.LineBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.85 });
    const cyanMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xea580c, wireframe: true, transparent: true, opacity: 0.08 });

    function addBox(w: number, h: number, d: number, x: number, y: number, z: number, lineMat: THREE.LineBasicMaterial) {
      const geom = new THREE.BoxGeometry(w, h, d);
      const edges = new THREE.EdgesGeometry(geom);
      const wire = new THREE.LineSegments(edges, lineMat);
      wire.position.set(x, y + h / 2, z);
      group.add(wire);

      const fill = new THREE.Mesh(geom, fillMat);
      fill.position.copy(wire.position);
      group.add(fill);
      return wire;
    }

    addBox(8.4, 3.4, 7.2, 0, 0, 0, cyanMat);
    addBox(2.8, 0.45, 1.1, -1.5, 0, 0.3, orangeMat);
    addBox(2.8, 0.45, 0.25, -1.5, 0.45, -0.15, orangeMat);
    addBox(1.6, 0.38, 0.9, 0.2, 0, 0.2, orangeMat);
    addBox(1.8, 2.4, 0.4, 2.7, 0, -1.1, orangeMat);
    addBox(0.6, 2.2, 2.4, 2.9, 0, 1.3, cyanMat);

    // Dense Point Cloud (Splats)
    const ptsCount = 2800;
    const positions = new Float32Array(ptsCount * 3);
    const colors = new Float32Array(ptsCount * 3);

    for (let i = 0; i < ptsCount; i++) {
      const px = (Math.random() - 0.5) * 8.0;
      const py = Math.random() * 3.2;
      const pz = (Math.random() - 0.5) * 6.8;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      const c = Math.random();
      if (c < 0.6) {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.42 + c * 0.3;
        colors[i * 3 + 2] = 0.12;
      } else if (c < 0.85) {
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 0.28;
      } else {
        colors[i * 3] = 0.4;
        colors[i * 3 + 1] = 0.7;
        colors[i * 3 + 2] = 0.95;
      }
    }

    const ptGeom = new THREE.BufferGeometry();
    ptGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    ptGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const ptMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const splatPoints = new THREE.Points(ptGeom, ptMaterial);
    group.add(splatPoints);

    // Drag Orbit
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      group.rotation.y += dx * 0.007;
      camera.position.y = Math.max(1.2, Math.min(10, camera.position.y + dy * 0.015));
      camera.lookAt(0, 1.0, 0);
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3, Math.min(18, camera.position.z + e.deltaY * 0.01));
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    let animId: number;
    let frame = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        group.rotation.y += 0.002;
      }
      frame++;
      if (frame % 3 === 0) {
        const deg = Math.floor(((group.rotation.y * 180 / Math.PI) % 360 + 360) % 360);
        setTelemetry({
          azimuth: `${deg}°`,
          elevation: `+${camera.position.y.toFixed(1)}m`,
          fov: `${camera.fov}°`,
          splats: '4,284,102'
        });
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
      <div className="relative w-full max-w-6xl h-[85vh] rounded-2xl overflow-hidden border border-[#ea580c]/50 bg-[#060910] shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080d17]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] animate-ping"></span>
            <div>
              <h2 className="text-white font-semibold text-sm sm:text-base tracking-wide flex items-center gap-2">
                <span>{project.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#ea580c]/20 text-[#ea580c] font-mono border border-[#ea580c]/40">
                  LIVE SPATIAL TWIN
                </span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                FORMAT: {project.modelFormat || 'Gaussian Splat (.spz)'} • 60 FPS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View presets */}
            <div className="hidden sm:flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setRenderMode('splat')}
                className={`px-2.5 py-1 rounded transition-colors ${renderMode === 'splat' ? 'bg-[#ea580c] text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Radiance Splats
              </button>
              <button
                onClick={() => setRenderMode('wireframe')}
                className={`px-2.5 py-1 rounded transition-colors ${renderMode === 'wireframe' ? 'bg-[#ea580c] text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Wireframe
              </button>
              <button
                onClick={() => setRenderMode('dense')}
                className={`px-2.5 py-1 rounded transition-colors ${renderMode === 'dense' ? 'bg-[#ea580c] text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Dense Mesh
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Close 3D View"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 3D Canvas Container */}
        <div ref={containerRef} className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
          {/* Subtle Grid Matrix */}
          <div className="arch-grid-matrix opacity-20 pointer-events-none"></div>

          {/* Telemetry HUD Bottom Overlay */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none text-xs font-mono">
            <div className="bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5 text-[#ea580c]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                AZIMUTH: {telemetry.azimuth}
              </span>
              <span>CAM Y: {telemetry.elevation}</span>
              <span>FOV: {telemetry.fov}</span>
              <span>SPLATS: {telemetry.splats}</span>
            </div>

            <div className="bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-[#ea580c]">3d_rotation</span>
              <span>Click & Drag to Orbit • Scroll to Zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
