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
    return <ThermometerIcon className="w-8 h-8 text-gray-500" />;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 30) return 'text-red-600';
    if (temp >= 25) return 'text-orange-600';
    if (temp >= 20) return 'text-yellow-600';
    if (temp >= 15) return 'text-green-600';
    return 'text-blue-600';
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
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={fields.length === 0}
          >
            {fields.length === 0 ? (
              <option value="">No fields available</option>
            ) : (
              fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8">
          <CloudRainIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Add fields in Field Management to see weather forecasts</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-600 mb-3">
            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 text-sm mb-2">{error}</p>
          <button
            onClick={fetchWeatherData}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      ) : weatherData?.success && weatherData.weather ? (
        <div className="space-y-4">
          {/* Current Weather */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
            <div className="flex items-center gap-4">
              {getWeatherIcon(weatherData.weather.conditions)}
              <div>
                <h3 className="font-semibold text-gray-900">{selectedField?.location}</h3>
                <p className="text-sm text-gray-600">{weatherData.weather.conditions}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getTemperatureColor(weatherData.weather.temperature)}`}>
                {weatherData.weather.temperature.toFixed(1)}°C
              </div>
              <div className="text-sm text-gray-600">
                H: {weatherData.weather.today_high.toFixed(0)}° L: {weatherData.weather.today_low.toFixed(0)}°
              </div>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <WaterDropIcon className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Humidity</p>
              <p className="font-semibold text-gray-900">{weatherData.weather.humidity}%</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <CloudRainIcon className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Precipitation</p>
              <p className="font-semibold text-gray-900">{weatherData.weather.precipitation}mm</p>
            </div>
          </div>

          {/* 3-Day Forecast */}
          {weatherData.weather.forecast && weatherData.weather.forecast.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">3-Day Forecast</h4>
              <div className="space-y-2">
                {weatherData.weather.forecast.slice(0, 3).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getWeatherIcon(day.condition)}
                      <div>
                        <p className="font-medium text-gray-900">{day.day}</p>
                        <p className="text-sm text-gray-600">{day.condition}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {day.high.toFixed(0)}° / {day.low.toFixed(0)}°
                      </p>
                      {day.precipitation > 0 && (
                        <p className="text-sm text-blue-600">{day.precipitation}mm rain</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agricultural Insights */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Agricultural Insights</h4>
            <div className="space-y-1 text-sm text-green-800">
              {weatherData.weather.precipitation > 5 ? (
                <p>• Heavy rain expected - consider drainage and disease prevention</p>
              ) : weatherData.weather.precipitation > 0 ? (
                <p>• Light rain expected - good for crop growth</p>
              ) : (
                <p>• No rain expected - monitor soil moisture levels</p>
              )}
              
              {weatherData.weather.temperature > 30 ? (
                <p>• High temperatures - ensure adequate irrigation</p>
              ) : weatherData.weather.temperature < 15 ? (
                <p>• Cool temperatures - protect sensitive crops</p>
              ) : (
                <p>• Favorable temperatures for most crops</p>
              )}
              
              {weatherData.weather.humidity > 80 ? (
                <p>• High humidity - monitor for fungal diseases</p>
              ) : weatherData.weather.humidity < 40 ? (
                <p>• Low humidity - may need additional watering</p>
              ) : (
                <p>• Good humidity levels for crop health</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">Unable to load weather data</p>
        </div>
      )}
    </div>
  );
};

export default WeatherForecast;
