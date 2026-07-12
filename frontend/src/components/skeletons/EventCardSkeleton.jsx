import React from 'react';
import Skeleton from '../Skeleton';

/**
 * Event Card Skeleton
 * Shows skeleton structure for event card in UpcomingFightsSection
 */
const EventCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
      {/* Image Skeleton */}
      <div className="relative h-80 overflow-hidden bg-gray-200">
        <Skeleton 
          className="w-full h-full rounded-none" 
          variant="light"
        />
      </div>
      
      {/* Content Skeleton */}
      <div className="p-4 bg-gray-50 border-t-2 border-gray-200 space-y-3">
        {/* Date Skeleton */}
        <Skeleton 
          className="h-4 w-32" 
          variant="light"
        />
        
        {/* Title Skeleton */}
        <Skeleton 
          className="h-6 w-full" 
          variant="light"
        />
        <Skeleton 
          className="h-6 w-3/4" 
          variant="light"
        />
        
        {/* Price Skeleton */}
        <Skeleton 
          className="h-5 w-24" 
          variant="light"
        />
        
        {/* Button Skeleton */}
        <Skeleton 
          className="h-10 w-full rounded-lg" 
          variant="light"
        />
      </div>
    </div>
  );
};

export default EventCardSkeleton;
