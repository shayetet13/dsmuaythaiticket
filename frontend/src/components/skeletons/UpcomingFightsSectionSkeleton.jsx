import React from 'react';
import Skeleton from '../Skeleton';
import EventCardSkeleton from './EventCardSkeleton';

/**
 * Upcoming Fights Section Skeleton
 * Shows skeleton structure for Upcoming Fights section while loading
 */
const UpcomingFightsSectionSkeleton = () => {
  return (
    <section id="tickets" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <Skeleton 
            className="h-10 sm:h-12 md:h-16 lg:h-20 xl:h-24 w-3/4 sm:w-2/3 mx-auto mb-2 sm:mb-4" 
            variant="light"
          />
          <Skeleton 
            className="h-5 sm:h-6 w-48 sm:w-64 mx-auto" 
            variant="light"
          />
        </div>

        {/* Stadium Section Skeleton */}
        <div className="mb-12 sm:mb-16">
          {/* Stadium Title Skeleton */}
          <Skeleton 
            className="h-8 sm:h-10 md:h-12 w-64 sm:w-80 mb-6 sm:mb-8" 
            variant="light"
          />

          {/* Event Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </div>

        {/* Second Stadium Section Skeleton (Optional) */}
        <div className="mb-12 sm:mb-16">
          <Skeleton 
            className="h-8 sm:h-10 md:h-12 w-64 sm:w-80 mb-6 sm:mb-8" 
            variant="light"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3].map((index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingFightsSectionSkeleton;
