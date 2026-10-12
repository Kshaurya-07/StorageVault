"use client";

import React, { useEffect, useRef, useState } from "react";

interface Vault3DCoreProps {
  className?: string;
}

/**
 * 3D Vault Core - Precision Wireframe Isometric Vault
 * Features rotating concentric rings, faceted vault core, orbiting data planes,
 * mouse parallax response, and strict performance guards (IntersectionObserver,
 * visibilitychange, prefers-reduced-motion).
 */
export default function Vault3DCore({ className = "" }: Vault3DCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Handle Resize
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

    // Visibility Observer
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // Tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
      } else {
        isVisibleRef.current = true;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Mouse parallax
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseRef.current.targetX = nx * 0.4;
      mouseRef.current.targetY = ny * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 3D Geometry definitions
    // Inner Cube Vertices
    const cubeVertices = [
      [-1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
    ];

    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // back face
      [4, 5], [5, 6], [6, 7], [7, 4], // front face
      [0, 4], [1, 5], [2, 6], [3, 7], // connecting edges
    ];

    // Octahedron core inside
    const octaVertices = [
      [0, -1.6, 0],
      [0, 1.6, 0],
      [-1.3, 0, 0],
      [1.3, 0, 0],
      [0, 0, -1.3],
      [0, 0, 1.3],
    ];

    const octaEdges = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [4, 3], [3, 5], [5, 2],
    ];

    // Orbiting data plane nodes
    const dataNodes = Array.from({ length: 16 }).map((_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 2.4 + (i % 3) * 0.3;
      const y = ((i % 5) - 2) * 0.5;
      return { angle, radius, y, speed: 0.008 + (i % 2) * 0.004 };
    });

    let angleX = 0.35;
    let angleY = 0.55;
    let angleZ = 0;

    // Projection Helper
    const project = (
      x: number,
      y: number,
      z: number,
      scale: number,
      centerX: number,
      centerY: number
    ): [number, number, number] => {
      // Perspective factor
      const fov = 4.5;
      const pz = z + fov;
      const factor = pz > 0.1 ? (scale * fov) / pz : scale;
      return [centerX + x * factor, centerY + y * factor, z];
    };

    // Matrix rotation
    const rotatePoint = (
      p: number[],
      ax: number,
      ay: number,
      az: number
    ): [number, number, number] => {
      let [x, y, z] = p;

      // Rotate Y
      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotate X
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Rotate Z
      const cosZ = Math.cos(az);
      const sinZ = Math.sin(az);
      const x3 = x1 * cosZ - y2 * sinZ;
      const y3 = x1 * sinZ + y2 * cosZ;

      return [x3, y3, z2];
    };

    // Animation Loop
    const render = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse follow
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      if (!prefersReducedMotion) {
        angleY += 0.006;
        angleX = 0.3 + mouseRef.current.y * 0.6;
        angleZ = mouseRef.current.x * 0.4;
      } else {
        angleY = 0.4;
        angleX = 0.3;
        angleZ = 0;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const baseScale = Math.min(width, height) * 0.22;

      // Draw subtle background radial depth
      const grad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        baseScale * 2.2
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 0.04)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.01)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseScale * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 1. Concentric Gyroscope Rings (3D Circles)
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = 2.8 - r * 0.5;
        const ringAngleX = angleX + (r * Math.PI) / 4;
        const ringAngleY = angleY * (r % 2 === 0 ? 1 : -0.8) + (r * Math.PI) / 3;
        const segments = 48;
        ctx.beginPath();

        let firstPoint: [number, number] | null = null;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const px = Math.cos(theta) * ringRadius;
          const pz = Math.sin(theta) * ringRadius;
          const rot = rotatePoint([px, 0, pz], ringAngleX, ringAngleY, 0);
          const [sx, sy] = project(rot[0], rot[1], rot[2], baseScale, centerX, centerY);

          if (s === 0) {
            ctx.moveTo(sx, sy);
            firstPoint = [sx, sy];
          } else {
            ctx.lineTo(sx, sy);
          }
        }
        if (firstPoint) ctx.lineTo(firstPoint[0], firstPoint[1]);

        ctx.strokeStyle = r === 0 ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = r === 0 ? 1.2 : 0.8;
        ctx.stroke();
      }

      // 2. Render Outer Cube (Vault Skeleton)
      const transformedCube = cubeVertices.map((v) =>
        rotatePoint([v[0] * 1.5, v[1] * 1.5, v[2] * 1.5], angleX, angleY, angleZ)
      );
      const projectedCube = transformedCube.map((v) =>
        project(v[0], v[1], v[2], baseScale, centerX, centerY)
      );

      // Draw Cube Edges
      ctx.beginPath();
      for (const [i, j] of cubeEdges) {
        ctx.moveTo(projectedCube[i][0], projectedCube[i][1]);
        ctx.lineTo(projectedCube[j][0], projectedCube[j][1]);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Draw Cube Corner Nodes
      for (const [x, y, z] of projectedCube) {
        const alpha = Math.max(0.1, 0.4 + z * 0.15);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Render Inner Octahedron (Cryptographic Core)
      const transformedOcta = octaVertices.map((v) =>
        rotatePoint(v, -angleX * 1.2, -angleY * 1.4, angleZ)
      );
      const projectedOcta = transformedOcta.map((v) =>
        project(v[0], v[1], v[2], baseScale, centerX, centerY)
      );

      ctx.beginPath();
      for (const [i, j] of octaEdges) {
        ctx.moveTo(projectedOcta[i][0], projectedOcta[i][1]);
        ctx.lineTo(projectedOcta[j][0], projectedOcta[j][1]);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw Octahedron Core Vertices
      for (const [x, y, z] of projectedOcta) {
        const alpha = Math.max(0.2, 0.6 + z * 0.2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Center Radiant Pulse Node
      const centerPulse = project(0, 0, 0, baseScale, centerX, centerY);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(centerPulse[0], centerPulse[1], 4, 0, Math.PI * 2);
      ctx.fill();

      // Outer Glow of center node
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.arc(centerPulse[0], centerPulse[1], 12, 0, Math.PI * 2);
      ctx.fill();

      // 5. Orbiting Data Stream Nodes
      for (let i = 0; i < dataNodes.length; i++) {
        const node = dataNodes[i];
        if (!prefersReducedMotion) {
          node.angle += node.speed;
        }
        const nx = Math.cos(node.angle) * node.radius;
        const nz = Math.sin(node.angle) * node.radius;
        const rot = rotatePoint([nx, node.y, nz], angleX * 0.5, angleY * 0.8, 0);
        const [sx, sy, sz] = project(rot[0], rot[1], rot[2], baseScale, centerX, centerY);

        const nodeAlpha = Math.max(0.15, 0.35 + sz * 0.15);
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();

        // Connect every 4th node to center
        if (i % 4 === 0) {
          ctx.beginPath();
          ctx.moveTo(centerPulse[0], centerPulse[1]);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `rgba(255, 255, 255, ${nodeAlpha * 0.3})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
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
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[340px] flex items-center justify-center select-none overflow-hidden ${className}`}
      aria-label="StorageVault 3D Cryptographic Core"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-neutral-900/80 border border-white/10 text-[10px] text-neutral-400 font-mono tracking-widest uppercase backdrop-blur-md pointer-events-none">
        AES-256 MTProto Vault Core
      </div>
    </div>
  );
}
