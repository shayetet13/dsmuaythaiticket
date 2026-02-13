import React, { useState, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';

const HeroSection = ({ heroImage, t }) => {
  // Use static default image immediately for better LCP (no API delay)
  // This is especially critical for mobile devices with slower networks
  const defaultPath = '/images/hero/World%20class%20fighters.webp';
  const [imageSrc, setImageSrc] = useState(defaultPath);
  const [imageAlt, setImageAlt] = useState('Muay Thai fighters in action at Lumpinee Stadium Bangkok - Book Muay Thai tickets online');
  const { isMobile } = useResponsive();

  // Update image from API after initial render (non-blocking)
  // This allows mobile devices to show content immediately while API loads in background
  useEffect(() => {
    if (heroImage?.image && heroImage.image.trim() !== '') {
      // Only update if it's a file path (not base64) to avoid breaking preload
      // Base64 images are handled separately and shouldn't replace the preloaded image
      const path = heroImage.image;
      if (!path.startsWith('data:image/')) {
        // Encode path if it contains spaces
        const encodedPath = path.includes('%20') ? path : path.replace(/ /g, '%20');
        setImageSrc(encodedPath);
      }
      if (heroImage.alt) {
        setImageAlt(heroImage.alt);
      }
    }
  }, [heroImage]);

  // Fallback path (static, no need to memoize)
  const fallbackSrc = defaultPath;

  return (
    <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Optimized hero image - critical for mobile LCP performance */}
        {/* Mobile: Shows static image immediately (no API delay) */}
        {/* Desktop: Also benefits from immediate static image display */}
        <img
          src={imageSrc}
          alt={imageAlt}
          width={1920}
          height={1080}
          fetchpriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover filter grayscale brightness-40"
          style={{ aspectRatio: '16/9' }}
          sizes="100vw"
          onError={(e) => {
            if (e.target.src !== fallbackSrc) {
              e.target.src = fallbackSrc;
            } else {
              console.error('[HeroSection] Fallback image also failed to load');
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
      </div>
      {/* Content displayed immediately without animation delay - critical for mobile FCP/LCP */}
      {/* Removed AnimatedSection to eliminate render blocking on mobile devices */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight uppercase">
          <span className="block w-full max-w-4xl mx-auto bg-gradient-to-b from-white to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl">
            {t.hero.title}
          </span>
          <span className="block text-base sm:text-lg md:text-xl lg:text-2xl text-yellow-500 mt-2 sm:mt-4 tracking-wider">
            {t.hero.subtitle}
          </span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
          {t.hero.description}
        </p>
        <a
          href="#booking"
          className="inline-block bg-red-600 text-white font-bold py-3 px-6 sm:py-4 sm:px-12 rounded-lg text-base sm:text-lg md:text-xl hover:bg-red-500 hover:scale-105 transition-all duration-300 shadow-2xl uppercase tracking-wider relative overflow-hidden group"
        >
          <span className="relative z-10">{t.hero.cta}</span>
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
        </a>
      </div>
    </section>
  );
};

export default HeroSection;

