import { useEffect, useRef } from "react";

export function useIntersectionObserver(callback, options = {}) {
  const elementRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callbackRef.current(entry);
        }
      });
    }, options);

    observer.observe(element);
    return () => {
      observer.unobserve(element);
    };
  }, [options.root, options.rootMargin, options.threshold]);

  return elementRef;
}
