"use client";

import React, { useEffect, useRef } from "react";

interface VaultEmblem3DProps {
  className?: string;
  size?: number;
}

/**
 * Minimalist 3D Monochrome Vault Emblem for Auth Pages
 * Precision concentric rotating rings with faceted geometry and soft radial glow.
 */
export default function VaultEmblem3D({
  className = "",
  size = 80,
}: VaultEmblem3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

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
      ctx.clearRect(0, 0, size, size);

      if (!prefersReducedMotion) {
        angle += 0.02;
      }

      const center = size / 2;
      const outerR = size * 0.42;

      // Outer Ring
      ctx.beginPath();
      ctx.arc(center, center, outerR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating Teeth / Notches
      const teeth = 8;
      for (let i = 0; i < teeth; i++) {
        const theta = angle + (i / teeth) * Math.PI * 2;
        const x1 = center + Math.cos(theta) * (outerR - 3);
        const y1 = center + Math.sin(theta) * (outerR - 3);
        const x2 = center + Math.cos(theta) * (outerR + 3);
        const y2 = center + Math.sin(theta) * (outerR + 3);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Middle Ring (Reverse rotation)
      ctx.beginPath();
      ctx.arc(center, center, outerR * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Middle Hexagon
      ctx.beginPath();
      for (let h = 0; h < 6; h++) {
        const hTheta = -angle * 0.8 + (h / 6) * Math.PI * 2;
        const hx = center + Math.cos(hTheta) * (outerR * 0.45);
        const hy = center + Math.sin(hTheta) * (outerR * 0.45);
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Center Solid Core
      ctx.beginPath();
      ctx.arc(center, center, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [size]);

  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <canvas ref={canvasRef} className="block pointer-events-none" />
    </div>
  );
}
