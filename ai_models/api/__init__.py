from .disease_detection import DiseaseDetector
from .weather_prediction import WeatherPredictor
from .recommendations import RecommendationEngine

def create_disease_detector():
    return DiseaseDetector()

def create_weather_predictor():
    return WeatherPredictor()

def create_recommendation_engine():
    return RecommendationEngine()
