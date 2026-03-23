"use client";

import { useEffect } from "react";

/**
 * Tiny client component that uses IntersectionObserver to add
 * the `is-visible` class to `.landing-reveal` elements when
 * they scroll into view. No heavy JS libraries required.
 */
export default function ScrollReveal() {
  useEffect(() => {
    /* Scroll-reveal for sections */
    const elements = document.querySelectorAll(".landing-reveal");
    let observer: IntersectionObserver | null = null;

    if (elements.length) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
      elements.forEach((el) => observer!.observe(el));
    }

    /* Hero mockup: fade out and collapse as user scrolls */
    const mockup = document.querySelector(".landing-hero-mockup") as HTMLElement | null;
    const mockupHeight = mockup?.offsetHeight ?? 0;
    const onScroll = mockup
      ? () => {
          const scrollY = window.scrollY;
          const fadeEnd = 100;
          if (scrollY <= 0) {
            mockup.style.opacity = "1";
            mockup.style.maxHeight = mockupHeight + "px";
            mockup.style.marginTop = "4rem";
            mockup.style.overflow = "visible";
          } else if (scrollY >= fadeEnd) {
            mockup.style.opacity = "0";
            mockup.style.maxHeight = "0px";
            mockup.style.marginTop = "0px";
            mockup.style.overflow = "hidden";
          } else {
            const progress = scrollY / fadeEnd;
            mockup.style.opacity = String(1 - progress);
            mockup.style.maxHeight = mockupHeight * (1 - progress) + "px";
            mockup.style.marginTop = 4 * (1 - progress) + "rem";
            mockup.style.overflow = "hidden";
          }
        }
      : null;

    if (onScroll) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      observer?.disconnect();
      if (onScroll) window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
