import React, { useState, useEffect } from 'react';

const HeroSection = ({ heroImage, t }) => {
  // Use static default image immediately for better LCP (no API delay)
  const defaultPath = '/images/hero/World%20class%20fighters.webp';
  const defaultSrcSet = '/images/hero/World%20class%20fighters-640w.webp 640w, /images/hero/World%20class%20fighters-1024w.webp 1024w, /images/hero/World%20class%20fighters.webp 1920w';
  const [imageSrc, setImageSrc] = useState(defaultPath);
  const [imageAlt, setImageAlt] = useState('Muay Thai fighters in action at Lumpinee Stadium Bangkok - Book Muay Thai tickets online');

  // Update image from API after initial render (non-blocking)
  useEffect(() => {
    if (heroImage?.image && heroImage.image.trim() !== '') {
      const path = heroImage.image;
      if (!path.startsWith('data:image/')) {
        const encodedPath = path.includes('%20') ? path : path.replace(/ /g, '%20');
        setImageSrc(encodedPath);
      }
      if (heroImage.alt) setImageAlt(heroImage.alt);
    }
  }, [heroImage]);

  const fallbackSrc = defaultPath;
  const useDefaultImage = imageSrc === defaultPath || imageSrc === defaultPath.replace(/%20/g, ' ');

  return (
    <section id="home" className="relative h-[55vh] min-h-[380px] max-h-[520px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={imageSrc}
          srcSet={useDefaultImage ? defaultSrcSet : undefined}
          alt={imageAlt}
          width={1920}
          height={1080}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover filter grayscale brightness-40"
          style={{ aspectRatio: '16/9' }}
          sizes="100vw"
          onError={(e) => {
            if (e.target.src !== fallbackSrc) {
              e.target.src = fallbackSrc;
              e.target.srcSet = defaultSrcSet;
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
        <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto px-2">
          {t.hero.description}
        </p>
      </div>
    </section>
  );
};

export default HeroSection;

