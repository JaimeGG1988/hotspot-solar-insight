
// Proxy serverless para PVGIS - soluciona problemas de CORS
export default async function handler(req, res) {
  // Solo permitir métodos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lng, peakpower = 1, angle = 35, aspect = 0 } = req.query;

  // Validar parámetros requeridos
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing required parameters: lat, lng' });
  }

  const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lng}&peakpower=${peakpower}&loss=14&angle=${angle}&aspect=${aspect}&mountingplace=building&outputformat=json`;

  try {
    console.log(`Fetching PVGIS data for: ${lat}, ${lng}`);
    
    const response = await fetch(pvgisUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SolarCalculator/1.0',
      },
    });

    if (!response.ok) {
      console.error(`PVGIS API error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `PVGIS API error: ${response.statusText}`,
        fallback: true
      });
    }

    const data = await response.json();
    
    // Verificar que la respuesta tenga la estructura esperada
    if (!data.outputs || !data.outputs.totals || !data.outputs.totals.fixed) {
      console.warn('Invalid PVGIS response structure');
      return res.status(500).json({
        error: 'Invalid PVGIS response structure',
        fallback: true
      });
    }

    console.log(`PVGIS data successfully fetched for ${lat}, ${lng}`);
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error calling PVGIS API:', error);
    return res.status(500).json({
      error: 'Failed to fetch PVGIS data',
      details: error.message,
      fallback: true
    });
  }
}
