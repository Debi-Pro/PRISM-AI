import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { SpatialThreeScene } from './SpatialThreeScene';

interface SpatialTourProps {
  onEnterWorkspace: () => void;
}

interface CamVantage {
  src: string;
  alt: string;
  badge: string;
}

const CAM_VANTAGES: CamVantage[] = [
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgV6DJSaSAO2CtLp_uf_3kQZb75XmlYLFITDCF1q1On7w1SoQ-fEQBU1IzWfMqLoAbEhOROgPHy5Wju1K7pF_ZtuWBQxhFoGXOI-TGOt6PoSCQJ0Td8wS4RMAY4PXeKYxa5-X2G9WYGRa1oM-mhlOh8MhxQfGnOb7FW1kqBluCjwWzMFHKT5svCRvz2EptAZjCX_UIgwJkoigd23Xshq7w4rAubklwf4Lr3kDDAwl1kc0H8bhwfsKz",
    alt: "Interior Angle 04",
    badge: "CAM_04"
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtPWQhhdATRIkmGg0GMYhOb6iPJdZog3v-unrs0cfCI48UaiKKvO-wkLEB5b1IBXazBgdrD18yLuGpwbflkK4IKJkbLHwTNvDQtZ1gXuRG6tHUzVycExOYR8Xw1I-70caGHGeVwQ2ePT0L6SQZgQA7-Wyq9bX4kR6Oj7rzf4BtV_terVIuSfXznzNI4EipsqbIJ3cfiZoJ98TM0jxKUOQvr50F4VKed1NMjK4Kt_j1_VwXchv_fyrr",
    alt: "Interior Angle 01",
    badge: "CAM_01"
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCm1nKC7RbV0r3IFSMiy6QsMr_yZYV-yZzX6LIhSMpBECiNqbEFOhsO_VvrgxiQpnFzusMuAiOtZQfK66Iyk-AWDiDmHEWIOqnVGSMHRYd2zNUA-vAjEP9bTCxr1JX0wrRujMCWnVKUtEv1FTTNGdC7bjmg0nVxOb3cpZJVHKQZ_0H__lapuwzqiuyDuu5x51XPGlyZs3R_YhuCDfNLMO_finvneEqT3cJbovdbFg3dOqx6oa3awInV",
    alt: "Interior Angle 02",
    badge: "CAM_02"
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDdC-hsfJrnyuOhV1RpHt0gYjlIbvr_7ZWzHuH_3MGsFWOCoBQ0NC_Dy088weFOKkIHrIMzgEUSx4H2VvPqqzYn4mfVal-MZrZx_xAsO9IpTMV-nbqTitWwdtZNo-qudmGnTBJMMUtDlegIeWjo1kKHiZnPAYX3_ft5-noj0YYGptU_27dCrKjUDwG7Ugfzskngwe022QYlJOJmHxftPNbmJClQUc88jlrMjhcdaYyVtR0NjelWuvc",
    alt: "Living Room Architectural Interior Vantage",
    badge: "CAM_03"
  },
  {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYMnIiW5dPOdaUgcQy22L_il-TI_NQwqaAbQhCMrzXaHSDN6EK66K4TlVi2kJdyGbl5NdBZ1ijkP1oNc8OVMGWzX4BtoEP9-zsq9T9gzSIcqIe0iwferZjrBtQKPgAxzbedC2HDIsU8CHKWTrCNZAYh_7l2BSxeRxx-EegDzt16sSRTb8HHHAO8lRyGSYxwle3u4fWQ_3mAsQRCj2l4oKfzKMIC2_VLDo2a3PVl2vW29Ah7_QP6F9t",
    alt: "Interior Angle 05",
    badge: "CAM_05"
  }
];

export const SpatialTour: React.FC<SpatialTourProps> = ({ onEnterWorkspace }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [splitVal, setSplitVal] = useState(50);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isTerminusRevealed, setIsTerminusRevealed] = useState(false);
  const [terminusOffset, setTerminusOffset] = useState(280);

  // Chamber R comparison slider auto-showcase sweep refs
  const isSliderAnimatingRef = useRef(false);
  const userInteractedWithSliderRef = useRef(false);

  // PRISM Entrance Animation State: Appears from upwards direction, zoomed out of visible range, morphing to center
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [matrixSpotlight, setMatrixSpotlight] = useState<{ x: number; y: number } | null>(null);
  const [introPhase, setIntroPhase] = useState<'initial' | 'pulling-back' | 'settled'>('initial');
  const [wordmarkStyle, setWordmarkStyle] = useState<React.CSSProperties>({
    opacity: 0,
    visibility: 'hidden'
  });

  const touchStartX = useRef<number>(0);
  const navPillsRef = useRef<HTMLElement>(null);
  const terminusAnchorRef = useRef<HTMLDivElement>(null);

  const totalSlides = 7;
  const chamberMeta = [
    { name: "ENTRY MATRIX", label: "START" },
    { name: "P — PHOTOGRAPHIC", label: "P // 01" },
    { name: "R — RECONSTRUCTION", label: "R // 02" },
    { name: "I — INDOOR", label: "I // 03" },
    { name: "S — SPATIAL", label: "S // 04" },
    { name: "M — MODELING", label: "M // 05" },
    { name: "TERMINUS EXPLORE", label: "END // 06" }
  ];

  // Upwards-to-Center Morph Entrance:
  // At first PRISM is zoomed out of visible range upwards, then when page loads transitions and smoothly moves to the center
  useLayoutEffect(() => {
    // Frame 1: Zoomed out of visible range in the upwards direction
    setWordmarkStyle({
      transform: 'translate3d(0, -62vh, 0) scale(0.22)',
      letterSpacing: '0.48em',
      filter: 'blur(16px)',
      opacity: 0,
      visibility: 'visible',
      transition: 'none'
    });

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Frame 2: Trigger smooth descent, expansion & morphing into center of screen
    timers.push(
      setTimeout(() => {
        setIntroPhase('pulling-back');
        setWordmarkStyle({
          transform: 'translate3d(0, 0px, 0) scale(1)',
          letterSpacing: '0.24em',
          filter: 'blur(0px)',
          opacity: 1,
          visibility: 'visible',
          transition:
            'transform 2200ms cubic-bezier(0.16, 1, 0.3, 1), letter-spacing 2200ms cubic-bezier(0.16, 1, 0.3, 1), filter 2000ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1500ms ease-out'
        });
      }, 60)
    );

    // Frame 3: Settle smoothly into final state at center of screen
    timers.push(
      setTimeout(() => {
        setIntroPhase('settled');
        setWordmarkStyle({
          transform: 'none',
          letterSpacing: '0.24em',
          filter: 'none',
          opacity: 1,
          visibility: 'visible'
        });
      }, 2350)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Initialize and track illuminated square matrix position (Stitch UI effect)
  useEffect(() => {
    setMatrixSpotlight({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
  }, []);

  const handleSlideChange = (idx: number) => {
    if (idx >= 0 && idx < totalSlides) {
      setCurrentSlide(idx);
    }
  };

  const handleSwapCam = (idx: number) => {
    if (idx === activeCamIndex || isSwapping) return;
    setIsSwapping(true);
    setTimeout(() => {
      setActiveCamIndex(idx);
      setIsSwapping(false);
    }, 220);
  };

  // Measure dynamic vertical offset for the monumental wordmark descent
  const computeOffset = () => {
    if (terminusAnchorRef.current) {
      const rect = terminusAnchorRef.current.getBoundingClientRect();
      const currentCenterY = window.innerWidth < 768 ? 32 : 40;
      const targetCenterY = rect.top + rect.height / 2;
      if (targetCenterY > 50) {
        setTerminusOffset(targetCenterY - currentCenterY);
        return;
      }
    }
    // Fallback based on viewport
    const fallbackY = window.innerHeight * 0.32 - (window.innerWidth < 768 ? 32 : 40);
    setTerminusOffset(fallbackY);
  };

  useEffect(() => {
    computeOffset();
    window.addEventListener('resize', computeOffset);
    return () => window.removeEventListener('resize', computeOffset);
  }, [currentSlide]);

  useEffect(() => {
    if (currentSlide === 6) {
      computeOffset();
      const timer = setTimeout(() => {
        setIsTerminusRevealed(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsTerminusRevealed(false);
    }
  }, [currentSlide]);

  // Chamber R: Automatically slide across briefly when scrolled to this chamber to showcase functionality
  useEffect(() => {
    if (currentSlide === 2) {
      userInteractedWithSliderRef.current = false;
      isSliderAnimatingRef.current = true;
      let animFrameId: number | undefined;

      // Brief delay after entering slide 2 so the slide transition finishes smoothly
      const startTimer = setTimeout(() => {
        if (!isSliderAnimatingRef.current || userInteractedWithSliderRef.current) return;

        const duration = 1800; // 1.8s smooth showcase sweep
        const startTime = performance.now();
        const centerVal = 50;

        const animate = (currentTime: number) => {
          if (!isSliderAnimatingRef.current || userInteractedWithSliderRef.current) return;

          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Smooth sinusoidal wave with envelope: 50% -> sweeps left to ~26% -> sweeps right to ~74% -> returns to 50%
          const wave = -Math.sin(progress * Math.PI * 2);
          const envelope = Math.sin(progress * Math.PI);
          const currentPos = centerVal + wave * envelope * 26;

          setSplitVal(currentPos);

          if (progress < 1) {
            animFrameId = requestAnimationFrame(animate);
          } else {
            setSplitVal(50);
            isSliderAnimatingRef.current = false;
          }
        };

        animFrameId = requestAnimationFrame(animate);
      }, 420);

      return () => {
        clearTimeout(startTimer);
        isSliderAnimatingRef.current = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
      };
    } else {
      isSliderAnimatingRef.current = false;
      setSplitVal(50);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleSlideChange(currentSlide + 1);
      } else if (e.key === 'ArrowLeft') {
        handleSlideChange(currentSlide - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  useEffect(() => {
    let wheelTimeout: number | undefined;
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input[type="range"]')) return;

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) > 18) {
        if (wheelTimeout !== undefined) return;
        if (delta > 0) {
          handleSlideChange(currentSlide + 1);
        } else {
          handleSlideChange(currentSlide - 1);
        }
        wheelTimeout = window.setTimeout(() => {
          wheelTimeout = undefined;
        }, 700);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (wheelTimeout !== undefined) clearTimeout(wheelTimeout);
    };
  }, [currentSlide]);

  const activeVantage = CAM_VANTAGES[activeCamIndex];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070b] text-[#f1f4f9] font-grotesk select-none">
      {/* Top HUD Nav Bar with Morphing Capsule */}
      <header
        id="top-nav-bar"
        className={`fixed top-0 left-0 right-0 h-16 md:h-20 px-6 md:px-12 flex items-center z-[120] justify-center border-b border-white/[0.08] bg-[#05070b]/80 backdrop-blur-md will-change-transform ${
          currentSlide === 6
            ? 'at-terminus !bg-transparent !border-transparent translate-y-0 opacity-100'
            : currentSlide === 0
            ? '-translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 pointer-events-auto'
        } ${introPhase !== 'settled' ? 'opacity-0 pointer-events-none -translate-y-full' : ''}`}
      >
        {/* Chamber Center Navigation: Morphing PRISM Letter Pills */}
        <nav
          ref={navPillsRef}
          id="chamber-nav-pills"
          aria-label="PRISM Chambers"
          className={`flex items-center px-4 md:px-6 py-2 relative will-change-transform ${
            currentSlide === 0
              ? '-translate-y-8 opacity-0 pointer-events-none'
              : currentSlide === 6
              ? 'terminus-descended'
              : 'translate-y-0 opacity-100 gap-2 sm:gap-3'
          }`}
          style={{
            transform:
              currentSlide === 6
                ? `translateY(${terminusOffset}px)`
                : currentSlide === 0
                ? 'translateY(-32px)'
                : 'translateY(0px)'
          }}
        >
          {(['P', 'R', 'I', 'S', 'M'] as const).map((char, i) => {
            const chamberIdx = i + 1;
            const isActive = currentSlide === chamberIdx;
            const isTerminus = currentSlide === 6;

            return (
              <button
                key={char}
                onClick={() => handleSlideChange(chamberIdx)}
                className={`prism-nav-letter ${
                  isTerminus ? 'terminus-morphed' : `in-nav ${isActive ? 'is-active' : ''}`
                }`}
                title={`Chamber ${char}`}
              >
                {!isTerminus && (
                  <span
                    className={`letter-aura absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.25)_0%,transparent_75%)] pointer-events-none transition-all ${
                      isActive ? 'opacity-100 scale-125' : 'opacity-0 scale-75'
                    }`}
                  ></span>
                )}
                <span className="relative z-10 tracking-widest font-sans">{char}</span>
                {!isTerminus && (
                  <span
                    className={`letter-dot absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ea580c] shadow-[0_0_8px_#f97316] transition-all ${
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}
                  ></span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Horizontal Chamber Carousel Viewport */}
      <div
        className="w-full h-full overflow-hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0].screenX;
        }}
        onTouchEnd={(e) => {
          const delta = touchStartX.current - e.changedTouches[0].screenX;
          if (delta > 50) handleSlideChange(currentSlide + 1);
          if (delta < -50) handleSlideChange(currentSlide - 1);
        }}
      >
        <div
          className="flex h-full transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${totalSlides * 100}vw`, transform: `translateX(-${currentSlide * 100}vw)` }}
        >
          {/* ==================== SLIDE 0: ENTRANCE FLYTHROUGH ==================== */}
          <section
            className="w-screen h-screen flex-shrink-0 relative bg-[#05070b] flex items-center justify-center overflow-hidden"
            onMouseMove={(e) => {
              if (currentSlide === 0) {
                setMatrixSpotlight({ x: e.clientX, y: e.clientY });
              }
            }}
          >
            {/* Background Atmosphere, Grid & Cross */}
            <div
              className={`absolute inset-0 pointer-events-none transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                introPhase === 'initial'
                  ? 'opacity-60 scale-[1.06] -translate-y-6'
                  : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              {/* Background 80px architectural grid */}
              <div className="arch-grid-matrix"></div>

              {/* Square Matrix Illumination Layer (Stitch UI effect: lights up region around cursor) */}
              {matrixSpotlight && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-[2]"
                  style={{
                    opacity: introPhase === 'settled' ? 0.35 : 0.85
                  }}
                >
                  {/* Ambient glow centered on active cursor point */}
                  <div
                    className="absolute pointer-events-none transition-all duration-150 ease-out rounded-full"
                    style={{
                      left: `${matrixSpotlight.x}px`,
                      top: `${matrixSpotlight.y}px`,
                      width: '320px',
                      height: '320px',
                      transform: 'translate(-50%, -50%)',
                      background: 'radial-gradient(circle, rgba(234,88,12,0.22) 0%, rgba(234,88,12,0.06) 50%, transparent 75%)',
                      filter: 'blur(24px)'
                    }}
                  />

                  {/* Lit-up square grid lines in the cursor region */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-all duration-150 ease-out"
                    style={{
                      maskImage: `radial-gradient(circle 200px at ${matrixSpotlight.x}px ${matrixSpotlight.y}px, rgba(0,0,0,1) 25%, rgba(0,0,0,0.45) 60%, transparent 100%)`,
                      WebkitMaskImage: `radial-gradient(circle 200px at ${matrixSpotlight.x}px ${matrixSpotlight.y}px, rgba(0,0,0,1) 25%, rgba(0,0,0,0.45) 60%, transparent 100%)`
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(234, 88, 12, 0.45) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(234, 88, 12, 0.45) 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px',
                        backgroundPosition: 'center center'
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-radial-gradient(circle at 50% 50%, #0d1524 0%, #05070b 80%) pointer-events-none z-[3]"></div>

              {/* The Big Cross in Background */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-[1000px] h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-[4]"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[70vh] max-h-[700px] w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent pointer-events-none z-[4]"></div>

              {/* Central Precision Crosshair Reticle Intersection */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none z-[5] opacity-60 flex items-center justify-center">
                <div className="absolute w-[1px] h-3 bg-[#ea580c]"></div>
                <div className="absolute h-[1px] w-3 bg-[#ea580c]"></div>
              </div>
            </div>

            {/* Expanding Cinematic Atmospheric Light Bloom */}
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-[6] transition-all duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                introPhase === 'initial'
                  ? 'w-[50vw] h-[40vh] bg-radial-gradient(circle, rgba(234,88,12,0.18) 0%, rgba(13,21,36,0.7) 50%, transparent 80%) blur-3xl opacity-20 scale-75 -translate-y-24'
                  : 'w-[clamp(320px,65vw,900px)] h-[clamp(180px,35vw,500px)] bg-radial-gradient(circle, rgba(234,88,12,0.12) 0%, rgba(13,21,36,0.6) 45%, transparent 75%) blur-3xl opacity-100 scale-100 translate-y-0'
              }`}
            ></div>

            {/* Perfectly Centered Wordmark Stage - Precisely Aligned with Big Cross */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-6">
              <div
                ref={wordmarkRef}
                style={wordmarkStyle}
                className="pointer-events-auto flex items-center justify-center text-[clamp(4.5rem,16.2vw,14.4rem)] font-grotesk font-extrabold text-white select-none origin-center will-change-transform min-h-[1.15em] drop-shadow-[0_0_75px_rgba(241,244,249,0.32)] -mt-[26px] ml-[60px] mr-[1px] pt-0 pr-0"
              >
                {(['P', 'R', 'I', 'S', 'M'] as const).map((char, i) => {
                  const offsets = [
                    { x: -32, y: -24 },
                    { x: -14, y: -10 },
                    { x: 0, y: 0 },
                    { x: 14, y: -10 },
                    { x: 32, y: -24 }
                  ];
                  return (
                    <span
                      key={char}
                      className="inline-block transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{
                        transform:
                          introPhase === 'initial'
                            ? `translate3d(${offsets[i].x}px, ${offsets[i].y}px, 0)`
                            : 'translate3d(0, 0, 0)'
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Architectural Subtitle Description Anchored Below */}
            <div className="absolute bottom-[10vh] md:bottom-[12vh] left-0 right-0 z-20 flex justify-center text-center px-6 pointer-events-none">
              <p
                className={`pointer-events-auto text-slate-300/85 font-light text-sm md:text-base leading-relaxed tracking-wider max-w-xl mx-auto text-center px-4 select-none transition-all duration-1000 ease-out -mt-[5px] pb-[100px] ${
                  introPhase === 'settled'
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                Photographic reconstruction for indoor spatial modeling — turning ordinary handheld photographs into navigable, millimeter-accurate 3D digital twins.
              </p>
            </div>
          </section>

          {/* ==================== SLIDE 1: CHAMBER P — PHOTOGRAPHIC ==================== */}
          <section className="w-screen h-screen flex-shrink-0 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#05070b] via-[#05070b]/80 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-transparent to-[#05070b]/60"></div>
              <div className="arch-grid-matrix opacity-40"></div>
            </div>

            <div className="max-w-[1700px] mx-auto w-full px-6 md:px-16 lg:px-24 relative z-10 pt-16 md:pt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Narrative Left */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="mb-3 -mt-6 md:-mt-8">
                    <h2 className="flex items-baseline font-extrabold uppercase tracking-tight text-white mb-2">
                      <span className="text-[3.375rem] md:text-[5.4rem] lg:text-[7.2rem] font-black text-[#ea580c] mr-1 leading-none drop-shadow-[0_0_25px_rgba(234,88,12,0.8)]">
                        P
                      </span>
                      <span className="text-[1.6875rem] md:text-[40.2px] lg:text-[40.2px] font-extrabold tracking-[0.2em] text-slate-100 self-center">
                        HOTOGRAPHIC
                      </span>
                    </h2>
                  </div>
                  <div className="font-mono text-xs md:text-sm tracking-[0.26em] uppercase text-[#ea580c] mb-5 flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                    <span>Multi-Angle Optical Sensor Acquisition</span>
                  </div>
                  <p className="text-slate-300 text-base md:text-lg font-light leading-relaxed mb-8 max-w-2xl">
                    PRISM begins with a calibrated constellation of overlapping photographs captured throughout an indoor environment. Each optical vantage point resolves distinct lighting, geometry, and occlusion vectors needed for seamless 3D reconstruction.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">CAPTURE METHOD</span>
                      <span className="text-xs font-semibold text-slate-200">Smartphone Camera</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">VANTAGES</span>
                      <span className="text-xs font-semibold text-slate-200">Overlapping</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">ENVIRONMENT</span>
                      <span className="text-xs font-semibold text-slate-200">Interior Room</span>
                    </div>
                  </div>
                </div>

                {/* Viewport Stage Right */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0e1522] shadow-[0_25px_60px_rgba(0,0,0,0.8)] group">
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <img
                        alt={activeVantage.alt}
                        className={`w-full h-full object-cover brightness-95 group-hover:scale-105 transition-all duration-300 ${
                          isSwapping ? 'opacity-30 scale-98' : 'opacity-100 scale-100'
                        }`}
                        src={activeVantage.src}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                        <span className="font-mono text-xs md:text-sm tracking-[0.28em] uppercase text-white font-semibold px-3 py-1.5 rounded bg-black/60 backdrop-blur-md border border-white/10">
                          LIVING ROOM // {activeVantage.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Overlapping Sensor Exposures (Thumbnails) */}
                  <div className="grid grid-cols-5 gap-2.5">
                    {CAM_VANTAGES.map((vantage, idx) => {
                      const isCurrent = idx === activeCamIndex;
                      return (
                        <button
                          key={vantage.badge}
                          onClick={() => handleSwapCam(idx)}
                          className={`relative aspect-video rounded-lg overflow-hidden border transition-all duration-300 cursor-pointer group bg-black/40 text-left ${
                            isCurrent
                              ? 'border-[#ea580c] ring-2 ring-[#ea580c]/50 shadow-[0_0_15px_rgba(234,88,12,0.45)]'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img
                            alt={vantage.alt}
                            className="w-full h-full object-cover brightness-85 group-hover:brightness-100 group-hover:scale-105 transition-all duration-300"
                            src={vantage.src}
                          />
                          <div className="absolute bottom-1 left-1.5 font-mono text-[8px] tracking-wider text-white bg-black/80 px-1 py-0.5 rounded border border-white/10">
                            {vantage.badge}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SLIDE 2: CHAMBER R — RECONSTRUCTION ==================== */}
          <section className="w-screen h-screen flex-shrink-0 relative overflow-hidden bg-[#070b12] flex flex-col justify-center">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#070b12]/85 to-[#070b12]"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b12] via-transparent to-[#070b12]/70"></div>
              <div className="arch-grid-matrix opacity-40"></div>
            </div>

            <div className="max-w-[1700px] mx-auto w-full px-6 md:px-16 lg:px-24 relative z-10 pt-16 md:pt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Comparison Slider Stage */}
                <div className="lg:col-span-7 lg:order-2 order-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/70 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-3 md:p-4 flex flex-col gap-3 group">
                    <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden select-none border border-white/10 bg-[#05070b]">
                      {/* Photo Capture Base Image */}
                      <img
                        alt="Optical Photographic Capture State"
                        className="absolute inset-0 w-full h-full object-cover contrast-110 pointer-events-none"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHwT8STccyp_vp7vPRfaGo1M-hk_QQ05Ejha9Inl-KlGW7EZ3oZJkBzVMnbVqgtmsaumB3YzUxqn9UED0tZbul4-L3r_nPIuTKZpakxI_ty4uAVu3Cxu0ftlGH8iacZc8oIAtyomheEQgAJDk1FsmEphKTxvoUTVKu8_n_qxm_Lx35h9QtCGwDZ2OT4HIRLePAcoNVMt6CliioEXtTWTYToBM_Mqbsd2_BWz4JQj__S1w93AdJX3RR"
                      />

                      {/* 3D Spatial Twin Layer clipped by slider */}
                      <div
                        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none will-change-[clip-path]"
                        style={{ clipPath: `polygon(0px 0px, ${splitVal}% 0px, ${splitVal}% 100%, 0px 100%)` }}
                      >
                        <img
                          alt="3D Spatial Reconstruction Twin Matrix"
                          className="absolute inset-0 w-full h-full object-cover contrast-125"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE63dSqnTBXZhGnuX1LNs0RxRGUosFgJdLS9jUq5FONTmna9j7WcP7wJjlS-7PBWtbvgzYhEZupNmBVpHOHXeczdRvhSYPnM2TbieV3u1bCafr35m6w3d0NOIBEjLh9pC7Fc7djD7taosMBMHFIuGv5FFWQ881s7a52P_N6jxmryOp8WIK3zqj9UvkHIv64878X2EgYCIR1rBrrR-onGZo8aaIH06rKACOcIa3lImWUWY6xNbIO4Cd"
                        />
                        <div className="absolute inset-0 bg-[#ea580c]/10 pointer-events-none"></div>
                      </div>

                      <div className="arch-grid-matrix opacity-25"></div>

                      {/* 3D Spatial Twin Label (Masked by slider boundary) */}
                      <div
                        className="absolute inset-0 pointer-events-none z-20 overflow-hidden will-change-[clip-path]"
                        style={{ clipPath: `polygon(0px 0px, ${splitVal}% 0px, ${splitVal}% 100%, 0px 100%)` }}
                      >
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <span className="font-mono text-[9px] md:text-[10px] tracking-[0.24em] uppercase text-[#ea580c] font-semibold px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-[#ea580c]/40 shadow-[0_0_15px_rgba(234,88,12,0.3)] flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-ping"></span>
                            3D SPATIAL TWIN
                          </span>
                        </div>
                      </div>

                      {/* Photo Capture Label (Masked by slider boundary) */}
                      <div
                        className="absolute inset-0 pointer-events-none z-20 overflow-hidden will-change-[clip-path]"
                        style={{ clipPath: `polygon(${splitVal}% 0px, 100% 0px, 100% 100%, ${splitVal}% 100%)` }}
                      >
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className="font-mono text-[9px] md:text-[10px] tracking-[0.24em] uppercase text-white font-semibold px-2.5 py-1 rounded bg-black/75 backdrop-blur-md border border-white/15 flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            PHOTO CAPTURE
                          </span>
                        </div>
                      </div>

                      {/* Divider Handle */}
                      <div
                        className="absolute top-0 bottom-0 z-25 w-[2px] bg-gradient-to-b from-[#ea580c] via-white to-[#ea580c] pointer-events-none shadow-[0_0_15px_#ea580c] will-change-[left]"
                        style={{ left: `${splitVal}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/90 border border-[#ea580c] shadow-[0_0_20px_#ea580c] flex items-center justify-center text-white backdrop-blur-md">
                          <span className="material-symbols-outlined text-[13px] text-[#ea580c]">sync_alt</span>
                        </div>
                      </div>

                      {/* Invisible Range Slider */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={splitVal}
                        onPointerDown={() => {
                          userInteractedWithSliderRef.current = true;
                          isSliderAnimatingRef.current = false;
                        }}
                        onTouchStart={() => {
                          userInteractedWithSliderRef.current = true;
                          isSliderAnimatingRef.current = false;
                        }}
                        onChange={(e) => {
                          userInteractedWithSliderRef.current = true;
                          isSliderAnimatingRef.current = false;
                          setSplitVal(Number(e.target.value));
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 m-0 p-0"
                        aria-label="Comparison Slider Reality versus 3D Reconstruction Matrix"
                      />
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-slate-400 px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                        <span>
                          SPATIAL CONVERGENCE: <span className="text-[#ea580c] font-bold">{Math.round(splitVal)}%</span>
                        </span>
                      </div>
                      <span className="text-slate-500">DRAG HORIZONTALLY TO COMPARE</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Right */}
                <div className="lg:col-span-5 flex flex-col justify-center lg:order-1 order-1">
                  <div className="mb-3 -mt-6 md:-mt-8">
                    <h2 className="flex items-baseline font-extrabold uppercase tracking-tight text-white mb-2">
                      <span className="text-[3.375rem] md:text-[5.4rem] lg:text-[7.2rem] font-black text-[#ea580c] mr-1 leading-none drop-shadow-[0_0_25px_rgba(234,88,12,0.8)]">
                        R
                      </span>
                      <span className="text-[1.6875rem] md:text-[40.2px] lg:text-[40.2px] font-extrabold tracking-[0.2em] text-slate-100 self-center">
                        ECONSTRUCTION
                      </span>
                    </h2>
                  </div>
                  <div className="font-mono text-xs md:text-sm tracking-[0.26em] uppercase text-[#ea580c] mb-5 flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                    <span>TURNING PHOTOGRAPHS INTO A 3D REPRESENTATION.</span>
                  </div>
                  <p className="text-slate-300 text-base md:text-lg font-light leading-relaxed mb-8 max-w-2xl">
                    PRISM analyzes the overlapping photographs and combines the information they contain to determine how the images relate to one another in three-dimensional space. From these relationships, the structure of the captured environment begins to emerge.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">INPUT</span>
                      <span className="text-xs font-semibold text-slate-200">Overlapping Photos</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">PROCESS</span>
                      <span className="text-xs font-semibold text-slate-200">Spatial Reconstruction</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">OUTPUT</span>
                      <span className="text-xs font-semibold text-slate-200">3D Scene</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SLIDE 3: CHAMBER I — INDOOR ==================== */}
          <section className="w-screen h-screen flex-shrink-0 relative overflow-hidden flex flex-col justify-center">
            <div className="sunbeam"></div>
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#05070b] via-[#05070b]/80 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-transparent to-[#05070b]/70"></div>
              <div className="arch-grid-matrix opacity-35"></div>
            </div>

            <div className="max-w-[1700px] mx-auto w-full px-6 md:px-16 lg:px-24 relative z-10 pt-16 md:pt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="mb-3 -mt-6 md:-mt-8">
                    <h2 className="flex items-baseline font-extrabold uppercase tracking-tight text-white mb-2">
                      <span className="text-[3.375rem] md:text-[5.4rem] lg:text-[7.2rem] font-black text-[#ea580c] mr-1 leading-none drop-shadow-[0_0_25px_rgba(234,88,12,0.8)]">
                        I
                      </span>
                      <span className="text-[1.6875rem] md:text-[2.7rem] lg:text-[2.7rem] font-extrabold tracking-[0.2em] text-slate-100 self-center">
                        NDOOR
                      </span>
                    </h2>
                  </div>
                  <div className="font-mono text-xs md:text-sm tracking-[0.26em] uppercase text-[#ea580c] mb-5 flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                    <span>RECONSTRUCTING THE SPACES WE LIVE IN.</span>
                  </div>
                  <p className="text-slate-300 text-base md:text-lg font-light leading-relaxed mb-8 max-w-2xl">
                    PRISM is designed for indoor environments such as rooms, homes, classrooms, and offices. By capturing these spaces through ordinary photographs, PRISM can reconstruct their structure and appearance as a navigable 3D environment.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">ENVIRONMENT</span>
                      <span className="text-xs font-semibold text-slate-200">Indoor Spaces</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">CAPTURE</span>
                      <span className="text-xs font-semibold text-slate-200">Ordinary Photos</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">OUTPUT</span>
                      <span className="text-xs font-semibold text-slate-200">3D Environment</span>
                    </div>
                  </div>
                </div>

                {/* Viewport Right with Hotspots */}
                <div className="lg:col-span-7">
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-4 md:p-5">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/10">
                      <img
                        alt="Architectural Cutaway 3D Indoor Model"
                        className="w-full h-full object-cover rounded-xl select-none pointer-events-none"
                        src="https://lh3.googleusercontent.com/aida/AEtjO1W3YeOTE1J0xBlUd_AQtBEghty6OiSvARmul0ewZp55z7PlymB9gANIt0slGH_rwksvjOCH4UTWch2XhztuK7ifuuqOHC5MDgdqtC61GANjTlmr1cbApKXzTE_YzJeKcZLybzHVCPVuHQ6iuWllWWjvcEpQeLFw0oZNNP7WFNmEYXt3ZepobGufaANdju2qFvHshC2IEBskV0LlPPMttS2Acli1Rcrx805Mbpgps2c9X6fxtXSLOUo48Q"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

                      {/* Hotspots */}
                      <div className="absolute inset-0 z-20">
                        {[
                          { name: 'MASTER SUITE', top: '25%', left: '22%', w: '20%', h: '20%' },
                          { name: 'HOME OFFICE / STUDY', top: '12%', left: '54%', w: '14%', h: '16%' },
                          { name: 'LIVING ROOM', top: '54%', left: '18%', w: '18%', h: '18%' },
                          { name: 'DINING AREA', top: '56%', left: '38%', w: '14%', h: '16%' },
                          { name: 'KITCHEN & ISLAND', top: '52%', left: '56%', w: '18%', h: '18%' }
                        ].map((spot) => (
                          <div
                            key={spot.name}
                            className="absolute rounded-lg cursor-pointer group hover:bg-[#ea580c]/15 hover:border hover:border-[#ea580c]/60 transition-all duration-300"
                            style={{ top: spot.top, left: spot.left, width: spot.w, height: spot.h }}
                          >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#ea580c] border-2 border-white shadow-[0_0_14px_#ea580c] group-hover:scale-125 transition-transform"></div>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                              <div className="px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-[#ea580c]/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] font-mono text-[10px] tracking-wider font-bold text-[#ea580c] uppercase flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                                {spot.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SLIDE 4: CHAMBER S — SPATIAL (THREE.JS) ==================== */}
          <section className="w-screen h-screen flex-shrink-0 relative overflow-hidden bg-[#070b12] flex flex-col justify-center">
            <div className="arch-grid-matrix opacity-40"></div>
            <div className="max-w-[1700px] mx-auto w-full px-6 md:px-16 lg:px-24 relative z-10 pt-16 md:pt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* 3D Coordinate Stage */}
                <div className="lg:col-span-7 order-2 lg:order-2">
                  <SpatialThreeScene />
                </div>

                {/* Narrative */}
                <div className="lg:col-span-5 order-1 flex flex-col justify-center lg:order-1">
                  <div className="mb-3 -mt-6 md:-mt-8">
                    <h2 className="flex items-baseline font-extrabold uppercase tracking-tight text-white mb-2">
                      <span className="text-[3.375rem] md:text-[5.4rem] lg:text-[7.2rem] font-black text-[#ea580c] mr-1 leading-none drop-shadow-[0_0_25px_rgba(234,88,12,0.8)]">
                        S
                      </span>
                      <span className="text-[1.6875rem] md:text-[2.7rem] lg:text-[2.7rem] font-extrabold tracking-[0.2em] text-slate-100 self-center">
                        PATIAL
                      </span>
                    </h2>
                  </div>
                  <div className="font-mono text-xs md:text-sm tracking-[0.26em] uppercase text-[#ea580c] mb-5 flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                    <span>UNDERSTANDING THE RELATION OF ENVIRONMENT</span>
                  </div>
                  <p className="text-slate-300 text-base md:text-lg font-light leading-relaxed mb-8 max-w-2xl">
                    PRISM goes beyond individual images by representing the depth, distance, and position of objects within the captured environment. This allows the reconstructed space to be understood as a connected three-dimensional scene.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">DIMENSION</span>
                      <span className="text-xs font-semibold text-slate-200">3D Space</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">RELATIONSHIP</span>
                      <span className="text-xs font-semibold text-slate-200">Depth & Distance</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">PERSPECTIVE</span>
                      <span className="text-xs font-semibold text-slate-200">Multi-Viewpoint</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SLIDE 5: CHAMBER M — MODELING ==================== */}
          <section className="w-screen h-screen flex-shrink-0 relative overflow-hidden flex flex-col justify-center">
            <div className="arch-grid-matrix opacity-30"></div>
            <div className="max-w-[1700px] mx-auto w-full px-6 md:px-16 lg:px-24 relative z-10 pt-16 md:pt-20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="mb-3 -mt-6 md:-mt-8">
                    <h2 className="flex items-baseline font-extrabold uppercase tracking-tight text-white mb-2">
                      <span className="text-[3.375rem] md:text-[5.4rem] lg:text-[7.2rem] font-black text-[#ea580c] mr-1 leading-none drop-shadow-[0_0_25px_rgba(234,88,12,0.8)]">
                        M
                      </span>
                      <span className="text-[1.6875rem] md:text-[2.7rem] lg:text-[2.7rem] font-extrabold tracking-[0.2em] text-slate-100 self-center">
                        ODELING
                      </span>
                    </h2>
                  </div>
                  <div className="font-mono text-xs md:text-sm tracking-[0.26em] uppercase text-[#ea580c] mb-5 flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                    <span>Interactive Spatial Digital Twin</span>
                  </div>
                  <p className="text-slate-300 text-base md:text-lg font-light leading-relaxed mb-8 max-w-2xl">
                    PRISM converts the reconstructed scene into an interactive, browser-viewable 3D representation. By synthesizing continuous volumetric radiance and geometry, users can freely explore, measure, and inspect the indoor space with photographic fidelity.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">REPRESENTATION</span>
                      <span className="text-xs font-semibold text-slate-200">Gaussian Splat</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">FORMAT</span>
                      <span className="text-xs font-semibold text-slate-200">SPZ Model</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] tracking-widest text-slate-500 uppercase">EXPERIENCE</span>
                      <span className="text-xs font-semibold text-slate-200">Interactive 3D</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="relative rounded-2xl overflow-hidden border border-[#ea580c]/40 bg-[#0e1522] aspect-[16/10] flex items-center justify-center shadow-[0_25px_70px_rgba(0,0,0,0.85)] group">
                    <img
                      alt="High Fidelity Gaussian Splat Spatial Model"
                      className="w-full h-full object-cover brightness-95 group-hover:scale-105 transition-all duration-700 ease-out"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6un0QF23F7_hvn1y6zSg7mETr4snzzqZRQ3yxHHeMNe3zctO2gYfK7AP2vz-lyf3oB6i9vNUKxKcGmAAocUVD-y-7Aa4U0ohqQBgVgfme1_wJKDco2195E4veagw2139RikqpAq6jVvYIQcZSlbjRXr1fGNv97FDcXgg8TYDA17og_YR-46kw0KXS7ap9liBCA6j38lWFjSBq2DkHg_C6rw46ff0KiUccbxlyrkq7GnWPAFHKmDCM"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                      <span className="font-mono text-[10px] md:text-xs tracking-[0.26em] uppercase text-[#ea580c] font-semibold px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-[#ea580c]/50 shadow-[0_0_20px_rgba(234,88,12,0.4)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-ping"></span>
                        LIVE 3D GAUSSIAN SPLAT
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between font-mono text-xs tracking-widest text-slate-200 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                      <span className="flex items-center gap-2 text-[#ea580c]">
                        <span className="material-symbols-outlined text-sm">view_in_ar</span>
                        PHOTOREALISTIC RADIANCE
                      </span>
                      <span className="text-slate-400">60 FPS // 4.2M SPLATS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SLIDE 6: RESOLUTION TERMINUS ==================== */}
          <section className="w-screen h-screen flex-shrink-0 relative bg-gradient-to-b from-[#080d16] via-[#05080f] to-[#030407] flex items-center justify-center text-center p-8 overflow-hidden" id="slide-terminus">
            <div className="arch-grid-matrix opacity-25"></div>
            {/* Atmospheric Warm Halos with Smooth Depth Fade */}
            <div className={`terminus-aurora-halo w-[min(95vw,900px)] h-[min(95vw,900px)] bg-[radial-gradient(circle,rgba(255,115,22,0.22)_0%,rgba(234,88,12,0.12)_35%,rgba(249,115,22,0.04)_60%,transparent_75%)] blur-[80px] pointer-events-none ${currentSlide === 6 ? 'halo-active' : ''}`} id="terminus-glow-core"></div>
            <div className={`terminus-aurora-halo w-[min(70vw,640px)] h-[min(70vw,640px)] bg-[radial-gradient(circle,rgba(255,180,80,0.14)_0%,rgba(234,88,12,0.06)_50%,transparent_70%)] blur-[95px] pointer-events-none ${currentSlide === 6 ? 'halo-active' : ''}`} id="terminus-glow-soft"></div>

            <div className={`relative z-10 max-w-4xl w-full flex flex-col items-center justify-center terminus-stage-wrapper ${currentSlide === 6 ? 'stage-active' : ''}`} id="terminus-stage">
              {/* Target Destination for Settled Monumental PRISM Wordmark (Letters glide from top nav into this anchor) */}
              <div
                ref={terminusAnchorRef}
                id="terminus-wordmark-anchor"
                className="w-full flex items-center justify-center min-h-[90px] md:min-h-[130px] lg:min-h-[150px] mb-4 pointer-events-none"
              ></div>

              {/* Narrative cascade content directly below the settled wordmark */}
              <div
                id="terminus-narrative-group"
                className={`terminus-content-cascade flex flex-col items-center ${
                  isTerminusRevealed ? 'is-revealed' : ''
                }`}
              >
                <h2 className="text-[1.35rem] md:text-[2.025rem] lg:text-[2.7rem] font-bold text-white tracking-tight mb-3 uppercase drop-shadow-[0_0_30px_rgba(234,88,12,0.35)]">
                  THE SPACE IS READY.
                </h2>
                <div className="mb-8 max-w-lg flex flex-col gap-1.5 text-center">
                  <p className="text-sm md:text-base lg:text-lg font-light text-slate-200 leading-relaxed drop-shadow-sm">
                    From photographs to a reconstructed 3D environment.
                  </p>
                  <p className="text-sm md:text-base font-light text-slate-400 leading-relaxed">
                    Now explore the space for yourself.
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={onEnterWorkspace}
                    className="btn-explore-sovereign cursor-pointer"
                    id="explore-cta"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ea580c] animate-ping"></span>
                    <span>EXPLORE PRISM</span>
                  </button>
                </div>

                <div className="mt-8 font-mono text-[10px] md:text-xs tracking-widest text-slate-500 uppercase">
                  PHOTOGRAPHIC RECONSTRUCTION FOR INDOOR SPATIAL MODELING
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom HUD Controls Bar (No Arrow Buttons) */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 md:h-20 px-6 md:px-16 flex justify-between items-center z-[120] border-t border-white/[0.08] bg-[#05070b]/85 backdrop-blur-md gap-6">
        <div className={`flex items-center gap-4 w-full progress-track-wrapper ${currentSlide === 6 ? 'progress-hidden' : ''}`}>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden mx-2 sm:mx-4">
            <div
              className="h-full bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#ea580c] shadow-[0_0_12px_rgba(234,88,12,0.8)] transition-all duration-700 ease-out"
              style={{ width: `${(currentSlide / (totalSlides - 1)) * 100}%` }}
            ></div>
          </div>
          <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[#ea580c] whitespace-nowrap">
            {chamberMeta[currentSlide].name}
          </span>
        </div>

        <div className={`hidden md:flex items-center gap-2 font-mono text-[9px] tracking-widest text-slate-400 whitespace-nowrap transition-opacity duration-500 ${currentSlide === 6 ? 'opacity-0' : 'opacity-100'}`}>
          <span>← SWIPE OR SCROLL →</span>
        </div>
      </footer>
    </div>
  );
};
