import React, { useEffect } from 'react';

const MouseHearts = () => {
  useEffect(() => {
    let lastHeartTime = 0;
    
    const handleMouseMove = (e) => {
      const now = Date.now();
      // Solo crear un corazón cada 150ms para no saturar
      if (now - lastHeartTime < 150) return; 
      lastHeartTime = now;
      
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.className = 'fixed pointer-events-none z-[100] animate-float-up text-rose-500 opacity-70 text-xl';
      heart.style.left = `${e.clientX - 10}px`;
      heart.style.top = `${e.clientY - 10}px`;
      document.body.appendChild(heart);
      
      setTimeout(() => {
        if (heart.parentNode) {
          heart.parentNode.removeChild(heart);
        }
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return null;
};

export default MouseHearts;
