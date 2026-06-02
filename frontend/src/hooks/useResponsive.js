import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design detection
 * Follows MCP guidelines for responsive design
 * 
 * @returns {Object} Responsive state object with breakpoint information
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoints matching Tailwind CSS defaults
  const breakpoints = {
    sm: 640,   // Small devices (landscape phones)
    md: 768,   // Medium devices (tablets)
    lg: 1024,  // Large devices (desktops)
    xl: 1280,  // Extra large devices (large desktops)
    '2xl': 1536, // 2X Extra large devices
  };

  // Device type detection
  const isMobile = windowSize.width < breakpoints.md; // < 768px
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg; // 768px - 1023px
  const isDesktop = windowSize.width >= breakpoints.lg; // >= 1024px
  const isLargeDesktop = windowSize.width >= breakpoints.xl; // >= 1280px

  // Specific breakpoint checks
  const isSm = windowSize.width >= breakpoints.sm && windowSize.width < breakpoints.md;
  const isMd = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isLg = windowSize.width >= breakpoints.lg && windowSize.width < breakpoints.xl;
  const isXl = windowSize.width >= breakpoints.xl && windowSize.width < breakpoints['2xl'];
  const is2Xl = windowSize.width >= breakpoints['2xl'];

  return {
    windowSize,
    breakpoints,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    // Convenience methods
    isMobileOrTablet: isMobile || isTablet,
    isDesktopOrLarger: isDesktop,
  };
};

/**
 * Hook for media query matching
 * @param {string} query - Media query string (e.g., '(min-width: 768px)')
 * @returns {boolean} Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
};

export default useResponsive;
