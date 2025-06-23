
import React, { memo } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OptimizedLoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  message = 'Cargando...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-cobre-hotspot-plano/30 border-t-cobre-hotspot-plano rounded-full animate-spin`}></div>
      {message && (
        <p className="text-gris-hotspot-medio text-sm">{message}</p>
      )}
    </div>
  );
});

OptimizedLoadingSpinner.displayName = 'OptimizedLoadingSpinner';

export default OptimizedLoadingSpinner;
