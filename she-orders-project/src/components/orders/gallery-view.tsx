"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OrderItem } from "@/lib/types";

const avatarColors = [
  "#FCE7F3",
  "#EDE9FE",
  "#DBEAFE",
  "#DCFCE7",
  "#FEF3C7",
  "#FFE4E6",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

type LightboxState = { itemIndex: number; imageIndex: number };

const ZOOM_STEP = 0.4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function GalleryView({ items }: { items: OrderItem[] }) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  // Tracks active drag gesture
  const dragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  } | null>(null);
  // Survives from mouseup → click so we can suppress zoom-toggle after a drag
  const wasDragRef = useRef(false);

  const closeLightbox = useCallback(() => {
    setLightbox(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const prevImage = useCallback(() => {
    setLightbox((prev) => {
      if (!prev) return null;
      return prev.imageIndex > 0 ? { ...prev, imageIndex: prev.imageIndex - 1 } : prev;
    });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const nextImage = useCallback(() => {
    setLightbox((prev) => {
      if (!prev) return null;
      const urls = items[prev.itemIndex].order_image_urls ?? [];
      return prev.imageIndex < urls.length - 1
        ? { ...prev, imageIndex: prev.imageIndex + 1 }
        : prev;
    });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [items]);

  useEffect(() => {
    if (!lightbox) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") nextImage();
      if (e.key === "ArrowRight") prevImage();
      if (e.key === "+") setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(1), MAX_ZOOM));
      if (e.key === "-")
        setZoom((z) => {
          const next = Math.max(+(z - ZOOM_STEP).toFixed(1), MIN_ZOOM);
          if (next <= MIN_ZOOM) setPan({ x: 0, y: 0 });
          return next;
        });
      if (e.key === "0") resetZoom();
    }
    function handleWheel(e: WheelEvent) {
      if (!imgRef.current) return;
      const area = imgRef.current.closest(".lightbox-img-scroll");
      if (!area?.contains(e.target as Node)) return;
      e.preventDefault();
      setZoom((z) => {
        const next = e.deltaY < 0
          ? +(z + ZOOM_STEP).toFixed(1)
          : +(z - ZOOM_STEP).toFixed(1);
        const clamped = Math.min(Math.max(next, MIN_ZOOM), MAX_ZOOM);
        if (clamped <= MIN_ZOOM) setPan({ x: 0, y: 0 });
        return clamped;
      });
    }
    window.addEventListener("keydown", handleKey);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [lightbox, closeLightbox, prevImage, nextImage, resetZoom]);

  function handleDragStart(e: React.MouseEvent) {
    if (zoom <= 1) return;
    e.preventDefault();
    dragRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      moved: false,
    };
    setIsDragging(true);
  }

  function handleDragMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startMouseX;
    const dy = e.clientY - dragRef.current.startMouseY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    setPan({
      x: dragRef.current.startPanX + dx,
      y: dragRef.current.startPanY + dy,
    });
  }

  function handleDragEnd() {
    if (!dragRef.current) return;
    wasDragRef.current = dragRef.current.moved;
    dragRef.current = null;
    setIsDragging(false);
  }

  function handleAreaClick() {
    if (wasDragRef.current) {
      wasDragRef.current = false;
      return;
    }
    setZoom((z) => {
      if (z >= MAX_ZOOM) {
        setPan({ x: 0, y: 0 });
        return MIN_ZOOM;
      }
      return +(z + ZOOM_STEP).toFixed(1);
    });
  }

  const itemsWithImages = items.filter((i) => (i.order_image_urls?.length ?? 0) > 0);

  if (itemsWithImages.length === 0) {
    return (
      <div className="gallery-empty-state">
        <p>لا توجد صور طلبيات مرفوعة حتى الآن</p>
        <p className="gallery-empty-hint">
          ارفعي الصور من خانة &quot;صور الطلبية&quot; في جدول البنات
        </p>
      </div>
    );
  }

  const currentItem = lightbox !== null ? items[lightbox.itemIndex] : null;
  const currentUrls = currentItem?.order_image_urls ?? [];
  const currentUrl = lightbox !== null ? currentUrls[lightbox.imageIndex] : null;
  const hasPrev = lightbox !== null && lightbox.imageIndex > 0;
  const hasNext = lightbox !== null && lightbox.imageIndex < currentUrls.length - 1;

  const areaCursor = zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in";

  return (
    <>
      <div className="gallery-grid">
        {items.map((item, itemIndex) => {
          const urls = item.order_image_urls ?? [];
          if (urls.length === 0) return null;
          return (
            <div key={item.id} className="gallery-girl-card">
              <div className="gallery-girl-header">
                <span
                  className="girl-avatar"
                  style={{
                    backgroundColor: avatarColors[itemIndex % avatarColors.length],
                    width: 36,
                    height: 36,
                    fontSize: 14,
                  }}
                >
                  {getInitials(item.name)}
                </span>
                <span className="gallery-girl-name">{item.name}</span>
                <span className="gallery-count-badge">{urls.length} صورة</span>
              </div>

              <div className="gallery-images-scroll">
                {urls.map((url, imageIndex) => (
                  <button
                    key={imageIndex}
                    className="gallery-thumb-btn"
                    onClick={() => setLightbox({ itemIndex, imageIndex })}
                    title={`صورة ${imageIndex + 1} — انقر للتكبير`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`صورة ${imageIndex + 1}`}
                      className="gallery-thumb-img"
                    />
                    <span className="gallery-zoom-hint">🔍</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {lightbox !== null && currentUrl && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <span className="lightbox-title">
                {currentItem?.name} — صورة {lightbox.imageIndex + 1} / {currentUrls.length}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  className="lightbox-zoom-btn"
                  onClick={() =>
                    setZoom((z) => {
                      const next = Math.max(+(z - ZOOM_STEP).toFixed(1), MIN_ZOOM);
                      if (next <= MIN_ZOOM) setPan({ x: 0, y: 0 });
                      return next;
                    })
                  }
                  disabled={zoom <= MIN_ZOOM}
                  title="تصغير (−)"
                >
                  −
                </button>
                <span
                  className="lightbox-zoom-label"
                  onClick={resetZoom}
                  title="إعادة الحجم الأصلي"
                >
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="lightbox-zoom-btn"
                  onClick={() =>
                    setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(1), MAX_ZOOM))
                  }
                  disabled={zoom >= MAX_ZOOM}
                  title="تكبير (+)"
                >
                  +
                </button>
                <button className="lightbox-close-btn" onClick={closeLightbox}>
                  ✕
                </button>
              </div>
            </div>

            <div className="lightbox-image-area">
              <button
                className="lightbox-nav-btn"
                onClick={prevImage}
                disabled={!hasPrev}
                title="السابقة"
              >
                ›
              </button>

              <div
                className="lightbox-img-scroll"
                style={{ cursor: areaCursor }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onClick={handleAreaClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={currentUrl}
                  alt="صورة مكبرة"
                  className="lightbox-main-img"
                  draggable={false}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                />
              </div>

              <button
                className="lightbox-nav-btn"
                onClick={nextImage}
                disabled={!hasNext}
                title="التالية"
              >
                ‹
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
