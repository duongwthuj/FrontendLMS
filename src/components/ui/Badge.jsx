import React from 'react';

const variants = {
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  neutral: 'bg-secondary-50 text-secondary-700 border-secondary-200',
};

const Badge = ({ children, variant = 'neutral', className = '', ...props }) => {
  const variantStyles = variants[variant] || variants.neutral;

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
