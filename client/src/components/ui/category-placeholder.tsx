import React from 'react';

interface CategoryPlaceholderProps {
  categoryName: string;
  className?: string;
}

export const CategoryPlaceholder: React.FC<CategoryPlaceholderProps> = ({ categoryName, className }) => {
  return (
    <div
      className={`flex items-center justify-center bg-gray-200 text-gray-500 rounded ${className}`}
    >
      <div className="text-center">
        <p className="text-sm font-semibold capitalize">{categoryName}</p>
      </div>
    </div>
  );
};
