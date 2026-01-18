import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import OptimizedImage, { preloadImages } from './OptimizedImage';
import HighlightsSectionSkeleton from './skeletons/HighlightsSectionSkeleton';

const HighlightsSection = ({ highlights, highlightIndex, setHighlightIndex, prevHighlight, nextHighlight, language, t }) => {
  // Preload visible and next highlight images
  useEffect(() => {
    const imagesToPreload = [];
    
    // Current highlight
    if (highlights[highlightIndex]?.image) {
      imagesToPreload.push(highlights[highlightIndex].image);
    }
    
    // Next highlight
    const nextIndex = (highlightIndex + 1) % highlights.length;
    if (highlights[nextIndex]?.image) {
      imagesToPreload.push(highlights[nextIndex].image);
    }
    
    if (imagesToPreload.length > 0) {
      preloadImages(imagesToPreload).catch(err => {
        console.log('[HighlightsSection] Failed to preload images:', err);
      });
    }
  }, [highlightIndex, highlights]);

  // Show skeleton if no highlights loaded
  if (highlights.length === 0) {
    return <HighlightsSectionSkeleton />;
  }

  return (
    <section id="highlight" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-center mb-4 text-red-600">{t.highlight.title}</h2>
          <p className="text-center text-gray-600 mb-12">{t.highlight.subtitle}</p>
        </AnimatedSection>

        <div className="relative px-8 sm:px-12">
          {/* Left Arrow Button */}
          <button
            onClick={prevHighlight}
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Previous highlight"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={nextHighlight}
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-900 hover:bg-black text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
            aria-label="Next highlight"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Carousel Container */}
          <div className="relative overflow-hidden rounded-lg w-full shadow-xl">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${highlightIndex * 100}%)` }}
            >
              {highlights.map((highlight, index) => (
                <div key={index} className="min-w-full flex-shrink-0 w-full">
                  <div className="flex flex-col md:grid md:grid-cols-2 gap-0 bg-white rounded-lg overflow-hidden border-2 border-gray-300 w-full">
                    {/* Image Section - Top on mobile, Left on desktop */}
                    <div className="relative h-48 sm:h-64 md:h-96 overflow-hidden w-full order-1 md:order-1">
                      <OptimizedImage
                        key={`highlight-${index}-${highlight.image}`}
                        src={highlight.image}
                        alt={highlight.title}
                        className="w-full h-full object-cover"
                        effect="blur"
                        threshold={100}
                        useWebP={false}
                        wrapperClassName="w-full h-full"
                      />
                    </div>

                    {/* Content Section - Bottom on mobile, Right on desktop */}
                    <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-center bg-gray-50 w-full overflow-hidden order-2 md:order-2 border-l-2 border-gray-300">
                      <div className="text-red-600 text-xs sm:text-sm mb-2 sm:mb-3 uppercase tracking-wider break-words font-semibold">
                        {highlight.date}
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 leading-tight break-words">
                        {highlight.title}
                      </h3>
                      <p className="text-gray-700 mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base break-words overflow-wrap-anywhere">
                        {highlight.description || (language === 'th'
                          ? 'ชมช่วงเวลาที่ดีที่สุดจากการแข่งขันมวยไทยล่าสุด สัมผัสความตื่นเต้นและความสามารถของนักสู้'
                          : 'Watch the best moments from the latest Muay Thai fights. Experience the excitement and skills of the fighters.')}
                      </p>
                      <button
                        onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}
                        className="inline-flex items-center justify-center bg-red-600 text-white font-bold py-2.5 px-5 sm:py-3 sm:px-6 md:px-8 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-fit text-sm sm:text-base shadow-md hover:shadow-lg"
                      >
                        {t.highlight.viewMore}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-8">
            {highlights.map((_, index) => (
              <button
                key={index}
                onClick={() => setHighlightIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${index === highlightIndex
                  ? 'w-8 bg-red-600'
                  : 'w-2 bg-gray-400 hover:bg-gray-500'
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

export default HighlightsSection;