"use client";

import React, { useEffect, useRef } from "react";

interface Storage3DStackProps {
  usedBytes?: number;
  totalBytes?: number;
  className?: string;
}

/**
 * 3D Layered Storage Stack - Isometric Volume Visualizer for Dashboard
 * Renders multiple floating storage tiers (Platters / Cylinders) representing
 * files, chunks, and encrypted storage capacity with depth shading.
 */
export default function Storage3DStack({
  usedBytes = 0,
  totalBytes = 100 * 1024 * 1024 * 1024, // 100GB default or dynamic
  className = "",
}: Storage3DStackProps) {
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

    let time = 0;
    const layerCount = 4;

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        time += 0.02;
      }

      const centerX = width / 2;
      const centerY = height / 2 + 10;
      const radiusX = Math.min(width * 0.38, 140);
      const radiusY = radiusX * 0.46; // Isometric pitch
      const layerSpacing = 28;

      // Draw layered platters from bottom to top
      for (let i = 0; i < layerCount; i++) {
        const floatOffset = Math.sin(time + i * 0.8) * 3;
        const layerY = centerY - (i - layerCount / 2) * layerSpacing + floatOffset;
        const thickness = 14;

        // Platter 3D Extrusion (Side Wall)
        ctx.beginPath();
        ctx.ellipse(centerX, layerY + thickness, radiusX, radiusY, 0, 0, Math.PI);
        ctx.lineTo(centerX + radiusX, layerY);
        ctx.ellipse(centerX, layerY, radiusX, radiusY, 0, Math.PI, 0, true);
        ctx.closePath();

        const sideGrad = ctx.createLinearGradient(
          centerX - radiusX,
          layerY,
          centerX + radiusX,
          layerY
        );
        sideGrad.addColorStop(0, "rgba(255, 255, 255, 0.03)");
        sideGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.12)");
        sideGrad.addColorStop(1, "rgba(255, 255, 255, 0.04)");
        ctx.fillStyle = sideGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Top Disk Face
        ctx.beginPath();
        ctx.ellipse(centerX, layerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        const topGrad = ctx.createRadialGradient(
          centerX,
          layerY,
          10,
          centerX,
          layerY,
          radiusX
        );
        topGrad.addColorStop(0, i === layerCount - 1 ? "rgba(255, 255, 255, 0.18)" : "rgba(35, 35, 35, 0.9)");
        topGrad.addColorStop(1, "rgba(18, 18, 18, 0.95)");
        ctx.fillStyle = topGrad;
        ctx.fill();
        ctx.strokeStyle = i === layerCount - 1 ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Concentric track details on disk top
        ctx.beginPath();
        ctx.ellipse(centerX, layerY, radiusX * 0.75, radiusY * 0.75, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(centerX, layerY, radiusX * 0.45, radiusY * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
        ctx.stroke();

        // Center Spindle Hole
        ctx.beginPath();
        ctx.ellipse(centerX, layerY, radiusX * 0.18, radiusY * 0.18, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(10, 10, 10, 0.95)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.stroke();
      }

      // Vertical Central Optical Spindle Beam
      const topDiskY = centerY - (layerCount - 1 - layerCount / 2) * layerSpacing + Math.sin(time + (layerCount - 1) * 0.8) * 3;
      const bottomDiskY = centerY - (0 - layerCount / 2) * layerSpacing + 14 + Math.sin(time) * 3;

      ctx.beginPath();
      ctx.moveTo(centerX, topDiskY - 20);
      ctx.lineTo(centerX, bottomDiskY + 10);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top Beacon Ring
      ctx.beginPath();
      ctx.arc(centerX, topDiskY - 20, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

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
  }, [usedBytes, totalBytes]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[220px] flex items-center justify-center select-none overflow-hidden ${className}`}
      aria-label="3D Storage Stack Visualizer"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div className="absolute top-2 right-3 text-[10px] text-neutral-400 font-mono tracking-wider">
        SPATIAL DRIVE ARRAY
      </div>
    </div>
  );
}
