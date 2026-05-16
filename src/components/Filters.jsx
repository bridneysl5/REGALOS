import React from 'react';
import { Filter, Gift } from 'lucide-react';

const Filters = ({ categories, occasions, activeFilter, setActiveFilter }) => {
  return (
    <aside className="w-full md:w-64 space-y-8">
      <div>
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Filter size={18} /> Filtrar por Categoría
        </h3>
        <div className="space-y-2">
          {categories.map(c => (
            <label key={c} className="flex items-center gap-2 cursor-pointer hover:text-rose-500 transition">
              <input 
                type="radio" 
                name="cat" 
                checked={activeFilter.category === c}
                onChange={() => setActiveFilter({...activeFilter, category: c})}
                className="accent-rose-500"
              />
              <span className={activeFilter.category === c ? 'font-bold text-rose-500' : 'text-gray-600'}>{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Gift size={18} /> Filtrar por Ocasión
        </h3>
        <div className="space-y-2">
          {occasions.map(o => (
            <label key={o} className="flex items-center gap-2 cursor-pointer hover:text-rose-500 transition">
              <input 
                type="radio" 
                name="occ" 
                checked={activeFilter.occasion === o}
                onChange={() => setActiveFilter({...activeFilter, occasion: o})}
                className="accent-rose-500"
              />
              <span className={activeFilter.occasion === o ? 'font-bold text-rose-500' : 'text-gray-600'}>{o}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Filters;
