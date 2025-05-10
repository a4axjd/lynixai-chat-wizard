
import * as React from "react";

// Breakpoint sizes in pixels
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export type BreakpointSize = keyof typeof BREAKPOINTS;

/**
 * Hook to check if viewport is below a specific breakpoint
 * @param breakpoint - The breakpoint to check against (default: "md")
 * @returns Boolean indicating if the viewport is below the specified breakpoint
 */
export function useIsMobile(breakpoint: BreakpointSize = "md") {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const breakpointValue = BREAKPOINTS[breakpoint];
    
    // Set initial value
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpointValue);
    };
    
    // Check on initial render
    checkIsMobile();
    
    // Add event listener for window resize
    const mql = window.matchMedia(`(max-width: ${breakpointValue - 1}px)`);
    
    // Modern browsers - use addEventListener
    mql.addEventListener("change", checkIsMobile);
    
    // Clean up
    return () => mql.removeEventListener("change", checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to get the current breakpoint based on viewport width
 * @returns Current breakpoint as a string (xs, sm, md, lg, xl, 2xl)
 */
export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<BreakpointSize>("md");
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < BREAKPOINTS.xs) {
        setCurrentBreakpoint("xs");
      } else if (width < BREAKPOINTS.sm) {
        setCurrentBreakpoint("sm");
      } else if (width < BREAKPOINTS.md) {
        setCurrentBreakpoint("md");
      } else if (width < BREAKPOINTS.lg) {
        setCurrentBreakpoint("lg");
      } else if (width < BREAKPOINTS.xl) {
        setCurrentBreakpoint("xl");
      } else {
        setCurrentBreakpoint("2xl");
      }
    };
    
    // Check on initial render
    checkBreakpoint();
    
    // Add event listener for window resize with debounce for performance
    const handleResize = () => {
      checkBreakpoint();
    };
    
    window.addEventListener("resize", handleResize);
    
    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return currentBreakpoint;
}

/**
 * Hook to get viewport dimensions
 * @returns Object with viewport width and height
 */
export function useViewport() {
  const [viewport, setViewport] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return viewport;
}
