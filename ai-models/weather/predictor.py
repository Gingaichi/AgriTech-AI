from typing import Literal
from datetime import datetime
from ..schemas import CropRecommendation

class CropAdvisor:
    CROP_RULES = {
        "maize": {
            "min_temp": 18,
            "max_temp": 32,
            "min_rainfall": 500,
            "optimal_ph": (5.8, 7.0)
        },
        "wheat": {
            "min_temp": 12,
            "max_temp": 25,
            "min_rainfall": 300,
            "optimal_ph": (6.0, 7.5)
        }
    }
    
    def recommend_crop(self, 
                     ph: float, 
                     weather_data: dict,
                     month: int = None) -> CropRecommendation:
        """Recommend crops based on soil and weather conditions"""
        month = month or datetime.now().month
        season = self._get_season(month)
        
        recommendations = []
        for crop, params in self.CROP_RULES.items():
            score = 0
            
            # Temperature check
            avg_temp = weather_data.get('temperature', 20)
            if params['min_temp'] <= avg_temp <= params['max_temp']:
                score += 40
            elif avg_temp < params['min_temp']:
                score += 20 * (avg_temp / params['min_temp'])
            else:
                score += 20 * (params['max_temp'] / avg_temp)
            
            # Rainfall check
            annual_rain = weather_data.get('annual_rainfall', 800)
            if annual_rain >= params['min_rainfall']:
                score += 30
            else:
                score += 30 * (annual_rain / params['min_rainfall'])
            
            # Soil pH check
            if params['optimal_ph'][0] <= ph <= params['optimal_ph'][1]:
                score += 30
            else:
                adj_ph = max(ph, params['optimal_ph'][0])
                adj_ph = min(adj_ph, params['optimal_ph'][1])
                score += 30 * (1 - abs(ph - adj_ph) / 3)
            
            recommendations.append((crop, score / 100))
        
        # Sort by best score
        recommendations.sort(key=lambda x: x[1], reverse=True)
        best_crop, confidence = recommendations[0]
        
        # Generate planting advice
        advice = [
            f"Best planted in {self._get_planting_season(best_crop)}",
            f"Requires pH {self.CROP_RULES[best_crop]['optimal_ph'][0]}-{self.CROP_RULES[best_crop]['optimal_ph'][1]}"
        ]
        
        return CropRecommendation(
            crop=best_crop,
            confidence=confidence,
            planting_advice=advice
        )
    
    def _get_season(self, month: int) -> Literal['spring', 'summer', 'autumn', 'winter']:
        if 3 <= month <= 5:
            return 'spring'
        elif 6 <= month <= 8:
            return 'summer'
        elif 9 <= month <= 11:
            return 'autumn'
        return 'winter'
    
    def _get_planting_season(self, crop: str) -> str:
        seasons = {
            'maize': 'spring',
            'wheat': 'autumn'
        }
        return seasons.get(crop, 'spring')

# Example usage
if __name__ == '__main__':
    advisor = CropAdvisor()
    weather = {'temperature': 22, 'annual_rainfall': 600}
    rec = advisor.recommend_crop(ph=6.2, weather_data=weather)
    print(f"Recommended crop: {rec.crop} ({rec.confidence:.0%})")
    print("Advice:", "\n- ".join(rec.planting_advice))