"use client";

import React, { useEffect, useRef } from "react";

interface Bridge3DConduitProps {
  connected?: boolean;
  className?: string;
}

/**
 * 3D Dual-Node Bridge / Encrypted Data Stream Conduit
 * Visualizes the secure MTProto pipeline between the client and Telegram Saved Messages.
 * Features rotating twin nodes, dynamic bridge cables, and encrypted data packets traveling along 3D splines.
 */
export default function Bridge3DConduit({
  connected = false,
  className = "",
}: Bridge3DConduitProps) {
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

    // Stream packet particles
    const packets = Array.from({ length: 8 }).map((_, i) => ({
      progress: i / 8,
      speed: 0.006 + (i % 3) * 0.002,
      offsetY: ((i % 3) - 1) * 8,
    }));

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

      const centerY = height / 2;
      const nodeLeftX = width * 0.22;
      const nodeRightX = width * 0.78;
      const nodeRadius = Math.min(width * 0.07, 36);

      // 1. Draw Connecting 3D Bridge Catenary Cables
      const cableCount = 3;
      for (let c = 0; c < cableCount; c++) {
        const sag = 20 + c * 10;
        const wave = Math.sin(t + c) * 4;

        ctx.beginPath();
        ctx.moveTo(nodeLeftX, centerY);
        ctx.bezierCurveTo(
          nodeLeftX + (nodeRightX - nodeLeftX) * 0.35,
          centerY + sag + wave,
          nodeLeftX + (nodeRightX - nodeLeftX) * 0.65,
          centerY + sag + wave,
          nodeRightX,
          centerY
        );
        ctx.strokeStyle = connected
          ? `rgba(255, 255, 255, ${0.15 + c * 0.08})`
          : `rgba(255, 255, 255, 0.06)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 2. Animated Encrypted Packet Pulses
      if (connected) {
        for (const packet of packets) {
          if (!prefersReducedMotion) {
            packet.progress = (packet.progress + packet.speed) % 1;
          }
          const p = packet.progress;
          // Cubic Bezier interpolation
          const p0 = { x: nodeLeftX, y: centerY };
          const p1 = { x: nodeLeftX + (nodeRightX - nodeLeftX) * 0.35, y: centerY + 25 };
          const p2 = { x: nodeLeftX + (nodeRightX - nodeLeftX) * 0.65, y: centerY + 25 };
          const p3 = { x: nodeRightX, y: centerY };

          const cx =
            Math.pow(1 - p, 3) * p0.x +
            3 * Math.pow(1 - p, 2) * p * p1.x +
            3 * (1 - p) * Math.pow(p, 2) * p2.x +
            Math.pow(p, 3) * p3.x;
          const cy =
            Math.pow(1 - p, 3) * p0.y +
            3 * Math.pow(1 - p, 2) * p * p1.y +
            3 * (1 - p) * Math.pow(p, 2) * p2.y +
            Math.pow(p, 3) * p3.y +
            packet.offsetY;

          // Packet particle
          ctx.beginPath();
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fill();

          // Particle halo
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
          ctx.fill();
        }
      }

      // 3. Render Node A (StorageVault Core Node)
      const drawNode = (
        x: number,
        y: number,
        label: string,
        sublabel: string,
        isTelegram: boolean
      ) => {
        // Outer Pulsing Orbit Ring
        const ringScale = Math.sin(t * 1.5 + (isTelegram ? Math.PI : 0)) * 2;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius + 8 + ringScale, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node Body
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, nodeRadius);
        grad.addColorStop(0, "rgba(45, 45, 45, 0.95)");
        grad.addColorStop(1, "rgba(16, 16, 16, 0.95)");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = connected ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner Core Ring
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = connected ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.25)";
        ctx.fill();

        // Labels
        ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(label, x, y + nodeRadius + 22);

        ctx.font = "400 9px monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fillText(sublabel, x, y + nodeRadius + 36);
      };

      drawNode(nodeLeftX, centerY, "StorageVault", "AES-256 SESSION", false);
      drawNode(
        nodeRightX,
        centerY,
        "Saved Messages",
        connected ? "MTPROTO LINKED" : "AWAITING AUTH",
        true
      );

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
  }, [connected]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[220px] flex items-center justify-center select-none overflow-hidden ${className}`}
      aria-label="3D Encrypted MTProto Bridge Conduit"
    >
      <canvas ref={canvasRef} className="block pointer-events-none" />
      <div className="absolute top-2 right-3 text-[10px] text-neutral-400 font-mono tracking-wider">
        MTPROTO CONDUIT
      </div>
    </div>
  );
}
