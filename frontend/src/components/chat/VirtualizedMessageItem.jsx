import { useState, useRef, useEffect } from "react";

function VirtualizedMessageItem({ children, estimatedHeight = 80 }) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: "400px 0px 400px 0px",
      }
    );

    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
  }, []);

  return (
    <div ref={elementRef} style={{ minHeight: isVisible ? "auto" : `${estimatedHeight}px` }}>
      {isVisible ? children : <div style={{ height: `${estimatedHeight}px` }} />}
    </div>
  );
}

export default VirtualizedMessageItem;
