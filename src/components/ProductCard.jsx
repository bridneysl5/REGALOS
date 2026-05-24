import React from 'react';
import { Eye, ShoppingBag } from 'lucide-react';

const ProductCard = ({ product, addToCart, setSelectedProduct }) => {
  const getBadgeStyle = (category) => {
    const cat = Array.isArray(category) ? category[0] : category;
    if (cat === 'Sets y Gift Boxes' || cat === 'Tortas y Repostería') return 'bg-[#E91E63] text-white';
    if (cat === 'Arreglos de Flores') return 'bg-gray-900 text-white';
    return 'bg-white text-gray-900 shadow-sm';
  };

  const getBadgeText = (category) => {
    const cat = Array.isArray(category) ? category[0] : category;
    if (cat === 'Sets y Gift Boxes') return 'TOP SELLER';
    if (cat === 'Arreglos de Flores') return 'EXCLUSIVO';
    return cat === 'Cuadros y Regalos Personalizados' ? 'PERSONALIZADO' : 'NUEVO';
  };

  return (
    <div className="group flex flex-col gap-4">
      {/* Image Section */}
      <div 
        className="relative aspect-[4/5] rounded-[28px] overflow-hidden cursor-pointer bg-gray-50"
        onClick={() => setSelectedProduct(product)}
      >
        <img 
          src={product.img} 
          alt={product.name}
          className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Top Left Badge */}
        <div className="absolute top-4 left-4">
          <span className={`${getBadgeStyle(product.category)} text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full tracking-wider`}>
            {getBadgeText(product.category)}
          </span>
        </div>

        {/* Top Right Eye Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
          className="absolute top-4 right-4 bg-white text-gray-900 p-2.5 rounded-full shadow-md hover:scale-110 transition-transform duration-300"
        >
          <Eye size={20} strokeWidth={2.5} />
        </button>

        {/* Bottom Center Add to Cart Button */}
        <div className="absolute bottom-5 left-0 w-full flex justify-center">
          <button 
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            className="bg-white text-gray-900 px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg hover:scale-105 transition-transform duration-300"
          >
            <ShoppingBag size={20} strokeWidth={2.5} />
            Agregar
          </button>
        </div>
      </div>

      {/* Text Section */}
      <div className="px-2 flex flex-col gap-1">
        <div className="text-xs text-rose-500 font-bold tracking-wider mb-1 uppercase">
          {Array.isArray(product.category) ? product.category.join(', ') : product.category}
        </div>
        <h4 className="font-serif font-bold text-gray-900 text-lg leading-tight group-hover:text-rose-500 transition-colors">
          {product.name}
        </h4>
        <span className="text-base font-bold text-rose-600">
          S/ {product.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default ProductCard;
