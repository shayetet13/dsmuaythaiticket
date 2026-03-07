import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Hero Section Skeleton
 * Shows skeleton structure for Hero Section while loading
 */
const HeroSectionSkeleton = () => {
  return (
    <section id="home" className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden bg-black">
      {/* Background Skeleton */}
      <div className="absolute inset-0 z-0">
        <Skeleton 
          className="w-full h-full" 
          variant="dark"
          rounded="rounded-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
      </div>

      {/* Content Skeleton */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 w-full">
        {/* Title Skeleton */}
        <div className="mb-4 sm:mb-6">
          <Skeleton 
            className="h-12 sm:h-16 md:h-20 lg:h-24 xl:h-28 w-3/4 mx-auto mb-2" 
            variant="dark"
          />
          <Skeleton 
            className="h-6 sm:h-8 md:h-10 lg:h-12 w-1/2 mx-auto" 
            variant="dark"
          />
        </div>

        {/* Description Skeleton */}
        <div className="mb-6 sm:mb-8 max-w-3xl mx-auto space-y-2">
          <Skeleton 
            className="h-4 sm:h-5 md:h-6 w-full" 
            variant="dark"
          />
          <Skeleton 
            className="h-4 sm:h-5 md:h-6 w-5/6 mx-auto" 
            variant="dark"
          />
          <Skeleton 
            className="h-4 sm:h-5 md:h-6 w-4/6 mx-auto" 
            variant="dark"
          />
        </div>

        {/* Button Skeleton */}
        <Skeleton 
          className="h-12 sm:h-14 md:h-16 w-48 sm:w-56 md:w-64 mx-auto rounded-lg" 
          variant="dark"
        />
      </div>
    </section>
  );
};

export default HeroSectionSkeleton;
