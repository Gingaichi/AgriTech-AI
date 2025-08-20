import requests
import datetime

class WeatherPredictor:
    """
    Weather integration using free Open-Meteo API
    """
    
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
    
    def get_weather(self, latitude=-13.9626, longitude=33.7741):  # Default: Lilongwe, Malawi
        """Get current weather data from Open-Meteo"""
        try:
            params = {
                'latitude': latitude,
                'longitude': longitude,
                'current': 'temperature_2m,relative_humidity_2m,precipitation,weather_code',
                'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
                'timezone': 'auto',
                'forecast_days': 3
            }
            
            response = requests.get(self.base_url, params=params)
            data = response.json()
            
            if 'current' in data:
                return self._format_weather_data(data)
            else:
                return self._get_mock_weather()
                
        except Exception as e:
            print(f"Weather API error: {e}")
            return self._get_mock_weather()
    
    def _format_weather_data(self, data):
        """Format Open-Meteo data into a user-friendly format"""
        current = data['current']
        daily = data['daily']
        
        # Get weather condition from weather code
        weather_code = current.get('weather_code', 0)
        condition = self._get_weather_condition(weather_code)
        
        return {
            'temperature': current.get('temperature_2m', 0),
            'humidity': current.get('relative_humidity_2m', 0),
            'precipitation': current.get('precipitation', 0),
            'conditions': condition,
            'today_high': daily['temperature_2m_max'][0],
            'today_low': daily['temperature_2m_min'][0],
            'source': 'open-meteo',
            'forecast': self._get_forecast_summary(daily)
        }
    
    def _get_weather_condition(self, weather_code):
        """Convert weather code to human-readable condition"""
        # Simplified weather code mapping
        weather_codes = {
            0: 'Clear sky',
            1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing rime fog',
            51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
            61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
            80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
            95: 'Thunderstorm'
        }
        return weather_codes.get(weather_code, 'Unknown')
    
    def _get_forecast_summary(self, daily_data):
        """Create a simple forecast summary"""
        days = ['Today', 'Tomorrow', 'Day after tomorrow']
        summary = []
        
        for i in range(3):
            if i < len(daily_data['time']):
                day_summary = {
                    'day': days[i],
                    'high': daily_data['temperature_2m_max'][i],
                    'low': daily_data['temperature_2m_min'][i],
                    'precipitation': daily_data['precipitation_sum'][i],
                    'condition': self._get_weather_condition(daily_data['weather_code'][i])
                }
                summary.append(day_summary)
        
        return summary
    
    def _get_mock_weather(self):
        """Provide mock weather data if API fails"""
        return {
            'temperature': 25.7,
            'humidity': 65,
            'precipitation': 0,
            'conditions': 'Partly cloudy',
            'today_high': 28,
            'today_low': 18,
            'source': 'mock',
            'forecast': [
                {'day': 'Today', 'high': 28, 'low': 18, 'precipitation': 0, 'condition': 'Partly cloudy'},
                {'day': 'Tomorrow', 'high': 27, 'low': 17, 'precipitation': 2, 'condition': 'Light rain'},
                {'day': 'Day after tomorrow', 'high': 29, 'low': 19, 'precipitation': 0, 'condition': 'Clear sky'}
            ]
        }
    
    def predict_crop_success(self, weather_data, crop_type="maize"):
        """Predict crop success based on weather conditions"""
        temp = weather_data['temperature']
        humidity = weather_data['humidity']
        precipitation = weather_data['precipitation']
        
        # Simple rules for common Malawian crops
        crop_rules = {
            'maize': {'ideal_temp': (18, 30), 'ideal_rain': (1, 5)},
            'tomato': {'ideal_temp': (21, 24), 'ideal_rain': (1, 3)},
            'beans': {'ideal_temp': (20, 25), 'ideal_rain': (1, 4)},
            'cassava': {'ideal_temp': (25, 29), 'ideal_rain': (1, 5)}
        }
        
        rules = crop_rules.get(crop_type.lower(), {'ideal_temp': (18, 30), 'ideal_rain': (1, 5)})
        
        temp_ok = rules['ideal_temp'][0] <= temp <= rules['ideal_temp'][1]
        rain_ok = rules['ideal_rain'][0] <= precipitation <= rules['ideal_rain'][1]
        
        if temp_ok and rain_ok:
            success = f"Good conditions for {crop_type}"
        elif not temp_ok and not rain_ok:
            success = f"Challenging temperature and rainfall for {crop_type}"
        elif not temp_ok:
            success = f"Temperature not ideal for {crop_type}"
        else:
            success = f"Rainfall not ideal for {crop_type}"
        
        return {
            'prediction': success,
            'ideal_temp': f"{rules['ideal_temp'][0]}-{rules['ideal_temp'][1]}°C",
            'ideal_rain': f"{rules['ideal_rain'][0]}-{rules['ideal_rain'][1]}mm"
        }