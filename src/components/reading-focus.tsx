"use client";

import { useEffect } from "react";

/**
 * Reading Experience: destaca a seção visível e reduz levemente a
 * opacidade das demais. Usa IntersectionObserver (zero re-render React,
 * transições feitas em CSS).
 */
export function ReadingFocus() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]")
    );
    if (sections.length === 0) return;

    document.body.classList.add("reading-flow");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        }
      },
      // banda central da viewport
      { rootMargin: "-30% 0px -30% 0px" }
    );

    sections.forEach((s) => observer.observe(s));

    return () => {
      observer.disconnect();
      document.body.classList.remove("reading-flow");
    };
  }, []);

  return null;
}
