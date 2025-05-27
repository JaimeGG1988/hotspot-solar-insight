
import React, { useState, useCallback } from 'react';
import { MapPin, Search, Satellite, Zap } from 'lucide-react';
import { AddressDetails, RoofAnalysis } from '../../types/AdvancedTypes';

interface AddressAnalyzerProps {
  onAddressAnalyzed: (address: AddressDetails, roofAnalysis: RoofAnalysis) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AddressAnalyzer: React.FC<AddressAnalyzerProps> = ({
  onAddressAnalyzed,
  isLoading,
  setIsLoading
}) => {
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(null);
  const [roofAnalysis, setRoofAnalysis] = useState<RoofAnalysis | null>(null);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      // Using Nominatim for address search (in production, use Google Places API)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=es&limit=5&addressdetails=1`
      );
      const results = await response.json();
      setAddressSuggestions(results);
    } catch (error) {
      console.error('Error searching addresses:', error);
    }
  }, []);

  const analyzeRoof = async (addressDetails: AddressDetails) => {
    setIsLoading(true);
    try {
      // Simulate roof analysis (in production, integrate with Google Solar API or SolarGIS)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock roof analysis data
      const mockRoofAnalysis: RoofAnalysis = {
        usableArea: 45 + Math.random() * 30, // 45-75 m²
        totalArea: 60 + Math.random() * 40, // 60-100 m²
        orientation: 180 + (Math.random() - 0.5) * 60, // ±30° from south
        inclination: 25 + Math.random() * 20, // 25-45°
        shadingFactor: 0.85 + Math.random() * 0.1, // 85-95%
        maxKwp: 0,
        roofSections: [
          {
            id: 'main',
            area: 35 + Math.random() * 20,
            orientation: 180 + (Math.random() - 0.5) * 40,
            inclination: 30 + Math.random() * 10,
            shadingFactor: 0.9 + Math.random() * 0.05,
            panelCount: 0
          }
        ]
      };

      // Calculate max kWp based on usable area (assuming 450W panels, 2.3m²/panel)
      const panelsPerM2 = 1 / 2.3;
      const maxPanels = Math.floor(mockRoofAnalysis.usableArea * panelsPerM2);
      mockRoofAnalysis.maxKwp = (maxPanels * 450) / 1000;
      mockRoofAnalysis.roofSections[0].panelCount = maxPanels;

      setRoofAnalysis(mockRoofAnalysis);
      onAddressAnalyzed(addressDetails, mockRoofAnalysis);
    } catch (error) {
      console.error('Error analyzing roof:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectAddress = (suggestion: any) => {
    const addressDetails: AddressDetails = {
      fullAddress: suggestion.display_name,
      street: suggestion.address?.road || '',
      number: suggestion.address?.house_number || '',
      postalCode: suggestion.address?.postcode || '',
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '',
      province: suggestion.address?.state || suggestion.address?.province || '',
      country: suggestion.address?.country || 'España'
    };

    setSelectedAddress(addressDetails);
    setAddress(suggestion.display_name);
    setAddressSuggestions([]);
    analyzeRoof(addressDetails);
  };

  return (
    <div className="card-premium animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano flex items-center justify-center animate-float">
          <Satellite className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Análisis Avanzado del Tejado
        </h2>
        <p className="text-gris-hotspot-medio">
          Introduce tu dirección para analizar automáticamente el potencial solar de tu tejado
        </p>
      </div>

      <div className="space-y-6">
        {/* Address Search */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-white">
            Dirección completa de la vivienda
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Introduce tu dirección completa (calle, número, ciudad...)"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                searchAddresses(e.target.value);
              }}
              className="input-premium w-full pl-12"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gris-hotspot-medio" />
          </div>

          {/* Address Suggestions */}
          {addressSuggestions.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 max-h-60 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectAddress(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors duration-200 border-b border-white/10 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-cobre-hotspot-claro flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">{suggestion.display_name}</p>
                      <p className="text-sm text-gris-hotspot-medio">
                        {suggestion.address?.postcode} {suggestion.address?.city || suggestion.address?.town}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gradient-to-r from-azul-hotspot/20 to-cobre-hotspot-plano/20 border border-cobre-hotspot-plano/30 rounded-xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-cobre-hotspot-plano/30 border-t-cobre-hotspot-plano rounded-full animate-spin"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Analizando tu tejado...</h3>
            <p className="text-gris-hotspot-medio">
              Estamos procesando imágenes satelitales y calculando el potencial solar de tu vivienda
            </p>
          </div>
        )}

        {/* Roof Analysis Results */}
        {roofAnalysis && selectedAddress && !isLoading && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                <Zap className="w-6 h-6 text-green-400" />
                <span>Análisis Completado</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400 mb-1">
                    {roofAnalysis.usableArea.toFixed(0)} m²
                  </p>
                  <p className="text-sm text-gris-hotspot-medio">Área útil del tejado</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400 mb-1">
                    {roofAnalysis.maxKwp.toFixed(1)} kWp
                  </p>
                  <p className="text-sm text-gris-hotspot-medio">Potencia máxima instalable</p>
                </div>
                
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400 mb-1">
                    {(roofAnalysis.shadingFactor * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-gris-hotspot-medio">Factor de sombreado</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Características del tejado:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gris-hotspot-medio">Orientación:</span>
                    <span className="text-white ml-2">{roofAnalysis.orientation.toFixed(0)}° desde el sur</span>
                  </div>
                  <div>
                    <span className="text-gris-hotspot-medio">Inclinación:</span>
                    <span className="text-white ml-2">{roofAnalysis.inclination.toFixed(0)}°</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="font-semibold text-white mb-2">Dirección analizada:</h4>
              <p className="text-gris-hotspot-medio">{selectedAddress.fullAddress}</p>
            </div>
          </div>
        )}

        {/* Information Card */}
        <div className="bg-azul-hotspot/30 border border-azul-hotspot/50 rounded-xl p-6">
          <h4 className="font-semibold text-white mb-3">¿Cómo funciona nuestro análisis?</h4>
          <ul className="space-y-2 text-sm text-gris-hotspot-medio">
            <li>• Utilizamos imágenes satelitales de alta resolución</li>
            <li>• Calculamos automáticamente la orientación e inclinación del tejado</li>
            <li>• Identificamos sombras de edificios y obstáculos cercanos</li>
            <li>• Estimamos el área útil disponible para paneles solares</li>
            <li>• Determinamos la potencia máxima instalable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddressAnalyzer;
