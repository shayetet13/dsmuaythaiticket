import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const AnimatedItem = ({ children, delay = 0, direction = 'up', className = '', once = true }) => {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.15, once });

  const getAnimationClass = () => {
    if (!isVisible) {
      if (direction === 'up') return 'opacity-0 translate-y-8';
      if (direction === 'fade') return 'opacity-0';
      return 'opacity-0 translate-y-8';
    }
    return 'opacity-100 translate-y-0';
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${getAnimationClass()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedItem;

