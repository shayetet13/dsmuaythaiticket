import React from 'react';
import Skeleton from '../Skeleton';
import StadiumCardSkeleton from './StadiumCardSkeleton';

/**
 * Booking Section Skeleton
 * Shows skeleton structure for Booking Section while loading
 */
const BookingSectionSkeleton = () => {
  return (
    <section id="booking" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-black" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
      <div className="max-w-7xl mx-auto">
        {/* Bangkok Section Skeleton */}
        <div className="space-y-8 md:space-y-12 mb-12">
          <Skeleton 
            className="h-8 sm:h-10 md:h-12 w-48 sm:w-64 mx-auto" 
            variant="dark"
          />
          
          {/* Stadium Cards Grid Skeleton - Desktop */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((index) => (
              <StadiumCardSkeleton key={index} />
            ))}
          </div>

          {/* Stadium Card Carousel Skeleton - Mobile */}
          <div className="sm:hidden relative">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2].map((index) => (
                <div key={index} className="min-w-full flex-shrink-0">
                  <StadiumCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phuket Section Skeleton */}
        <div className="space-y-8 md:space-y-12">
          <Skeleton 
            className="h-8 sm:h-10 md:h-12 w-48 sm:w-64 mx-auto" 
            variant="dark"
          />
          
          {/* Stadium Cards Grid Skeleton - Desktop */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2].map((index) => (
              <StadiumCardSkeleton key={index} />
            ))}
          </div>

          {/* Stadium Card Carousel Skeleton - Mobile */}
          <div className="sm:hidden relative">
            <div className="flex gap-4 overflow-hidden">
              {[1].map((index) => (
                <div key={index} className="min-w-full flex-shrink-0">
                  <StadiumCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSectionSkeleton;
