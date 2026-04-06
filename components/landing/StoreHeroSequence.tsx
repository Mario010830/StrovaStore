"use client";

import { useEffect, useMemo, useRef } from "react";

const TOTAL_FRAMES = 240;
const FRAME_BASE_PATH = "/Store%20Frames";
/** Duración de un ciclo completo (240 frames) en ms — sensación de “armado” sin ser demasiado lento. */
const LOOP_DURATION_MS = 11_000;

export function StoreHeroSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedFramesRef = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const loopStartRef = useRef<number | null>(null);

  const frameUrls = useMemo(
    () =>
      Array.from({ length: TOTAL_FRAMES }, (_, index) => {
        const frameNumber = String(index + 1).padStart(3, "0");
        return `${FRAME_BASE_PATH}/ezgif-frame-${frameNumber}.jpg`;
      }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pickNearestLoaded = (target: number) => {
      const frames = loadedFramesRef.current;
      if (frames[target]) return frames[target];
      for (let distance = 1; distance < TOTAL_FRAMES; distance += 1) {
        const left = target - distance;
        const right = target + distance;
        if (left >= 0 && frames[left]) return frames[left];
        if (right < TOTAL_FRAMES && frames[right]) return frames[right];
      }
      return null;
    };

    const drawFrame = (frameIndex: number) => {
      const image = pickNearestLoaded(frameIndex);
      if (!image) return;

      const parent = canvas.parentElement;
      const cssWidth = parent?.clientWidth || canvas.clientWidth || window.innerWidth;
      const cssHeight = parent?.clientHeight || canvas.clientHeight || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      const width = Math.max(1, Math.floor(cssWidth));
      const height = Math.max(1, Math.floor(cssHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const scale = Math.min(width / image.width, height / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const x = (width - drawWidth) / 2;
      const y = height - drawHeight;

      ctx.drawImage(image, x, y, drawWidth, drawHeight);
    };

    const tick = (now: number) => {
      if (reduceMotion) {
        currentFrameRef.current = 0;
        drawFrame(0);
        return;
      }

      if (loopStartRef.current === null) loopStartRef.current = now;
      const elapsed = (now - loopStartRef.current) % LOOP_DURATION_MS;
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor((elapsed / LOOP_DURATION_MS) * TOTAL_FRAMES),
      );
      currentFrameRef.current = frameIndex;
      drawFrame(frameIndex);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    const images = frameUrls.map((src, index) => {
      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => {
        loadedFramesRef.current[index] = img;
        if (index === 0 || index === currentFrameRef.current) {
          drawFrame(currentFrameRef.current);
        }
      };
      img.src = src;
      return img;
    });

    const resizeObserver = new ResizeObserver(() => {
      drawFrame(currentFrameRef.current);
    });
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const onResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener("resize", onResize);

    if (reduceMotion) {
      drawFrame(0);
    } else {
      rafRef.current = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      loopStartRef.current = null;
      images.forEach((img) => {
        img.onload = null;
      });
    };
  }, [frameUrls]);

  return (
    <canvas
      ref={canvasRef}
      className="landing-hero__sequence-canvas"
      aria-hidden
      role="presentation"
    />
  );
}
