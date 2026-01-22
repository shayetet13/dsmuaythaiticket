import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getNewsPopupImages } from '../db/imagesDb';

const NewsPopup = ({ language = 'en' }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const loadAndCheck = async () => {
      // Wait for page to fully load first
      const checkPageLoaded = () => {
        if (document.readyState === 'complete') {
          // Page is fully loaded, wait a bit more for smooth transition
          setTimeout(() => {
            const shouldShow = checkShouldShow();
            if (shouldShow) {
              loadImages();
            }
          }, 800); // Wait 800ms after page load for smooth transition
        } else {
          // Wait for page to load
          window.addEventListener('load', () => {
            setTimeout(() => {
              const shouldShow = checkShouldShow();
              if (shouldShow) {
                loadImages();
              }
            }, 800);
          }, { once: true });
        }
      };

      // Check immediately
      checkPageLoaded();
    };
    loadAndCheck();
  }, []);

  const checkShouldShow = () => {
    // Check localStorage for "don't show again" flag
    const hideUntil = localStorage.getItem('newsPopupHideUntil');
    if (hideUntil) {
      const hideUntilDate = new Date(hideUntil);
      const now = new Date();
      if (now < hideUntilDate) {
        // Still within 7 days, don't show
        return false;
      } else {
        // 7 days passed, remove the flag
        localStorage.removeItem('newsPopupHideUntil');
      }
    }
    
    return true;
  };

  const loadImages = async () => {
    try {
      const data = await getNewsPopupImages();
      if (data && data.length > 0) {
        setImages(data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
        // Set visible to trigger animation
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error loading news popup images:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    
    if (dontShowAgain) {
      // Set hide until 7 days from now
      const hideUntil = new Date();
      hideUntil.setDate(hideUntil.getDate() + 7);
      localStorage.setItem('newsPopupHideUntil', hideUntil.toISOString());
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!isVisible || images.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      style={{
        animation: 'fadeIn 0.5s ease-out forwards'
      }}
    >
      <div 
        className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          animation: 'slideUpFadeIn 0.5s ease-out forwards'
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>

        {/* Image Carousel */}
        <div className="relative flex-1 overflow-hidden bg-gray-100">
          <div 
            className="flex transition-transform duration-300 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className="min-w-full h-full flex items-center justify-center"
              >
                <img
                  src={image.image}
                  alt={`News ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with Checkbox */}
        <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">
              {language === 'th' ? 'อย่าโชว์อีกเป็นเวลา 7 วัน' : "Don't show again for 7 days"}
            </span>
          </label>
          <button
            onClick={handleClose}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            {language === 'th' ? 'ปิด' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsPopup;
