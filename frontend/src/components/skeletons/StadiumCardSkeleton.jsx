import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Stadium Card Skeleton
 * Shows skeleton structure for stadium card in BookingSection
 */
const StadiumCardSkeleton = () => {
  return (
    <div className="relative rounded-lg overflow-hidden flex flex-col bg-black border-2 border-yellow-500">
      {/* Header Skeleton */}
      <div className="text-center p-4 sm:p-5 md:p-6 pb-3 sm:pb-4 bg-black">
        {/* Stadium Name Skeleton */}
        <Skeleton 
          className="h-6 sm:h-8 md:h-10 lg:h-12 w-3/4 mx-auto mb-2" 
          variant="dark"
        />
        
        {/* Schedule Skeleton */}
        <Skeleton 
          className="h-4 sm:h-5 md:h-6 w-1/2 mx-auto" 
          variant="dark"
        />
      </div>

      {/* Image Section Skeleton */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[400px]">
        <Skeleton 
          className="w-full h-full rounded-none" 
          variant="dark"
        />
      </div>

      {/* Button Skeleton */}
      <div className="flex justify-center pt-4 sm:pt-5 md:pt-6 pb-4 sm:pb-5 md:pb-6 bg-black">
        <Skeleton 
          className="h-10 sm:h-12 md:h-14 w-40 sm:w-48 md:w-56 rounded" 
          variant="dark"
        />
      </div>
    </div>
  );
};

export default StadiumCardSkeleton;
