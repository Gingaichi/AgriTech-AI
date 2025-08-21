from django.urls import path
from . import views

urlpatterns = [
    path('get-weather/', views.get_weather, name='get_weather'),
    path('analyze-crop/', views.analyze_crop, name='analyze_crop'),
    path('analyze-image/', views.analyze_image, name='analyze_image'),
    path('weather-forecast/', views.weather_forecast, name='weather_forecast'),
    path('health/', views.health_check, name='health_check'),
]
