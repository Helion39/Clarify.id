import React from 'react';

interface CategoryPlaceholderProps {
  className?: string;
}

export const CategoryPlaceholder: React.FC<CategoryPlaceholderProps> = ({ className }) => {
  return (
    <div
      className={`flex items-center justify-center bg-black text-white rounded ${className}`}
    >
      <div className="text-center">
        <p className="text-sm font-semibold">news</p>
      </div>
    </div>
  );
};
