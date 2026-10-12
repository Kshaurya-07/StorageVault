"use client";

import React, { useEffect, useRef } from "react";

interface DataPillar3DProps {
  className?: string;
  categories?: { name: string; count: number; size: number }[];
}

/**
 * 3D Segmented Data Pillar / Isometric Volume Visualizer for Analytics
 * Displays 3D extruded isometric data columns representing file distributions,
 * storage quotas, and encrypted chunk densities with depth shading.
 */
export default function DataPillar3D({
  className = "",
  categories = [],
}: DataPillar3DProps) {
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

    let t = 0;

    // Pillar heights data
    const pillars = [
      { label: "DOCS", baseHeight: 65 },
      { label: "MEDIA", baseHeight: 110 },
      { label: "AUDIO", baseHeight: 45 },
      { label: "ARCH", baseHeight: 85 },
      { label: "OTHER", baseHeight: 50 },
    ];

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        t += 0.02;
      }

      const centerX = width / 2;
      const baseY = height * 0.78;
      const pillarCount = pillars.length;
      const spacing = Math.min(width * 0.16, 68);
      const colWidth = 26;
      const colDepth = 14;

      // Draw Isometric Grid Ground
      ctx.beginPath();
      const gridSpan = spacing * 2.8;
      for (let g = -3; g <= 3; g++) {
        const gx = centerX + g * (spacing * 0.45);
        ctx.moveTo(gx - gridSpan * 0.3, baseY + g * 8);
        ctx.lineTo(gx + gridSpan * 0.3, baseY + g * 8 + 24);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw each 3D Column
      pillars.forEach((p, idx) => {
        const offsetIndex = idx - (pillarCount - 1) / 2;
        const cx = centerX + offsetIndex * spacing;
        const wave = Math.sin(t + idx * 0.9) * 4;
        const h = p.baseHeight + wave;
        const topY = baseY - h;

        // Front Face
        ctx.beginPath();
        ctx.rect(cx - colWidth / 2, topY, colWidth, h);
        const frontGrad = ctx.createLinearGradient(0, topY, 0, baseY);
        frontGrad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
        frontGrad.addColorStop(1, "rgba(255, 255, 255, 0.04)");
        ctx.fillStyle = frontGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Right 3D Extruded Side Face
        ctx.beginPath();
        ctx.moveTo(cx + colWidth / 2, topY);
        ctx.lineTo(cx + colWidth / 2 + colDepth, topY - colDepth * 0.5);
        ctx.lineTo(cx + colWidth / 2 + colDepth, baseY - colDepth * 0.5);
        ctx.lineTo(cx + colWidth / 2, baseY);
        ctx.closePath();
        const sideGrad = ctx.createLinearGradient(0, topY, 0, baseY);
        sideGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        sideGrad.addColorStop(1, "rgba(255, 255, 255, 0.02)");
        ctx.fillStyle = sideGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.stroke();

        // Top Isometric Cap
        ctx.beginPath();
        ctx.moveTo(cx - colWidth / 2, topY);
        ctx.lineTo(cx - colWidth / 2 + colDepth, topY - colDepth * 0.5);
        ctx.lineTo(cx + colWidth / 2 + colDepth, topY - colDepth * 0.5);
        ctx.lineTo(cx + colWidth / 2, topY);
        ctx.closePath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.stroke();

        // Column Label below
        ctx.font = "600 10px monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.textAlign = "center";
        ctx.fillText(p.label, cx, baseY + 18);
      });

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
      aria-label="3D Isometric Volume Visualizer"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div className="absolute top-2 right-3 text-[10px] text-neutral-400 font-mono tracking-wider">
        ISOMETRIC VOLUME MATRIX
      </div>
    </div>
  );
}
