import React, { useState, useEffect } from 'react';
import { CloudRainIcon, ThermometerIcon, WaterDropIcon } from '../ui/svgs';
import { apiService } from '../utils/api';
import type { Field } from '../pages/FieldManagement';

interface WeatherData {
  location: { latitude: number; longitude: number };
  daily: Array<{
    date: string;
    temperature: { max: number; min: number };
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
  }>;
}

const WeatherForecast: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load fields from localStorage
  useEffect(() => {
    const savedFields = localStorage.getItem('agritech_fields');
    if (savedFields) {
      const parsedFields = JSON.parse(savedFields);
      const fieldsWithDates = parsedFields.map((field: any) => ({
        ...field,
        plantingDate: new Date(field.plantingDate),
      }));
      setFields(fieldsWithDates);
      
      // Auto-select first field if available
      if (fieldsWithDates.length > 0 && !selectedFieldId) {
        setSelectedFieldId(fieldsWithDates[0].id);
      }
    }
  }, []);

  // Fetch weather data when field is selected
  useEffect(() => {
    if (selectedFieldId) {
      fetchWeatherData();
    }
  }, [selectedFieldId]);

  const fetchWeatherData = async () => {
    const selectedField = fields.find(f => f.id === selectedFieldId);
    if (!selectedField) return;

    setLoading(true);
    setError(null);

    try {
      // Extract coordinates from field location
      // For demo purposes, use default Malawi coordinates if not available
      // In production, you'd geocode the location string to get coordinates
      const defaultCoordinates = { lat: -13.254, lon: 34.301 }; // Lilongwe, Malawi
      
      // Try to extract coordinates from field location if it contains them
      let latitude = defaultCoordinates.lat;
      let longitude = defaultCoordinates.lon;
      
      // Check if location contains coordinates in format "lat,lon"
      if (selectedField.location && selectedField.location.includes(',')) {
        const coordParts = selectedField.location.split(',');
        if (coordParts.length >= 2) {
          const parsedLat = parseFloat(coordParts[0].trim());
          const parsedLon = parseFloat(coordParts[1].trim());
          if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
            latitude = parsedLat;
            longitude = parsedLon;
          }
        }
      }

      // Use the new backend weather API
      const data = await apiService.getWeatherForecast(latitude, longitude);
      setWeatherData(data);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Unable to fetch weather data. Please check your connection.');
      
      // Fallback to mock data for demonstration
      setWeatherData({
        location: { latitude: -13.254, longitude: 34.301 },
        daily: [
          {
            date: new Date().toISOString().split('T')[0],
            temperature: { max: 28, min: 18 },
            precipitation: 0.0,
            windSpeed: 5.2,
            weatherCode: 1
          },
          {
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            temperature: { max: 29, min: 19 },
            precipitation: 2.5,
            windSpeed: 6.1,
            weatherCode: 61
          },
          {
            date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
            temperature: { max: 26, min: 17 },
            precipitation: 0.0,
            windSpeed: 4.8,
            weatherCode: 3
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (weatherCode: number): string => {
    // WMO Weather interpretation codes
    if (weatherCode === 0) return 'Clear sky';
    if (weatherCode <= 3) return 'Partly cloudy';
    if (weatherCode <= 48) return 'Fog';
    if (weatherCode <= 57) return 'Drizzle';
    if (weatherCode <= 67) return 'Rain';
    if (weatherCode <= 77) return 'Snow';
    if (weatherCode <= 82) return 'Showers';
    if (weatherCode <= 99) return 'Thunderstorm';
    return 'Unknown';
  };

  const getWeatherIcon = (weatherCode: number) => {
    if (weatherCode >= 61 && weatherCode <= 67) {
      // Rain
      return <CloudRainIcon className="w-8 h-8 text-blue-500" />;
    } else if (weatherCode >= 1 && weatherCode <= 3) {
      // Partly cloudy
      return (
        <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      );
    } else if (weatherCode === 0) {
      // Clear sky
      return (
        <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    } else {
      // Default cloud icon
      return (
        <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      );
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return 'text-red-600';
    if (temp >= 25) return 'text-orange-600';
    if (temp >= 20) return 'text-yellow-600';
    if (temp >= 15) return 'text-green-600';
    return 'text-blue-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Weather Forecast</h2>
        
        {/* Field Selection Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Field:</label>
          <select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Select a field</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name} ({field.cropType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {!selectedField && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Please select a field to view weather forecast</p>
        </div>
      )}

      {selectedField && weatherData && !loading && (
        <div className="space-y-4">
          {/* Current Weather Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{selectedField.name}</h3>
                <p className="text-sm text-gray-600">{selectedField.location}</p>
                <p className="text-sm text-gray-500">
                  {weatherData.location.latitude.toFixed(3)}, {weatherData.location.longitude.toFixed(3)}
                </p>
              </div>
              <div className="text-center">
                {getWeatherIcon(weatherData.daily[0]?.weatherCode || 0)}
                <p className="text-sm text-gray-600 mt-1">
                  {getWeatherDescription(weatherData.daily[0]?.weatherCode || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Forecast */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weatherData.daily.slice(0, 7).map((day, index) => (
              <div key={day.date} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">
                    {formatDate(day.date)}
                  </span>
                  {getWeatherIcon(day.weatherCode)}
                </div>

                <div className="space-y-2">
                  {/* Temperature */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <ThermometerIcon className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-600">Temp</span>
                    </div>
                    <div className="text-sm">
                      <span className={`font-medium ${getTemperatureColor(day.temperature.max)}`}>
                        {day.temperature.max}°
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className={`${getTemperatureColor(day.temperature.min)}`}>
                        {day.temperature.min}°
                      </span>
                    </div>
                  </div>

                  {/* Precipitation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <WaterDropIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Rain</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {day.precipitation.toFixed(1)}mm
                    </span>
                  </div>

                  {/* Wind Speed */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10l-2-2m0 0l2 2m-2-2v10" />
                      </svg>
                      <span className="text-sm text-gray-600">Wind</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {day.windSpeed.toFixed(1)} km/h
                    </span>
                  </div>

                  {/* Weather Description */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      {getWeatherDescription(day.weatherCode)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agricultural Recommendations based on weather */}
          {weatherData.daily[0] && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="font-medium text-emerald-900 mb-2">🌱 Field Recommendations</h3>
              <div className="space-y-1 text-sm text-emerald-800">
                {weatherData.daily[0].precipitation > 5 && (
                  <p>• Heavy rain expected - ensure proper drainage in fields</p>
                )}
                {weatherData.daily[0].precipitation === 0 && (
                  <p>• No rain forecast - consider irrigation if soil moisture is low</p>
                )}
                {weatherData.daily[0].temperature.max > 32 && (
                  <p>• High temperatures - monitor crops for heat stress and increase watering</p>
                )}
                {weatherData.daily[0].temperature.max < 18 && (
                  <p>• Cool temperatures - growth may slow down, avoid fertilizer application</p>
                )}
                {weatherData.daily[0].windSpeed > 15 && (
                  <p>• Strong winds expected - check plant supports and protect young seedlings</p>
                )}
                {weatherData.daily.filter(d => d.precipitation > 0).length >= 3 && (
                  <p>• Wet conditions forecast - monitor for fungal diseases and pests</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherForecast;
