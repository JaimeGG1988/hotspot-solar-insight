
import React from 'react';
import { CalculadoraData } from '../../types/CalculadoraTypes';
import { CheckCircle, Sun, Zap, Euro, Clock, RotateCcw, Phone } from 'lucide-react';

interface PasoResultadosProps {
  data: CalculadoraData;
  onPrev: () => void;
  onReset: () => void;
}

const PasoResultados: React.FC<PasoResultadosProps> = ({ data, onPrev, onReset }) => {
  const { resultados } = data;

  if (!resultados) {
    return (
      <div className="card-premium animate-fade-in text-center">
        <p className="text-white">No hay resultados disponibles</p>
      </div>
    );
  }

  const generarResumenNatural = () => {
    const cobertura = resultados.porcentajeCoberturaFV;
    const payback = resultados.periodoRetornoInversion_anios;
    const ahorro = resultados.ahorroEconomicoAnual_eur;

    let resumen = `Tu instalación solar de ${resultados.potenciaPicoInstalada_kWp.toFixed(1)} kWp generará aproximadamente ${resultados.produccionAnualEstimada_kWh.toLocaleString()} kWh al año, `;
    
    if (cobertura >= 70) {
      resumen += `cubriendo un excelente ${cobertura.toFixed(0)}% de tu consumo eléctrico. `;
    } else if (cobertura >= 50) {
      resumen += `cubriendo un ${cobertura.toFixed(0)}% de tu consumo eléctrico. `;
    } else {
      resumen += `cubriendo un ${cobertura.toFixed(0)}% de tu consumo eléctrico, lo que sugiere considerar una instalación más grande. `;
    }

    resumen += `Con un ahorro anual estimado de ${ahorro.toFixed(0)}€`;
    
    if (payback && payback <= 10) {
      resumen += ` y un período de retorno de ${payback.toFixed(1)} años, esta instalación representa una excelente inversión a largo plazo.`;
    } else if (payback && payback <= 15) {
      resumen += ` y un período de retorno de ${payback.toFixed(1)} años, esta instalación ofrece una rentabilidad sólida.`;
    } else {
      resumen += `, aunque el período de retorno de ${payback?.toFixed(1)} años sugiere revisar los costes de la instalación.`;
    }

    return resumen;
  };

  const metricas = [
    {
      titulo: 'Potencia Instalada',
      valor: `${resultados.potenciaPicoInstalada_kWp.toFixed(2)} kWp`,
      descripcion: `Con inversor de ${resultados.potenciaInversor_kW.toFixed(1)} kW`,
      icon: <Sun className="w-8 h-8" />,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      titulo: 'Producción Anual',
      valor: `${resultados.produccionAnualEstimada_kWh.toLocaleString()} kWh`,
      descripcion: 'Energía limpia generada al año',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      titulo: 'Cobertura Energética',
      valor: `${resultados.porcentajeCoberturaFV.toFixed(0)}%`,
      descripcion: 'De tu consumo cubierto por solar',
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      titulo: 'Ahorro Anual',
      valor: `${resultados.ahorroEconomicoAnual_eur.toFixed(0)}€`,
      descripcion: 'Reducción en tu factura eléctrica',
      icon: <Euro className="w-8 h-8" />,
      color: 'from-emerald-500 to-green-600'
    },
    {
      titulo: 'Inversión Total',
      valor: `${resultados.costeTotalInstalacion_eur.toFixed(0)}€`,
      descripcion: 'Coste completo de la instalación',
      icon: <Euro className="w-8 h-8" />,
      color: 'from-gray-500 to-gray-600'
    },
    {
      titulo: 'Período de Retorno',
      valor: resultados.periodoRetornoInversion_anios 
        ? `${resultados.periodoRetornoInversion_anios.toFixed(1)} años`
        : 'No rentable',
      descripcion: 'Tiempo para recuperar la inversión',
      icon: <Clock className="w-8 h-8" />,
      color: resultados.periodoRetornoInversion_anios && resultados.periodoRetornoInversion_anios <= 10
        ? 'from-green-500 to-emerald-500'
        : 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header de resultados */}
      <div className="card-premium text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse-glow">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          ¡Estimación Completada!
        </h2>
        <p className="text-xl text-gris-hotspot-medio">
          Aquí tienes los resultados de tu instalación solar fotovoltaica
        </p>
      </div>

      {/* Resumen en lenguaje natural */}
      <div className="card-premium">
        <h3 className="text-2xl font-bold text-white mb-4">
          Resumen Ejecutivo
        </h3>
        <p className="text-lg text-gris-hotspot-medio leading-relaxed">
          {generarResumenNatural()}
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricas.map((metrica, index) => (
          <div 
            key={metrica.titulo}
            className="card-premium group hover:scale-105"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${metrica.color} flex items-center justify-center text-white mb-4 group-hover:animate-pulse`}>
              {metrica.icon}
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              {metrica.titulo}
            </h4>
            <p className="text-3xl font-bold text-gradient mb-2">
              {metrica.valor}
            </p>
            <p className="text-sm text-gris-hotspot-medio">
              {metrica.descripcion}
            </p>
          </div>
        ))}
      </div>

      {/* Beneficios ambientales */}
      <div className="card-premium bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            🌱
          </div>
          <span>Impacto Ambiental Positivo</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {(resultados.produccionAnualEstimada_kWh * 0.3 / 1000).toFixed(1)} t
            </p>
            <p className="text-sm text-gris-hotspot-medio">
              CO₂ evitado anualmente
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {(resultados.produccionAnualEstimada_kWh * 25 / 1000).toFixed(0)} MWh
            </p>
            <p className="text-sm text-gris-hotspot-medio">
              Energía limpia en 25 años
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {(resultados.produccionAnualEstimada_kWh * 0.3 * 25 / 1000).toFixed(0)} t
            </p>
            <p className="text-sm text-gris-hotspot-medio">
              CO₂ total evitado
            </p>
          </div>
        </div>
      </div>

      {/* Llamada a la acción */}
      <div className="card-premium bg-gradient-to-r from-cobre-hotspot-plano/20 to-cobre-hotspot-claro/20 border-cobre-hotspot-plano/30 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          ¿Listo para dar el siguiente paso?
        </h3>
        <p className="text-lg text-gris-hotspot-medio mb-6">
          Contacta con HotSpot360 para convertir esta estimación en realidad
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="tel:+34900000000"
            className="btn-premium flex items-center space-x-2 px-8 py-4"
          >
            <Phone className="w-5 h-5" />
            <span>Llamar Ahora</span>
          </a>
          <a
            href="mailto:info@hotspot360.com"
            className="px-8 py-4 border-2 border-cobre-hotspot-plano text-cobre-hotspot-claro rounded-xl hover:bg-cobre-hotspot-plano hover:text-white transition-all duration-300"
          >
            Enviar Email
          </a>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border-2 border-white/30 text-white rounded-xl hover:border-cobre-hotspot-plano hover:bg-white/10 transition-all duration-300"
        >
          Anterior
        </button>
        
        <button
          onClick={onReset}
          className="flex items-center space-x-2 px-8 py-3 bg-gris-hotspot-profundo text-white rounded-xl hover:bg-gris-hotspot-medio transition-all duration-300"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Nueva Estimación</span>
        </button>
      </div>

      {/* Footer con información adicional */}
      <div className="text-center text-sm text-gris-hotspot-medio">
        <p>
          * Esta estimación es orientativa y se basa en datos promedio. 
          Los resultados reales pueden variar según condiciones específicas del emplazamiento.
        </p>
        <p className="mt-2">
          Desarrollado por <span className="text-cobre-hotspot-claro font-semibold">HotSpot360</span> - 
          Your 360º Partner en energía solar
        </p>
      </div>
    </div>
  );
};

export default PasoResultados;
