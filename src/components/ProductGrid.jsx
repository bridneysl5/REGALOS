import React from 'react';
import { Gift } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductGrid = ({ filteredProducts, activeFilter, setActiveFilter, addToCart, setSelectedProduct }) => {
  return (
    <main className="flex-1">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {activeFilter.category === 'Todos' ? 'Todos los productos' : activeFilter.category}
            {activeFilter.occasion !== 'Todos' && ` para ${activeFilter.occasion}`}
          </h2>
          <span className="text-gray-500 text-sm">{filteredProducts.length} productos encontrados</span>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              addToCart={addToCart} 
              setSelectedProduct={setSelectedProduct} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No encontramos productos con esos filtros.</p>
          <button 
            onClick={() => setActiveFilter({ category: 'Todos', occasion: 'Todos' })}
            className="text-rose-500 font-bold mt-2"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </main>
  );
};

export default ProductGrid;
