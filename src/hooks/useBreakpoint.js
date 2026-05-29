import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState({
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    width: window.innerWidth,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setBreakpoint({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
      });
    };

    window.addEventListener('resize', handleResize);
    // Trigger initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}
