"use client";
import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import gsap from "gsap";
import { Sparkles, RotateCcw, Orbit, ShieldCheck, FileSpreadsheet, ArrowDown } from "lucide-react";

const INITIAL_CARDS = [
  {
    id: 1,
    title: "Raw Steel Bill #902",
    amount: "₹1,50,000",
    badge: "GSTIN Active",
    type: "INV",
    bg: "from-emerald-500/10 to-teal-500/10 border-emerald-500/40 text-emerald-900"
  },
  {
    id: 2,
    title: "GST 18% ITC #CGST",
    amount: "₹27,000",
    badge: "GSTR-2B Matched",
    type: "TAX",
    bg: "from-blue-500/10 to-indigo-500/10 border-blue-500/40 text-blue-900"
  },
  {
    id: 3,
    title: "Sundry Creditor JV",
    amount: "₹1,77,000",
    badge: "Balanced (Cr)",
    type: "LEDGER",
    bg: "from-purple-500/10 to-pink-500/10 border-purple-500/40 text-purple-900"
  },
  {
    id: 4,
    title: "Machinery Spares #312",
    amount: "₹88,500",
    badge: "PO Matched",
    type: "INV",
    bg: "from-amber-500/10 to-orange-500/10 border-amber-500/40 text-amber-900"
  },
  {
    id: 5,
    title: "MCA Audit Stamp",
    amount: "Hash: #98A2",
    badge: "Immutable Log",
    type: "AUDIT",
    bg: "from-slate-800/10 to-slate-900/10 border-slate-700/40 text-slate-900"
  },
  {
    id: 6,
    title: "Sec 43B(h) Clearance",
    amount: "14 Days Dues",
    badge: "100% Compliant",
    type: "COMPLIANCE",
    bg: "from-rose-500/10 to-red-500/10 border-rose-500/40 text-rose-900"
  }
];

export default function AntigravityPlayground() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const elementsRef = useRef([]);

  const [isPhysicsActive, setIsPhysicsActive] = useState(false);
  const [zeroG, setZeroG] = useState(false);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const bodiesMapRef = useRef([]);

  const startPhysics = () => {
    if (isPhysicsActive || !containerRef.current) return;
    setIsPhysicsActive(true);

    const { Engine, Bodies, Composite, Runner, Mouse, MouseConstraint } = Matter;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const engine = Engine.create();
    engineRef.current = engine;
    engine.gravity.y = zeroG ? 0 : 0.8;
    engine.gravity.x = 0;

    // Viewport boundaries
    const wallThickness = 120;
    const floor = Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, { isStatic: true });
    const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { isStatic: true });

    Composite.add(engine.world, [floor, ceiling, leftWall, rightWall]);

    // Create rigid bodies for each DOM card
    const bodiesMap = [];
    const elements = elementsRef.current;

    elements.forEach((el, index) => {
      if (!el) return;
      const elRect = el.getBoundingClientRect();
      const initialX = elRect.left - rect.left + elRect.width / 2;
      const initialY = elRect.top - rect.top + elRect.height / 2;

      // Store initial grid coordinates for "Restore Order"
      el.dataset.origX = initialX;
      el.dataset.origY = initialY;

      const body = Bodies.rectangle(initialX, initialY, elRect.width, elRect.height, {
        restitution: 0.7,
        frictionAir: 0.02,
        chamfer: { radius: 16 },
        density: 0.001
      });

      // Initial scatter explosion
      const forceMag = 0.04 * body.mass;
      const angle = (Math.random() - 0.5) * Math.PI;
      Matter.Body.applyForce(body, body.position, {
        x: Math.cos(angle) * forceMag,
        y: -Math.abs(Math.sin(angle)) * forceMag
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);

      Composite.add(engine.world, body);
      bodiesMap.push({ element: el, body, w: elRect.width, h: elRect.height });

      // Detach element into absolute positioning
      el.style.position = "absolute";
      el.style.left = "0";
      el.style.top = "0";
      el.style.margin = "0";
      el.style.willChange = "transform";
      el.style.cursor = "grab";
    });

    bodiesMapRef.current = bodiesMap;

    // Mouse Drag & Throw constraint
    const mouse = Mouse.create(container);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Composite.add(engine.world, mouseConstraint);

    // Runner
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Sync loop
    let animId;
    const syncDOM = () => {
      bodiesMap.forEach(({ element, body, w, h }) => {
        const x = (body.position.x - w / 2).toFixed(1);
        const y = (body.position.y - h / 2).toFixed(1);
        const rot = body.angle.toFixed(3);
        element.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}rad)`;
      });
      animId = requestAnimationFrame(syncDOM);
    };
    animId = requestAnimationFrame(syncDOM);

    // Save cleanup
    engine.syncAnimId = animId;
  };

  const toggleZeroG = () => {
    setZeroG((prev) => {
      const next = !prev;
      if (engineRef.current) {
        gsap.to(engineRef.current.gravity, {
          y: next ? 0 : 0.8,
          duration: 1.5,
          ease: "power2.inOut"
        });
      }
      return next;
    });
  };

  const restoreOrder = () => {
    if (!engineRef.current || !isPhysicsActive) return;

    // Cancel animation loop and freeze bodies
    if (engineRef.current.syncAnimId) {
      cancelAnimationFrame(engineRef.current.syncAnimId);
    }
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
    }

    const bodiesMap = bodiesMapRef.current;
    let completed = 0;

    bodiesMap.forEach(({ element, body }) => {
      Matter.Body.setStatic(body, true);
      const targetX = parseFloat(element.dataset.origX) - element.offsetWidth / 2;
      const targetY = parseFloat(element.dataset.origY) - element.offsetHeight / 2;

      gsap.to(element, {
        x: targetX,
        y: targetY,
        rotation: 0,
        duration: 0.9,
        ease: "back.out(1.2)",
        onComplete: () => {
          completed++;
          if (completed === bodiesMap.length) {
            // Reset to standard CSS layout
            bodiesMap.forEach(({ element }) => {
              element.style.position = "";
              element.style.left = "";
              element.style.top = "";
              element.style.transform = "";
              element.style.margin = "";
              element.style.cursor = "default";
            });
            setIsPhysicsActive(false);
            setZeroG(false);
            Matter.World.clear(engineRef.current.world);
            Matter.Engine.clear(engineRef.current);
          }
        }
      });
    });
  };

  return (
    <div className="relative mx-auto max-w-6xl mt-20 px-4 sm:px-6">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-700">
          <Orbit className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          Interactive FinOps Physics Simulation
        </div>
        <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
          Tired of Financial Paperwork Chaos?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          Try the interactive antigravity test: Toss chaotic bills around with realistic physics, then watch Crown Ecosystems restore 100% balanced equilibrium with one click.
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {!isPhysicsActive ? (
          <button
            onClick={startPhysics}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black text-white shadow-lg hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Trigger Antigravity Chaos Mode
          </button>
        ) : (
          <>
            <button
              onClick={restoreOrder}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow-lg hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Restore Balanced Ledger (Order)
            </button>
            <button
              onClick={toggleZeroG}
              className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-xs font-bold transition-all cursor-pointer ${
                zeroG
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Orbit className="w-4 h-4" />
              {zeroG ? "Gravity: ZERO-G (Floating)" : "Toggle Zero-G"}
            </button>
          </>
        )}
      </div>

      {/* Physics Canvas & Card Stage */}
      <div
        ref={containerRef}
        className="relative h-[480px] sm:h-[420px] w-full rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white/90 p-6 shadow-xl overflow-hidden select-none"
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>

        {/* Floating Instructions Overlay */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-[10px] font-bold text-slate-500">
            {isPhysicsActive ? "Grab, throw & collide cards with mouse" : "Cards locked in standard grid"}
          </span>
        </div>

        {/* The Grid / Free-floating Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full relative z-10 pointer-events-auto">
          {INITIAL_CARDS.map((item, idx) => (
            <div
              key={item.id}
              ref={(el) => (elementsRef.current[idx] = el)}
              className={`flex flex-col justify-between rounded-2xl border bg-gradient-to-br ${item.bg} p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md h-[120px] sm:h-[130px]`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {item.type}
                </span>
                <span className="rounded-full bg-white/80 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 shadow-2xs">
                  {item.badge}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {item.title}
                </p>
                <p className="font-mono text-base sm:text-lg font-black text-slate-900 mt-1">
                  {item.amount}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
