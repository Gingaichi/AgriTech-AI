from pydantic import BaseModel
from typing import List, Optional

class DiseasePrediction(BaseModel):
    disease: str
    confidence: float
    treatment_suggestion: str

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    precipitation: float
    forecast: List[dict]

class CropRecommendation(BaseModel):
    crop: str
    confidence: float
    planting_advice: List[str]