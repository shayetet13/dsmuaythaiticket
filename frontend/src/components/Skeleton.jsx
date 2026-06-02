import React from 'react';

/**
 * Base Skeleton Component
 * Reusable skeleton with shimmer animation
 */
const Skeleton = ({ 
  className = '', 
  width, 
  height, 
  rounded = 'rounded',
  variant = 'default' // 'default', 'dark', 'light'
}) => {
  const baseClasses = 'animate-shimmer';
  
  const variantClasses = {
    default: 'bg-gray-300',
    dark: 'bg-gray-800',
    light: 'bg-gray-200'
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${rounded} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
};

export default Skeleton;
