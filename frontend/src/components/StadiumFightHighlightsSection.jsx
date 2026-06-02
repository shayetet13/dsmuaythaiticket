import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OptimizedImage, { preloadImages } from './OptimizedImage';

/**
 * Stadium Fight Highlights Section
 * Shows fight highlight images only (no text) for a specific stadium page
 * Uses stadium_highlight_images - image only, unlimited
 */
const StadiumFightHighlightsSection = ({
  stadiumHighlightImages = {},
  stadiumId,
  stadiumName
}) => {
  const [highlightIndex, setHighlightIndex] = useState(0);

  const items = stadiumHighlightImages[stadiumId] || [];

  useEffect(() => {
    if (items.length === 0) return;

    const doPreload = () => {
      const imagesToPreload = [];
      const current = items[highlightIndex];
      if (current?.image) imagesToPreload.push(current.image);
      const nextIndex = (highlightIndex + 1) % items.length;
      const next = items[nextIndex];
      if (next?.image) imagesToPreload.push(next.image);
      if (imagesToPreload.length > 0) preloadImages(imagesToPreload);
    };

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(doPreload, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(doPreload, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightIndex, items]);

  const prevHighlight = () => {
    setHighlightIndex(prev => (prev - 1 + items.length) % items.length);
  };

  const nextHighlight = () => {
    setHighlightIndex(prev => (prev + 1) % items.length);
  };

  if (items.length === 0) {
    return null;
  }

  const displayName = stadiumName
    ? (stadiumName.replace(/\s+Boxing\s+Stadium$/i, '').replace(/\s+Stadium$/i, '').trim() + ' Stadium')
    : '';

  return (
    <section id="stadium-highlight" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {displayName && (
          <h1 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-red-500 mb-8 sm:mb-12">
            {displayName}
          </h1>
        )}
        <div className="relative px-8 sm:px-12">
          <button
            onClick={prevHighlight}
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={nextHighlight}
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-700 hover:bg-gray-600 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="relative overflow-hidden rounded-lg w-full shadow-xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${highlightIndex * 100}%)` }}
            >
              {items.map((item, index) => (
                <div key={item.id || index} className="min-w-full flex-shrink-0 w-full flex justify-center">
                  <div
                    className="relative overflow-hidden rounded-lg bg-gray-800 flex-shrink-0 mx-auto"
                    style={{ width: 'min(1500px, 100%)', aspectRatio: '1500/405' }}
                  >
                    <OptimizedImage
                      src={item.image}
                      alt="Fight highlight"
                      width={1500}
                      height={405}
                      className="w-full h-full object-contain"
                      effect="blur"
                      threshold={100}
                      wrapperClassName="w-full h-full"
                      loading="lazy"
                      fetchPriority={index === 0 ? 'high' : 'low'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setHighlightIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === highlightIndex ? 'w-8 bg-red-600' : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StadiumFightHighlightsSection;
