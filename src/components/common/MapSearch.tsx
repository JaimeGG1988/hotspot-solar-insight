
import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface MapSearchProps {
  onSearch: (query: string) => Promise<void>;
  onSearchInputChange: (query: string) => Promise<void>;
  searchResults: any[];
  onSelectResult: (result: any) => void;
  isSearching: boolean;
}

const MapSearch: React.FC<MapSearchProps> = ({
  onSearch,
  onSearchInputChange,
  searchResults,
  onSelectResult,
  isSearching
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    onSearchInputChange(value);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    onSearch(searchQuery);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <label className="block text-lg font-semibold text-white">
        Buscar dirección
      </label>
      <div className="relative">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Escribe una dirección en España..."
              className="input-premium w-full pr-10"
              onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gris-hotspot-medio" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="btn-premium px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-gris-hotspot-profundo border border-white/20 rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((item, index) => (
              <button
                key={item.place_id || index}
                onClick={() => onSelectResult(item)}
                className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
              >
                <p className="text-white text-sm">{item.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSearch;
