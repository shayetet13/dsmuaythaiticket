import React, { useMemo } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const AnimatedSection = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const [ref, isVisible] = useScrollAnimation({ threshold: 0.1 });

  // Memoize animation class to reduce re-renders
  const animationClass = useMemo(() => {
    if (!isVisible) {
      if (direction === 'up') return 'opacity-0 translate-y-10';
      if (direction === 'down') return 'opacity-0 -translate-y-10';
      if (direction === 'left') return 'opacity-0 translate-x-10';
      if (direction === 'right') return 'opacity-0 -translate-x-10';
      if (direction === 'fade') return 'opacity-0';
      return 'opacity-0 translate-y-10';
    }
    return 'opacity-100 translate-x-0 translate-y-0';
  }, [isVisible, direction]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${animationClass} ${className}`}
      style={{ transitionDelay: `${delay}ms`, willChange: isVisible ? 'auto' : 'transform, opacity' }}
    >
      {children}
    </div>
  );
};

export default React.memo(AnimatedSection);

