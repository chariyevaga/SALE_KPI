import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '../i18n/locale-store';
import { Spinner } from './Spinner';

interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
  pending?: boolean;
}

const CONTAINER_SIZE = 280;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface Position {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function ImageCropper({
  imageSrc,
  onCancel,
  onCropped,
  pending = false,
}: ImageCropperProps) {
  const { t } = useTranslation();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const naturalSizeRef = useRef({ width: 0, height: 0 });
  const dragStateRef = useRef<{ startX: number; startY: number; origin: Position } | null>(null);

  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const displayScale = baseScale * zoom;

  function clampPosition(pos: Position, scale: number): Position {
    const displayedWidth = naturalSizeRef.current.width * scale;
    const displayedHeight = naturalSizeRef.current.height * scale;
    const minX = Math.min(0, CONTAINER_SIZE - displayedWidth);
    const minY = Math.min(0, CONTAINER_SIZE - displayedHeight);

    return {
      x: clamp(pos.x, minX, 0),
      y: clamp(pos.y, minY, 0),
    };
  }

  function handleImageLoad() {
    const img = imageRef.current;
    if (!img) return;

    const { naturalWidth, naturalHeight } = img;
    naturalSizeRef.current = { width: naturalWidth, height: naturalHeight };

    const cover = Math.max(CONTAINER_SIZE / naturalWidth, CONTAINER_SIZE / naturalHeight);
    setBaseScale(cover);
    setZoom(1);

    const displayedWidth = naturalWidth * cover;
    const displayedHeight = naturalHeight * cover;
    setPosition({
      x: (CONTAINER_SIZE - displayedWidth) / 2,
      y: (CONTAINER_SIZE - displayedHeight) / 2,
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = { startX: event.clientX, startY: event.clientY, origin: position };
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState) return;

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    const next = { x: dragState.origin.x + dx, y: dragState.origin.y + dy };
    setPosition(clampPosition(next, displayScale));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setIsDragging(false);
  }

  useEffect(() => {
    setPosition((prev) => clampPosition(prev, displayScale));
    // Re-clamp whenever zoom changes so the image never leaves gaps in the frame.
  }, [zoom]);

  function handleSave() {
    const img = imageRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = OUTPUT_SIZE / CONTAINER_SIZE;
    const displayedWidth = naturalSizeRef.current.width * displayScale;
    const displayedHeight = naturalSizeRef.current.height * displayScale;

    ctx.drawImage(
      img,
      position.x * ratio,
      position.y * ratio,
      displayedWidth * ratio,
      displayedHeight * ratio,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) onCropped(blob);
      },
      'image/jpeg',
      0.92,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800"
        style={{
          width: CONTAINER_SIZE,
          height: CONTAINER_SIZE,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt=""
          onLoad={handleImageLoad}
          draggable={false}
          className="absolute left-0 top-0 max-w-none"
          style={{
            width: naturalSizeRef.current.width * displayScale || undefined,
            height: naturalSizeRef.current.height * displayScale || undefined,
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
        {/* Circular crop guide overlay */}
        <div className="pointer-events-none absolute inset-0 shadow-[0_0_0_9999px_rgba(15,23,42,0.35)] rounded-full" />
      </div>

      <div className="flex items-center gap-3 px-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 flex-shrink-0 text-slate-400"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          aria-label={t('settings.zoom')}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-400 dark:bg-slate-700"
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 flex-shrink-0 text-slate-400"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        {t('settings.cropHint')}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 h-9 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex-1 h-9 rounded-lg bg-emerald-400 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center justify-center gap-2">
            {pending ? <Spinner /> : null}
            {pending ? t('settings.saving') : t('settings.cropSave')}
          </span>
        </button>
      </div>
    </div>
  );
}
