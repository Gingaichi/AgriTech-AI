import openmeteo_requests
import httpx
from retry_requests import retry
from ..schemas import WeatherData

class WeatherService:
    def __init__(self):
        # Setup the OpenMeteo API client
        retry_session = retry(httpx.Client(), retries=5)
        self.client = openmeteo_requests.Client(session=retry_session)
    
    def get_forecast(self, lat: float, lon: float) -> WeatherData:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["temperature_2m", "relative_humidity_2m", "precipitation"],
            "daily": ["weather_code", "temperature_2m_max", "precipitation_sum"],
            "timezone": "auto"
        }
        
        responses = self.client.weather_api(url, params=params)
        response = responses[0]
        
        current = response.Current()
        daily = response.Daily()
        
        return WeatherData(
            temperature=current.Variables(0).Value(),
            humidity=current.Variables(1).Value(),
            precipitation=current.Variables(2).Value(),
            forecast=[{
                "date": date,
                "weather_code": code,
                "max_temp": temp,
                "precipitation": rain
            } for date, code, temp, rain in zip(
                daily.Time(),
                daily.Variables(0).ValuesAsNumpy(),
                daily.Variables(1).ValuesAsNumpy(),
                daily.Variables(2).ValuesAsNumpy()
            )]
        )

# Example usage
if __name__ == '__main__':
    service = WeatherService()
    weather = service.get_forecast(52.52, 13.41)  # Berlin coordinates
    print(f"Current temp: {weather.temperature}°C")
    print(f"Tomorrow's max: {weather.forecast[0]['max_temp']}°C")