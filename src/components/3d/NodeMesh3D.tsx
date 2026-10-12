"use client";

import React, { useEffect, useRef } from "react";

interface NodeMesh3DProps {
  className?: string;
  isSearching?: boolean;
}

/**
 * 3D Neural Discovery Orb / Connected Node Mesh for AI Search
 * Simulates a rotating 3D spherical point-cloud with interconnected semantic filaments,
 * pulsating query pulses, and reactive hover/search feedback.
 */
export default function NodeMesh3D({
  className = "",
  isSearching = false,
}: NodeMesh3DProps) {
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

    // Generate Fibonacci Sphere Nodes
    const nodeCount = 48;
    const nodes: { x: number; y: number; z: number }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      nodes.push({ x, y, z });
    }

    let rotY = 0;
    let rotX = 0.2;

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const speed = isSearching ? 0.025 : 0.007;
      if (!prefersReducedMotion) {
        rotY += speed;
        rotX += speed * 0.3;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.34;

      // Project all nodes
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = nodes.map((node) => {
        // Rotate Y
        const x1 = node.x * cosY + node.z * sinY;
        const z1 = -node.x * sinY + node.z * cosY;
        // Rotate X
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const fov = 3.2;
        const pz = z2 + fov;
        const factor = (radius * fov) / pz;
        return {
          sx: centerX + x1 * factor,
          sy: centerY + y2 * factor,
          z: z2,
        };
      });

      // Draw Edges between nearby nodes
      ctx.lineWidth = 0.7;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius * 0.75) {
            const edgeAlpha = Math.max(
              0.02,
              (1 - dist / (radius * 0.75)) * 0.25 * ((p1.z + p2.z) / 2 + 1.2) * 0.5
            );
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.strokeStyle = `rgba(255, 255, 255, ${edgeAlpha})`;
            ctx.stroke();
          }
        }
      }

      // Draw Nodes
      for (const p of projected) {
        const alpha = Math.max(0.15, 0.45 + p.z * 0.35);
        const nodeSize = Math.max(1.5, 2.2 + p.z * 1.0);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, nodeSize, 0, Math.PI * 2);
        ctx.fill();

        if (p.z > 0.6) {
          ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, nodeSize * 2.5, 0, Math.PI * 2);
          ctx.fill();
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
  }, [isSearching]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[220px] flex items-center justify-center select-none overflow-hidden ${className}`}
      aria-label="3D Neural Vector Discovery Orb"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div className="absolute top-2 right-3 text-[10px] text-neutral-400 font-mono tracking-wider">
        NEURAL VECTOR MESH
      </div>
    </div>
  );
}
