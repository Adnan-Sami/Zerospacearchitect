import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
}

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[idx];

  return (
    <section className="relative h-[280px] w-full overflow-hidden bg-muted md:h-[420px]">
      {slide.image_url && (
        <img src={slide.image_url} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4">
        <div className="max-w-2xl text-white">
          <h2 className="mb-3 text-2xl font-bold md:text-4xl">{slide.title}</h2>
          {slide.subtitle && <p className="mb-5 text-base text-white/90 md:text-lg">{slide.subtitle}</p>}
          {slide.link_url && (
            <a href={slide.link_url}>
              <Button size="lg">আরও দেখুন</Button>
            </a>
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="আগের"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="পরের"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                aria-label={`স্লাইড ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
