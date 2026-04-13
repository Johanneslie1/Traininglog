import React from 'react';

export interface Category {
  id: string;
  name: string;
  icon: string;
  bgColor: string;
  iconBgColor: string;
  textColor: string;
}

interface CategoryButtonProps {
  category: Category;
  onClick: () => void;
}

export const CategoryButton: React.FC<CategoryButtonProps> = ({ category, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 ${category.bgColor} rounded-xl
        transition-all duration-200 
        hover:scale-[1.02] active:scale-[0.98]
        hover:bg-opacity-90 active:bg-opacity-100
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
        touch-manipulation
      `}
    >
      <div className="flex flex-col items-center gap-2">
        <span className={`
          w-12 h-12 flex items-center justify-center text-2xl rounded-lg
          ${category.iconBgColor} shadow-lg
        `}>
          {category.icon}
        </span>
        <span className={`text-sm font-medium ${category.textColor}`}>
          {category.name}
        </span>
      </div>
    </button>
  );
};

export default CategoryButton;
