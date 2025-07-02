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
      className={`w-full p-4 ${category.bgColor} rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className={`w-12 h-12 flex items-center justify-center text-2xl rounded-lg ${category.iconBgColor}`}>
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
