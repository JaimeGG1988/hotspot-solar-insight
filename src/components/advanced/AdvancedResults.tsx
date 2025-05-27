
import React, { useState } from 'react';
import { AdvancedResults } from '../../types/AdvancedTypes';
import { TrendingUp, DollarSign, Leaf, Download, Share2, Calculator } from 'lucide-react';

interface AdvancedResultsProps {
  results: AdvancedResults;
  onNewCalculation: () => void;
}

const AdvancedResults: React.FC<AdvancedResultsProps> = ({ results, onNewCalculation }) => {
  const [selectedScenario, setSelectedScenario] = useState(0);

  const generateReport = () => {
    // In production, this would generate a PDF report
    console.log('Generating PDF report...', results);
    alert('Función de generación de informe en desarrollo');
  };

  const shareResults = () => {
    // In production, this would generate a shareable link
    console.log('Sharing results...', results);
    alert('Función de compartir en desarrollo');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Results */}
      <div className="card-premium text-center bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse-glow">
          <TrendingUp className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          ¡Análisis Completo Finalizado!
        </h2>
        <p className="text-xl text-gris-hotspot-medio mb-6">
          Tu vivienda tiene un excelente potencial solar
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-green-400 mb-2">
              {results.potenciaPicoInstalada_kWp.toFixed(1)} kWp
            </p>
            <p className="text-gris-hotspot-medio">Sistema recomendado</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-400 mb-2">
              {results.financialAnalysis.annualSavings.toFixed(0)}€
            </p>
            <p className="text-gris-hotspot-medio">Ahorro anual</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-400 mb-2">
              {results.financialAnalysis.paybackYears.toFixed(1)} años
            </p>
            <p className="text-gris-hotspot-medio">Periodo de retorno</p>
          </div>
        </div>
      </div>

      {/* Financial Scenarios */}
      <div className="card-premium">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <DollarSign className="w-6 h-6 text-cobre-hotspot-claro" />
          <span>Escenarios Financieros</span>
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {results.financialAnalysis.scenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={() => setSelectedScenario(index)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                selectedScenario === index
                  ? 'border-cobre-hotspot-plano bg-cobre-hotspot-plano/20'
                  : 'border-white/20 bg-white/5 hover:border-cobre-hotspot-plano/50'
              }`}
            >
              <h4 className="font-semibold text-white mb-2">{scenario.name}</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gris-hotspot-medio">
                  Sistema: <span className="text-white">{scenario.systemSize} kWp</span>
                </p>
                <p className="text-gris-hotspot-medio">
                  Inversión: <span className="text-white">{scenario.cost.toLocaleString()}€</span>
                </p>
                <p className="text-gris-hotspot-medio">
                  ROI: <span className="text-green-400">{scenario.roi.toFixed(1)}%</span>
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          <h4 className="text-xl font-semibold text-white mb-4">
            {results.financialAnalysis.scenarios[selectedScenario].name} - Detalle
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-cobre-hotspot-claro mb-1">
                {results.financialAnalysis.scenarios[selectedScenario].systemSize} kWp
              </p>
              <p className="text-sm text-gris-hotspot-medio">Potencia del sistema</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cobre-hotspot-claro mb-1">
                {results.financialAnalysis.scenarios[selectedScenario].cost.toLocaleString()}€
              </p>
              <p className="text-sm text-gris-hotspot-medio">Inversión total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400 mb-1">
                {results.financialAnalysis.scenarios[selectedScenario].annualSavings.toFixed(0)}€
              </p>
              <p className="text-sm text-gris-hotspot-medio">Ahorro anual</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400 mb-1">
                {results.financialAnalysis.scenarios[selectedScenario].payback.toFixed(1)} años
              </p>
              <p className="text-sm text-gris-hotspot-medio">Payback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subsidies */}
      <div className="card-premium bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
        <h3 className="text-2xl font-bold text-white mb-6">
          Subvenciones y Ayudas Disponibles
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400 mb-2">
              {results.subsidies.totalAmount.toLocaleString()}€
            </p>
            <p className="text-gris-hotspot-medio">Total ayudas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400 mb-2">
              {results.subsidies.netSystemCost.toLocaleString()}€
            </p>
            <p className="text-gris-hotspot-medio">Coste final</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400 mb-2">
              {((results.subsidies.totalAmount / results.costeTotalInstalacion_eur) * 100).toFixed(0)}%
            </p>
            <p className="text-gris-hotspot-medio">Descuento</p>
          </div>
        </div>

        <div className="space-y-3">
          {[...results.subsidies.national, ...results.subsidies.regional, ...results.subsidies.local].map((subsidy, index) => (
            <div key={index} className="bg-white/10 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-white">{subsidy.name}</h4>
                  <p className="text-sm text-gris-hotspot-medio">{subsidy.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-400">{subsidy.amount.toLocaleString()}€</p>
                  <p className="text-xs text-gris-hotspot-medio">{subsidy.type}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="card-premium bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <Leaf className="w-6 h-6 text-green-400" />
          <span>Impacto Ambiental</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {results.environmentalImpact.co2SavedAnnually.toFixed(1)} t
            </p>
            <p className="text-gris-hotspot-medio">CO₂ evitado anualmente</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {results.environmentalImpact.co2Saved25Years.toFixed(0)} t
            </p>
            <p className="text-gris-hotspot-medio">CO₂ evitado en 25 años</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {results.environmentalImpact.treesEquivalent}
            </p>
            <p className="text-gris-hotspot-medio">Árboles equivalentes</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={generateReport}
          className="btn-premium flex items-center space-x-2 px-8 py-4"
        >
          <Download className="w-5 h-5" />
          <span>Descargar Informe PDF</span>
        </button>
        
        <button
          onClick={shareResults}
          className="px-8 py-4 border-2 border-cobre-hotspot-plano text-cobre-hotspot-claro rounded-xl hover:bg-cobre-hotspot-plano hover:text-white transition-all duration-300 flex items-center space-x-2"
        >
          <Share2 className="w-5 h-5" />
          <span>Compartir Resultados</span>
        </button>
        
        <button
          onClick={onNewCalculation}
          className="px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
        >
          <Calculator className="w-5 h-5" />
          <span>Nueva Calculación</span>
        </button>
      </div>

      {/* Contact CTA */}
      <div className="card-premium bg-gradient-to-r from-cobre-hotspot-plano/20 to-cobre-hotspot-claro/20 border-cobre-hotspot-plano/30 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          ¿Listo para hacer realidad tu instalación solar?
        </h3>
        <p className="text-lg text-gris-hotspot-medio mb-6">
          Contacta con HotSpot360 para una evaluación detallada y presupuesto personalizado
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:+34900000000"
            className="btn-premium px-8 py-4"
          >
            Llamar Ahora
          </a>
          <a
            href="mailto:info@hotspot360.com"
            className="px-8 py-4 border-2 border-cobre-hotspot-plano text-cobre-hotspot-claro rounded-xl hover:bg-cobre-hotspot-plano hover:text-white transition-all duration-300"
          >
            Solicitar Presupuesto
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdvancedResults;
