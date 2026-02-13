import React, { useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

/**
 * OptimizedImage Component
 * Features:
 * - Lazy loading with blur effect
 * - WebP support with fallback
 * - Responsive images
 * - Error handling with fallback
 * - Loading placeholder
 */
const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  fallback = '/images/hero/World class fighters.webp',
  effect = 'blur',
  threshold = 100,
  useWebP = false, // Disable WebP by default to avoid issues
  placeholderSrc,
  wrapperClassName = '',
  onError,
  onLoad,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Update image source when src prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const handleError = (e) => {
    if (!hasError) {
      // Try fallback image
      if (imgSrc !== fallback) {
        setImgSrc(fallback);
        setHasError(true);
      }
    }
    
    if (onError) onError(e);
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  // Generate placeholder if not provided
  const placeholder = placeholderSrc || generatePlaceholder(width, height);

  return (
    <div className={`optimized-image-wrapper ${wrapperClassName}`}>
      <LazyLoadImage
        src={imgSrc}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        width={width}
        height={height}
        effect={effect}
        threshold={threshold}
        placeholderSrc={placeholder}
        onError={handleError}
        afterLoad={handleLoad}
        {...props}
      />
    </div>
  );
};

/**
 * Generate a placeholder image (low-quality placeholder)
 */
const generatePlaceholder = (width, height) => {
  if (!width || !height) return null;
  
  // Create a tiny blurred SVG as placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Progressive Image Component
 * Shows a low-res placeholder while loading high-res image
 */
export const ProgressiveImage = ({ 
  lowResSrc, 
  highResSrc, 
  alt, 
  className,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowResSrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Preload high-res image
    const img = new Image();
    img.src = highResSrc;
    
    img.onload = () => {
      setCurrentSrc(highResSrc);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
    };
  }, [highResSrc]);

  return (
    <OptimizedImage
      src={currentSrc}
      alt={alt}
      className={`${className} ${isLoading ? 'blur-sm' : ''}`}
      {...props}
    />
  );
};

/**
 * Preload critical images
 * Use this for above-the-fold images
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = resolve;
    img.onerror = reject;
  });
};

/**
 * Preload multiple images
 * Handles errors gracefully - doesn't fail if some images fail to load
 */
export const preloadImages = async (srcs) => {
  const results = await Promise.allSettled(srcs.map(src => preloadImage(src)));
  // Log errors but don't throw
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`[preloadImages] Failed to preload image: ${srcs[index]}`, result.reason);
    }
  });
  return results;
};

export default OptimizedImage;
