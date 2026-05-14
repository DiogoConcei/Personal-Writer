import React, { useState, useEffect, useRef } from 'react';

import { LazyImageProps } from '@/shared/types';

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, style, onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={imgRef}
      style={{ 
        ...style, 
        backgroundColor: isLoaded ? 'transparent' : 'var(--color-bg-dark)',
        overflow: 'hidden',
        position: 'relative'
      }}
      className={className}
    >
      {isVisible && (
        <img
          src={src}
          alt={alt}
          onLoad={() => {
            setIsLoaded(true);
            if (onLoad) onLoad();
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            display: 'block'
          }}
        />
      )}
    </div>
  );
};
