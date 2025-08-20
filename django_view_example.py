# In your Django views.py
from ai_models import create_disease_detector, create_weather_predictor, create_recommendation_engine
import tempfile
import os
from django.http import JsonResponse

def analyze_crop(request):
    """API endpoint for crop analysis"""
    if request.method == 'POST':
        try:
            # Get parameters
            crop_type = request.POST.get('crop_type', 'maize')
            latitude = float(request.POST.get('latitude', -13.9626))  # Lilongwe default
            longitude = float(request.POST.get('longitude', 33.7741))  # Lilongwe default
            
            # Initialize components
            disease_detector = create_disease_detector()
            weather_predictor = create_weather_predictor()
            recommendation_engine = create_recommendation_engine()
            
            # Get weather data
            weather_data = weather_predictor.get_weather(latitude, longitude)
            crop_prediction = weather_predictor.predict_crop_success(weather_data, crop_type)
            
            # Process image if uploaded
            disease_result = None
            if request.FILES.get('crop_image'):
                image_file = request.FILES['crop_image']
                
                # Save temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                    for chunk in image_file.chunks():
                        tmp_file.write(chunk)
                    tmp_path = tmp_file.name
                
                # Analyze image
                disease_result = disease_detector.predict(tmp_path)
                
                # Clean up
                os.unlink(tmp_path)
            
            # Generate recommendations
            recommendations = recommendation_engine.get_recommendations(
                crop_type, weather_data, disease_result
            )
            
            # Return results
            return JsonResponse({
                'success': True,
                'weather': weather_data,
                'crop_prediction': crop_prediction,
                'disease_result': disease_result,
                'recommendations': recommendations
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({'error': 'POST method required'})

def get_weather(request):
    """API endpoint for weather data only"""
    try:
        latitude = float(request.GET.get('latitude', -13.9626))
        longitude = float(request.GET.get('longitude', 33.7741))
        
        weather_predictor = create_weather_predictor()
        weather_data = weather_predictor.get_weather(latitude, longitude)
        
        return JsonResponse({
            'success': True,
            'weather': weather_data
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })