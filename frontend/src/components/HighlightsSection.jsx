import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const HighlightsSection = ({ highlights, highlightIndex, setHighlightIndex, prevHighlight, nextHighlight, language, t }) => {
  return (
    <section id="highlight" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <h2 className="text-3xl font-bold text-center mb-4 text-yellow-500">{t.highlight.title}</h2>
          <p className="text-center text-gray-400 mb-12">{t.highlight.subtitle}</p>
        </AnimatedSection>

        <div className="relative px-8 sm:px-12">
          {/* Left Arrow Button */}
          <button
            onClick={prevHighlight}
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110"
            aria-label="Previous highlight"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={nextHighlight}
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110"
            aria-label="Next highlight"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Carousel Container */}
          <div className="relative overflow-hidden rounded-lg w-full">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${highlightIndex * 100}%)` }}
            >
              {highlights.map((highlight, index) => (
                <div key={index} className="min-w-full flex-shrink-0 w-full">
                  <div className="flex flex-col md:grid md:grid-cols-2 gap-0 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 w-full">
                    {/* Image Section - Top on mobile, Left on desktop */}
                    <div className="relative h-48 sm:h-64 md:h-96 overflow-hidden w-full order-1 md:order-1">
                      <img
                        src={highlight.image}
                        alt={highlight.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content Section - Bottom on mobile, Right on desktop */}
                    <div className="p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-center bg-black w-full overflow-hidden order-2 md:order-2">
                      <div className="text-yellow-500 text-xs sm:text-sm mb-2 sm:mb-3 uppercase tracking-wider break-words">
                        {highlight.date}
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight break-words">
                        {highlight.title}
                      </h3>
                      <p className="text-gray-400 mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base break-words overflow-wrap-anywhere">
                        {language === 'th'
                          ? 'ชมช่วงเวลาที่ดีที่สุดจากการแข่งขันมวยไทยล่าสุด สัมผัสความตื่นเต้นและความสามารถของนักสู้'
                          : 'Watch the best moments from the latest Muay Thai fights. Experience the excitement and skills of the fighters.'}
                      </p>
                      <button
                        onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}
                        className="inline-flex items-center justify-center bg-red-600 text-white font-bold py-2.5 px-5 sm:py-3 sm:px-6 md:px-8 rounded-lg hover:bg-red-500 transition-colors w-full sm:w-fit text-sm sm:text-base"
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
                  : 'w-2 bg-gray-600 hover:bg-gray-500'
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

