import React from 'react';

const Card = ({ children, className = '', glass = false, noPadding = false, ...props }) => {
  const baseStyles = glass 
    ? 'glass' 
    : 'bg-white border border-secondary-200 shadow-soft';
    
  const paddingStyles = noPadding ? '' : 'p-6';

  return (
    <div 
      className={`rounded-xl ${baseStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
