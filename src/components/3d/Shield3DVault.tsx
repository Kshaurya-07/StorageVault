"use client";

import React, { useEffect, useRef } from "react";

interface Shield3DVaultProps {
  className?: string;
}

/**
 * 3D Vault Shield / Cryptographic Lock for Settings & Privacy
 * Features an extruded 3D security shield with rotating concentric lock tumblers,
 * keyway alignment pins, and perimeter defense wireframes.
 */
export default function Shield3DVault({ className = "" }: Shield3DVaultProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0].isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let angle = 0;

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        angle += 0.015;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) * 0.38;

      // Draw 3D Shield Outline Path
      const drawShieldPath = (ctx: CanvasRenderingContext2D, s: number, dy: number = 0) => {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - s * 0.8 + dy);
        ctx.lineTo(centerX + s * 0.75, centerY - s * 0.5 + dy);
        ctx.lineTo(centerX + s * 0.75, centerY + s * 0.15 + dy);
        ctx.bezierCurveTo(
          centerX + s * 0.75,
          centerY + s * 0.65 + dy,
          centerX,
          centerY + s * 0.9 + dy,
          centerX,
          centerY + s * 0.95 + dy
        );
        ctx.bezierCurveTo(
          centerX,
          centerY + s * 0.9 + dy,
          centerX - s * 0.75,
          centerY + s * 0.65 + dy,
          centerX - s * 0.75,
          centerY + s * 0.15 + dy
        );
        ctx.lineTo(centerX - s * 0.75, centerY - s * 0.5 + dy);
        ctx.closePath();
      };

      // 1. Back Extrusion Layer (Depth)
      drawShieldPath(ctx, scale, 8);
      ctx.fillStyle = "rgba(20, 20, 20, 0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Front Shield Face
      drawShieldPath(ctx, scale, 0);
      const shieldGrad = ctx.createLinearGradient(
        centerX - scale,
        centerY - scale,
        centerX + scale,
        centerY + scale
      );
      shieldGrad.addColorStop(0, "rgba(35, 35, 35, 0.85)");
      shieldGrad.addColorStop(1, "rgba(12, 12, 12, 0.95)");
      ctx.fillStyle = shieldGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Rotating Cryptographic Vault Tumblers
      const tumblerRadius = scale * 0.45;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 2, tumblerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tumbler Notch Markers
      const notches = 12;
      for (let n = 0; n < notches; n++) {
        const theta = angle + (n / notches) * Math.PI * 2;
        const x1 = centerX + Math.cos(theta) * (tumblerRadius - 4);
        const y1 = centerY - 2 + Math.sin(theta) * (tumblerRadius - 4);
        const x2 = centerX + Math.cos(theta) * (tumblerRadius + 4);
        const y2 = centerY - 2 + Math.sin(theta) * (tumblerRadius + 4);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = n % 3 === 0 ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = n % 3 === 0 ? 1.5 : 0.8;
        ctx.stroke();
      }

      // 4. Center Keyhole / Vault Core
      ctx.beginPath();
      ctx.arc(centerX, centerY - 8, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(centerX - 4, centerY - 4);
      ctx.lineTo(centerX + 4, centerY - 4);
      ctx.lineTo(centerX + 6, centerY + 14);
      ctx.lineTo(centerX - 6, centerY + 14);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Outer Glow
      ctx.beginPath();
      ctx.arc(centerX, centerY - 2, tumblerRadius + 14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.stroke();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[220px] flex items-center justify-center select-none overflow-hidden ${className}`}
      aria-label="3D Vault Shield and Cryptographic Lock"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div className="absolute top-2 right-3 text-[10px] text-neutral-400 font-mono tracking-wider">
        CRYPTOGRAPHIC LOCK
      </div>
    </div>
  );
}
