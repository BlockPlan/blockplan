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

    return () => observer.disconnect();
  }, []);

  return null;
}
