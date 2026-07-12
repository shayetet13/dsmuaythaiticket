/**
 * Performance Monitoring Utilities
 * Track and optimize web performance metrics
 */

/**
 * Measure Web Vitals (Core Web Vitals)
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 */
export const measureWebVitals = () => {
  if (typeof window === 'undefined' || !window.performance) {
    console.warn('[Performance] Performance API not available');
    return;
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('[Performance] LCP:', lastEntry.renderTime || lastEntry.loadTime, 'ms');
        
        // Good: < 2.5s, Needs Improvement: 2.5s - 4s, Poor: > 4s
        const lcpValue = lastEntry.renderTime || lastEntry.loadTime;
        if (lcpValue > 4000) {
          console.warn('[Performance] LCP is poor (> 4s)');
        } else if (lcpValue > 2500) {
          console.warn('[Performance] LCP needs improvement (2.5s - 4s)');
        } else {
          console.log('[Performance] LCP is good (< 2.5s)');
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('[Performance] LCP measurement failed:', e);
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('[Performance] FID:', entry.processingStart - entry.startTime, 'ms');
          
          // Good: < 100ms, Needs Improvement: 100ms - 300ms, Poor: > 300ms
          const fidValue = entry.processingStart - entry.startTime;
          if (fidValue > 300) {
            console.warn('[Performance] FID is poor (> 300ms)');
          } else if (fidValue > 100) {
            console.warn('[Performance] FID needs improvement (100ms - 300ms)');
          } else {
            console.log('[Performance] FID is good (< 100ms)');
          }
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('[Performance] FID measurement failed:', e);
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            console.log('[Performance] CLS:', clsValue);
            
            // Good: < 0.1, Needs Improvement: 0.1 - 0.25, Poor: > 0.25
            if (clsValue > 0.25) {
              console.warn('[Performance] CLS is poor (> 0.25)');
            } else if (clsValue > 0.1) {
              console.warn('[Performance] CLS needs improvement (0.1 - 0.25)');
            } else {
              console.log('[Performance] CLS is good (< 0.1)');
            }
          }
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('[Performance] CLS measurement failed:', e);
    }
  }
};

/**
 * Measure page load time
 */
export const measurePageLoadTime = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      
      console.log('[Performance] Page Load Time:', pageLoadTime, 'ms');
      console.log('[Performance] DOM Ready Time:', domReadyTime, 'ms');
      
      // Resource timing
      if (window.performance.getEntriesByType) {
        const resources = window.performance.getEntriesByType('resource');
        const images = resources.filter(r => r.initiatorType === 'img');
        
        console.log('[Performance] Total Resources:', resources.length);
        console.log('[Performance] Total Images:', images.length);
        
        // Find slowest images
        const slowImages = images
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5);
        
        if (slowImages.length > 0) {
          console.log('[Performance] Slowest Images:');
          slowImages.forEach((img, i) => {
            console.log(`  ${i + 1}. ${img.name.split('/').pop()} - ${img.duration.toFixed(2)}ms`);
          });
        }
      }
    }, 0);
  });
};

/**
 * Monitor memory usage (Chrome only)
 */
export const monitorMemoryUsage = () => {
  if (typeof window === 'undefined') return;
  
  if (performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    console.log('[Performance] Memory Usage:');
    console.log(`  Used: ${(usedJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`  Total: ${(totalJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`  Limit: ${(jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
    console.log(`  Usage: ${((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2)}%`);
  }
};

/**
 * Detect slow network connection
 */
export const detectSlowConnection = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) {
    return false;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnections = ['slow-2g', '2g', '3g'];
  
  if (connection && connection.effectiveType) {
    const isSlow = slowConnections.includes(connection.effectiveType);
    
    if (isSlow) {
      console.warn('[Performance] Slow network detected:', connection.effectiveType);
      console.warn('[Performance] Consider reducing image quality or quantity');
    } else {
      console.log('[Performance] Network type:', connection.effectiveType);
    }
    
    return isSlow;
  }
  
  return false;
};

/**
 * Prefetch resources for next page
 */
export const prefetchResources = (urls) => {
  if (typeof document === 'undefined') return;

  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'image';
    document.head.appendChild(link);
  });
  
  console.log('[Performance] Prefetched', urls.length, 'resources');
};

/**
 * Preload critical resources
 * Note: For images that are displayed immediately (like hero image), use Image object preload instead
 */
export const preloadCriticalResources = (resources) => {
  if (typeof document === 'undefined') return;

  resources.forEach(({ url, type = 'image' }) => {
    // For images, use Image object preload instead of link preload
    // Link preload is better for resources that won't be used immediately
    if (type === 'image') {
      // Detect image type from URL
      const isWebP = url.toLowerCase().includes('.webp');
      const isBase64 = url.startsWith('data:');
      
      // Use Image object for immediate preload
      const img = new Image();
      img.src = url;
      
      // Only use link preload for non-immediate resources (like next page images)
      // Skip link preload for hero images and base64 images
      if (!isBase64 && !url.includes('/hero/')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'image';
        // Set correct type based on file extension
        if (isWebP) {
          link.type = 'image/webp';
        } else if (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg')) {
          link.type = 'image/jpeg';
        } else if (url.toLowerCase().includes('.png')) {
          link.type = 'image/png';
        }
        document.head.appendChild(link);
      }
    } else {
      // For non-image resources, use link preload
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      document.head.appendChild(link);
    }
  });
  
  console.log('[Performance] Preloaded', resources.length, 'critical resources');
};

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  console.log('[Performance] Initializing performance monitoring...');
  
  // Measure web vitals
  measureWebVitals();
  
  // Measure page load time
  measurePageLoadTime();
  
  // Detect slow connection
  const isSlow = detectSlowConnection();
  
  // Monitor memory usage every 30 seconds (in development only)
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      monitorMemoryUsage();
    }, 30000);
  }
  
  return { isSlow };
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const perfData = window.performance.timing;
  
  return {
    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
    tcp: perfData.connectEnd - perfData.connectStart,
    request: perfData.responseStart - perfData.requestStart,
    response: perfData.responseEnd - perfData.responseStart,
    dom: perfData.domComplete - perfData.domLoading,
    load: perfData.loadEventEnd - perfData.navigationStart,
  };
};

export default {
  measureWebVitals,
  measurePageLoadTime,
  monitorMemoryUsage,
  detectSlowConnection,
  prefetchResources,
  preloadCriticalResources,
  initPerformanceMonitoring,
  getPerformanceMetrics,
};
