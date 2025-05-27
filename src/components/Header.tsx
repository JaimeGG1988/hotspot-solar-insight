
import React, { useState, useEffect } from 'react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-azul-hotspot/95 backdrop-blur-xl shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo HotSpot360 */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              {/* Isotipo 360 */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano flex items-center justify-center font-bold text-white text-lg animate-pulse-glow">
                360°
              </div>
            </div>
            
            <div className="flex flex-col">
              {/* Wordmark */}
              <h1 className="text-2xl font-black text-white tracking-tight">
                HotSpot<span className="text-gradient">360</span>
              </h1>
              {/* Eslogan */}
              <p className="text-sm text-gris-hotspot-medio font-medium">
                Your 360º Partner
              </p>
            </div>
          </div>

          {/* Título de la calculadora */}
          <div className="hidden md:block">
            <h2 className="text-xl font-semibold text-white">
              Calculadora Solar Fotovoltaica
            </h2>
            <p className="text-sm text-gris-hotspot-medio">
              Estimación técnica y económica profesional
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
