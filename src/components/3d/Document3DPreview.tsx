"use client";

import React, { useEffect, useRef } from "react";

interface Document3DPreviewProps {
  className?: string;
  fileCount?: number;
}

/**
 * 3D Holographic File Card / Floating Documents for Files & Category pages
 * Renders multiple cascading 3D document planes in isometric perspective with
 * metadata lines, holographic sheen, and subtle float physics.
 */
export default function Document3DPreview({
  className = "",
  fileCount = 0,
}: Document3DPreviewProps) {
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
      const centerY = height / 2;
      const docW = 90;
      const docH = 120;
      const sheets = 3;

      for (let s = 0; s < sheets; s++) {
        const float = Math.sin(t + s * 0.7) * 4;
        const offsetX = (s - 1) * 24;
        const offsetY = (s - 1) * 16 + float;
        const x = centerX - docW / 2 + offsetX;
        const y = centerY - docH / 2 + offsetY;

        // Document Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 8, docW, docH, 8);
        ctx.fill();

        // Document Body
        ctx.beginPath();
        ctx.roundRect(x, y, docW, docH, 8);
        const cardGrad = ctx.createLinearGradient(x, y, x + docW, y + docH);
        cardGrad.addColorStop(0, s === sheets - 1 ? "rgba(40, 40, 40, 0.95)" : "rgba(25, 25, 25, 0.85)");
        cardGrad.addColorStop(1, "rgba(14, 14, 14, 0.95)");
        ctx.fillStyle = cardGrad;
        ctx.fill();
        ctx.strokeStyle = s === sheets - 1 ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Document Header Pill
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 14, 28, 6, 3);
        ctx.fillStyle = s === sheets - 1 ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.25)";
        ctx.fill();

        // Skeleton text lines
        const lines = 4;
        for (let l = 0; l < lines; l++) {
          const lw = docW - 24 - (l % 2 === 0 ? 10 : 25);
          ctx.beginPath();
          ctx.roundRect(x + 12, y + 32 + l * 12, lw, 3.5, 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.fill();
        }

        // Bottom Checksum Matrix Grid
        if (s === sheets - 1) {
          ctx.beginPath();
          ctx.roundRect(x + 12, y + docH - 26, docW - 24, 14, 4);
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.stroke();

          ctx.font = "700 7px monospace";
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fillText("AES-256 GCM", x + 16, y + docH - 17);
        }
      }

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
      className={`relative w-full h-[200px] flex items-center justify-center select-none overflow-hidden ${className}`}
      aria-label="3D Floating Document Visualizer"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div className="absolute top-2 right-3 text-[10px] text-neutral-400 font-mono tracking-wider">
        SPATIAL ASSET MATRIX
      </div>
    </div>
  );
}
