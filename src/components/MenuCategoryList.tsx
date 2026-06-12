'use client';

import { motion } from 'framer-motion';

// 1. FIX: Update the interface to expect an array of objects, not just strings
interface CategoryItem {
  id: string;
  name: string;
}

interface MenuCategoryListProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function MenuCategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
}: MenuCategoryListProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3">
      <div className="flex gap-2 min-w-max">
        {categories.map((category) => {
          // 2. FIX: Check against the category.name property
          const isActive = selectedCategory === category.name;
          
          return (
            <motion.button
              // 3. FIX: Use the unique ID for the React key so it doesn't say [object Object]
              key={category.id}
              onClick={() => onSelectCategory(category.name)}
              whileTap={{ scale: 0.95 }}
              className="relative py-2 px-5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer select-none transition-all"
              style={{
                backgroundColor: isActive ? '#E07A5F' : '#FAF7EE',
                color: isActive ? '#FAF7EE' : '#5A5245',
                border: '2px solid #1A1A1A',
                boxShadow: isActive ? '3px 3px 0px #1A1A1A' : '2px 2px 0px #1A1A1A',
                transform: isActive ? 'translate(-1px, -1px)' : 'none',
              }}
            >
              {/* 4. FIX: Render the name string inside the button */}
              {category.name}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}