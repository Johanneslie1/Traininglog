import { useState, useEffect } from 'react';

interface UseScrollCollapseReturn {
  isCollapsed: boolean;
  scrollY: number;
}

export const useScrollCollapse = (threshold: number = 80): UseScrollCollapseReturn => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);
          setIsCollapsed(currentScrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isCollapsed, scrollY };
};
