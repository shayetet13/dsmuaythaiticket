import React, { useMemo } from 'react';
import AnimatedSection from './AnimatedSection';

const HeroSection = ({ heroImage, t }) => {
  // Memoize image source calculation to reduce re-renders
  const imageData = useMemo(() => {
    const hasValidImage = heroImage && heroImage.image && heroImage.image.trim() !== '';
    // Use actual hero image path instead of fallback
    // Encode path to match preload in index.html (browser will decode automatically)
    const defaultPath = '/images/hero/World%20class%20fighters.webp';
    // Encode the image path if it contains spaces (to match preload)
    const encodePath = (path) => {
      if (!path) return defaultPath;
      // If path already contains encoded spaces, return as is
      if (path.includes('%20')) return path;
      // Otherwise, encode spaces to match preload
      return path.replace(/ /g, '%20');
    };
    const imageSrc = hasValidImage ? encodePath(heroImage.image) : defaultPath;
    const imageAlt = heroImage?.alt || 'Muay Thai';
    const fallbackSrc = defaultPath;
    return { imageSrc, imageAlt, fallbackSrc };
  }, [heroImage]);

  // Note: Hero image preloading is handled via HTML <link rel="preload"> in index.html
  // This provides better performance than JavaScript preloading and improves LCP

  return (
    <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Use regular img tag for hero image (critical above-the-fold content) */}
        <img
          src={imageData.imageSrc}
          alt={imageData.imageAlt}
          width={1920}
          height={1080}
          fetchpriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover filter grayscale brightness-40"
          style={{ aspectRatio: '16/9' }}
          onError={(e) => {
            if (e.target.src !== imageData.fallbackSrc) {
              e.target.src = imageData.fallbackSrc;
            } else {
              console.error('[HeroSection] Fallback image also failed to load');
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
      </div>
      <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <AnimatedSection direction="fade">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight uppercase">
            <span className="block w-full max-w-4xl mx-auto bg-gradient-to-b from-white to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl">
              {t.hero.title}
            </span>
            <span className="block text-lg sm:text-xl md:text-2xl lg:text-3xl text-yellow-500 mt-2 sm:mt-4 tracking-wider">
              {t.hero.subtitle}
            </span>
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={200} direction="fade">
          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            {t.hero.description}
          </p>
        </AnimatedSection>
        <AnimatedSection delay={400} direction="up">
          <a
            href="#booking"
            className="inline-block bg-red-600 text-white font-bold py-3 px-6 sm:py-4 sm:px-12 rounded-lg text-base sm:text-lg md:text-xl hover:bg-red-500 hover:scale-105 transition-all duration-300 shadow-2xl uppercase tracking-wider relative overflow-hidden group"
          >
            <span className="relative z-10">{t.hero.cta}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default HeroSection;

