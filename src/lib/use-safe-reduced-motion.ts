"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * framer-motion's useReducedMotion reads matchMedia synchronously on first
 * render (not in an effect), so on the client it can already return the
 * real OS preference during hydration while SSR always defaults to false —
 * causing a hydration mismatch when the user has reduced motion enabled.
 * This defers to the real value only after mount.
 */
export function useSafeReducedMotion() {
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return mounted ? prefersReduced : false;
}
