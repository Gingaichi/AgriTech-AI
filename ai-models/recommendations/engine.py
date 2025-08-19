from typing import List, Dict
from dataclasses import dataclass
from enum import Enum
from ..schemas import DiseasePrediction, WeatherData

class AlertLevel(Enum):
    INFO = 1
    WARNING = 2
    CRITICAL = 3

@dataclass
class Recommendation:
    message: str
    alert_level: AlertLevel
    actions: List[str]

class RecommendationEngine:
    def generate(self, 
                disease: DiseasePrediction = None,
                weather: WeatherData = None,
                soil_ph: float = None) -> List[Recommendation]:
        """Generate actionable farming recommendations"""
        recommendations = []
        
        # Disease-based recommendations
        if disease and disease.confidence > 0.5:
            rec = Recommendation(
                message=f"Disease detected: {disease.disease}",
                alert_level=AlertLevel.CRITICAL,
                actions=[
                    disease.treatment_suggestion,
                    "Isolate affected plants",
                    "Monitor spread daily"
                ]
            )
            recommendations.append(rec)
        
        # Weather-based recommendations
        if weather:
            # Temperature alerts
            if weather.temperature > 35:
                rec = Recommendation(
                    message="Extreme heat warning",
                    alert_level=AlertLevel.WARNING,
                    actions=[
                        "Increase watering frequency",
                        "Provide shade if possible",
                        "Harvest in early morning"
                    ]
                )
                recommendations.append(rec)
            elif weather.temperature < 5:
                rec = Recommendation(
                    message="Frost warning",
                    alert_level=AlertLevel.CRITICAL,
                    actions=[
                        "Cover sensitive plants",
                        "Water soil to retain heat",
                        "Delay planting"
                    ]
                )
                recommendations.append(rec)
            
            # Rainfall alerts
            if any(day['precipitation'] > 20 for day in weather.forecast[:3]):
                rec = Recommendation(
                    message="Heavy rain expected",
                    alert_level=AlertLevel.WARNING,
                    actions=[
                        "Ensure proper drainage",
                        "Delay fertilizer application",
                        "Harvest ripe produce"
                    ]
                )
                recommendations.append(rec)
        
        # Soil-based recommendations
        if soil_ph:
            if soil_ph < 5.5:
                rec = Recommendation(
                    message="Soil too acidic",
                    alert_level=AlertLevel.WARNING,
                    actions=[
                        "Add lime to raise pH",
                        "Test pH again in 2 weeks",
                        "Consider acid-loving crops"
                    ]
                )
                recommendations.append(rec)
            elif soil_ph > 8.0:
                rec = Recommendation(
                    message="Soil too alkaline",
                    alert_level=AlertLevel.WARNING,
                    actions=[
                        "Add sulfur to lower pH",
                        "Incorporate organic matter",
                        "Consider alkaline-tolerant crops"
                    ]
                )
                recommendations.append(rec)
        
        return recommendations

# Example usage
if __name__ == '__main__':
    engine = RecommendationEngine()
    
    # Mock data
    disease = DiseasePrediction(
        disease="Late Blight",
        confidence=0.85,
        treatment_suggestion="Apply copper-based fungicide"
    )
    weather = WeatherData(
        temperature=38.5,
        humidity=45,
        precipitation=0,
        forecast=[{"precipitation": 25}]
    )
    
    recs = engine.generate(
        disease=disease,
        weather=weather,
        soil_ph=4.8
    )
    
    for rec in recs:
        print(f"[{rec.alert_level.name}] {rec.message}")
        print("Actions:", "\n- ".join(rec.actions))