from django.urls import path
from . import views

urlpatterns = [
    path('get-weather/', views.get_weather, name='get_weather'),
    path('analyze-crop/', views.analyze_crop, name='analyze_crop'),
]
