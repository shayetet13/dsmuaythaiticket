import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Highlights Section Skeleton
 * Shows skeleton structure for Highlights carousel while loading
 */
const HighlightsSectionSkeleton = () => {
  return (
    <section id="highlight" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <Skeleton 
            className="h-8 sm:h-10 w-64 mx-auto mb-4" 
            variant="light"
          />
          <Skeleton 
            className="h-5 w-48 mx-auto" 
            variant="light"
          />
        </div>

        {/* Carousel Container Skeleton */}
        <div className="relative px-8 sm:px-12">
          {/* Left Arrow Button Skeleton */}
          <div className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-10">
            <Skeleton 
              className="h-10 w-10 rounded-full" 
              variant="dark"
            />
          </div>

          {/* Right Arrow Button Skeleton */}
          <div className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-10">
            <Skeleton 
              className="h-10 w-10 rounded-full" 
              variant="dark"
            />
          </div>

          {/* Card Skeleton */}
          <div className="rounded-lg overflow-hidden border-2 border-gray-300">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-0 bg-white">
              {/* Image Section */}
              <div className="relative h-48 sm:h-64 md:h-96 w-full">
                <Skeleton 
                  className="w-full h-full rounded-none" 
                  variant="light"
                />
              </div>

              {/* Content Section */}
              <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-50 space-y-4">
                {/* Date Skeleton */}
                <Skeleton 
                  className="h-4 w-24" 
                  variant="light"
                />
                
                {/* Title Skeleton */}
                <Skeleton 
                  className="h-6 sm:h-8 md:h-10 w-full" 
                  variant="light"
                />
                <Skeleton 
                  className="h-6 sm:h-8 md:h-10 w-3/4" 
                  variant="light"
                />

                {/* Description Skeleton */}
                <div className="space-y-2">
                  <Skeleton 
                    className="h-4 w-full" 
                    variant="light"
                  />
                  <Skeleton 
                    className="h-4 w-full" 
                    variant="light"
                  />
                  <Skeleton 
                    className="h-4 w-5/6" 
                    variant="light"
                  />
                </div>

                {/* Button Skeleton */}
                <Skeleton 
                  className="h-10 sm:h-12 w-32 sm:w-40 rounded-lg" 
                  variant="light"
                />
              </div>
            </div>
          </div>

          {/* Navigation Dots Skeleton */}
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map((index) => (
              <Skeleton 
                key={index}
                className="h-2 w-2 rounded-full" 
                variant="light"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HighlightsSectionSkeleton;
