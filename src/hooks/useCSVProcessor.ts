
import { useState } from 'react';

interface CSVData {
  hourlyConsumption: number[];
  monthlyConsumption: number[];
  annualConsumption: number;
  isValid: boolean;
  errors: string[];
}

export const useCSVProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvData, setCSVData] = useState<CSVData | null>(null);

  const processCSVFile = async (file: File): Promise<CSVData> => {
    setIsProcessing(true);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const result = parseCSVContent(text);
          setCSVData(result);
          resolve(result);
        } catch (error) {
          const errorResult: CSVData = {
            hourlyConsumption: [],
            monthlyConsumption: [],
            annualConsumption: 0,
            isValid: false,
            errors: [`Error procesando archivo: ${error}`]
          };
          setCSVData(errorResult);
          reject(errorResult);
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        const errorResult: CSVData = {
          hourlyConsumption: [],
          monthlyConsumption: [],
          annualConsumption: 0,
          isValid: false,
          errors: ['Error leyendo el archivo']
        };
        setCSVData(errorResult);
        setIsProcessing(false);
        reject(errorResult);
      };
      
      reader.readAsText(file);
    });
  };

  const parseCSVContent = (content: string): CSVData => {
    const errors: string[] = [];
    let hourlyConsumption: number[] = [];
    
    // Detectar separador (coma o punto y coma)
    const hasSemicolon = content.includes(';');
    const separator = hasSemicolon ? ';' : ',';
    
    // Procesar líneas
    const lines = content.trim().split('\n');
    const dataLines = lines.filter(line => line.trim() && !line.startsWith('#'));
    
    // Validar número de registros
    if (dataLines.length !== 8760) {
      errors.push(`Se esperan 8760 registros horarios, encontrados: ${dataLines.length}`);
    }
    
    // Procesar cada línea
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      const parts = line.split(separator);
      
      if (parts.length === 0) continue;
      
      // Buscar el valor numérico (puede estar en cualquier columna)
      let value: number | null = null;
      for (const part of parts) {
        const cleanPart = part.replace(',', '.').trim();
        const parsed = parseFloat(cleanPart);
        if (!isNaN(parsed) && parsed >= 0) {
          value = parsed;
          break;
        }
      }
      
      if (value === null) {
        errors.push(`Línea ${i + 1}: No se encontró valor numérico válido`);
        hourlyConsumption.push(0);
      } else {
        hourlyConsumption.push(value);
      }
    }
    
    // Calcular consumos mensuales (asumiendo 30.44 días promedio por mes)
    const hoursPerMonth = [744, 672, 744, 720, 744, 720, 744, 744, 720, 744, 720, 744]; // Horas reales por mes
    const monthlyConsumption: number[] = [];
    let currentHour = 0;
    
    for (let month = 0; month < 12; month++) {
      const monthStart = currentHour;
      const monthEnd = Math.min(currentHour + hoursPerMonth[month], hourlyConsumption.length);
      const monthSum = hourlyConsumption.slice(monthStart, monthEnd).reduce((sum, val) => sum + val, 0);
      monthlyConsumption.push(monthSum);
      currentHour = monthEnd;
    }
    
    const annualConsumption = hourlyConsumption.reduce((sum, val) => sum + val, 0);
    
    return {
      hourlyConsumption,
      monthlyConsumption,
      annualConsumption,
      isValid: errors.length === 0,
      errors
    };
  };

  const resetCSVData = () => {
    setCSVData(null);
  };

  return {
    processCSVFile,
    isProcessing,
    csvData,
    resetCSVData
  };
};
