"use client";

import { useEffect } from "react";

/**
 * Tiny client component that uses IntersectionObserver to add
 * the `is-visible` class to `.landing-reveal` elements when
 * they scroll into view. No heavy JS libraries required.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".landing-reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));

    /* Hero mockup: fade out quickly as user scrolls */
    const mockup = document.querySelector(".landing-hero-mockup") as HTMLElement | null;
    if (mockup) {
      const onScroll = () => {
        const scrollY = window.scrollY;
        const fadeStart = 50;
        const fadeEnd = 300;
        if (scrollY <= fadeStart) {
          mockup.style.opacity = "1";
          mockup.style.transform = "translateY(0)";
        } else if (scrollY >= fadeEnd) {
          mockup.style.opacity = "0";
          mockup.style.transform = "translateY(-30px)";
        } else {
          const progress = (scrollY - fadeStart) / (fadeEnd - fadeStart);
          mockup.style.opacity = String(1 - progress);
          mockup.style.transform = `translateY(${-30 * progress}px)`;
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        observer.disconnect();
        window.removeEventListener("scroll", onScroll);
      };
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
