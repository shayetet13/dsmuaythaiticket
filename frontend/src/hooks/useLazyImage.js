import { useState, useEffect, useRef } from 'react';

/**
 * Hook for lazy loading images
 * @param {string} src - Image source
 * @param {string} placeholder - Placeholder image
 * @returns {[string, React.Ref]} Image source and ref
 */
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState(null);

  useEffect(() => {
    let observer;
    let cancelled = false;

    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!cancelled && entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(imageRef);
          }
        },
        { threshold: 0.01, rootMargin: '50px' }
      );
      observer.observe(imageRef);
    }

    return () => {
      cancelled = true;
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, placeholder, src]);

  return [imageSrc, setImageRef];
};

