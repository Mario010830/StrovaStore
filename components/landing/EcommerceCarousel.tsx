"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Icon } from "@/components/ui/Icon";

interface EcommerceCarouselProps {
  children: ReactNode[];
  ariaLabel: string;
  /** Ajusta el ancho de slide en landing (tiendas vs productos) por breakpoint. */
  variant?: "stores" | "products";
}

export function EcommerceCarousel({ children, ariaLabel, variant = "stores" }: EcommerceCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    let direction: 1 | -1 = 1;

    const timer = window.setInterval(() => {
      if (!emblaApi) return;

      if (direction === 1) {
        if (emblaApi.canScrollNext()) {
          emblaApi.scrollNext();
        } else if (emblaApi.canScrollPrev()) {
          direction = -1;
          emblaApi.scrollPrev();
        }
      } else if (emblaApi.canScrollPrev()) {
        emblaApi.scrollPrev();
      } else if (emblaApi.canScrollNext()) {
        direction = 1;
        emblaApi.scrollNext();
      }
    }, 3800);

    return () => window.clearInterval(timer);
  }, [emblaApi]);

  const variantClass =
    variant === "products" ? "landing-carousel--products" : "landing-carousel--stores";

  return (
    <div className={`landing-carousel ${variantClass}`} aria-label={ariaLabel}>
      <button
        type="button"
        className="landing-carousel__nav landing-carousel__nav--prev"
        aria-label="Anterior"
        onClick={() => emblaApi?.scrollPrev()}
      >
        <Icon name="chevron_left" />
      </button>

      <div className="landing-carousel__viewport" ref={emblaRef}>
        <div className="landing-carousel__container">
          {children.map((child, index) => (
            <div
              key={index}
              className={`landing-carousel__slide ${
                (() => {
                  const total = Math.max(children.length, 1);
                  const offset = (index - selectedIndex + total) % total;
                  if (offset === 1 || offset === 2) return "landing-carousel__slide--center";
                  if (offset === 0 || offset === 3) return "landing-carousel__slide--edge";
                  return "";
                })()
              }`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="landing-carousel__nav landing-carousel__nav--next"
        aria-label="Siguiente"
        onClick={() => emblaApi?.scrollNext()}
      >
        <Icon name="chevron_right" />
      </button>

    </div>
  );
}
