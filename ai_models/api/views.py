import tempfile
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .disease_detection import DiseaseDetector
from .weather_prediction import WeatherPredictor
from .recommendations import RecommendationEngine


@csrf_exempt
def analyze_crop(request):
    """API endpoint for crop analysis"""
    if request.method == 'POST':
        try:
            # Get parameters
            crop_type = request.POST.get('crop_type', 'maize')
            latitude = float(request.POST.get('latitude', -13.9626))  # Lilongwe default
            longitude = float(request.POST.get('longitude', 33.7741))  # Lilongwe default
            
            # Initialize components
            disease_detector = DiseaseDetector()
            weather_predictor = WeatherPredictor()
            recommendation_engine = RecommendationEngine()
            
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
        
        weather_predictor = WeatherPredictor()
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


@csrf_exempt
def analyze_image(request):
    """API endpoint for advanced image analysis only"""
    if request.method == 'POST':
        try:
            crop_type = request.POST.get('crop_type', 'maize')
            
            # Initialize disease detector
            disease_detector = DiseaseDetector()
            
            # Process image if uploaded
            if request.FILES.get('image'):
                image_file = request.FILES['image']
                
                # Save temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                    for chunk in image_file.chunks():
                        tmp_file.write(chunk)
                    tmp_path = tmp_file.name
                
                # Analyze image
                disease_result = disease_detector.predict(tmp_path)
                
                # Clean up
                os.unlink(tmp_path)
                
                # Generate recommendations based on analysis
                recommendation_engine = RecommendationEngine()
                recommendations = recommendation_engine.get_recommendations(
                    crop_type, None, disease_result
                )
                
                return JsonResponse({
                    'success': True,
                    'analysis': disease_result,
                    'recommendations': recommendations,
                    'crop_type': crop_type
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'No image provided'
                })
                
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({'error': 'POST method required'})


@csrf_exempt
def weather_forecast(request):
    """Enhanced weather forecast with crop predictions"""
    try:
        latitude = float(request.GET.get('latitude', -13.9626))
        longitude = float(request.GET.get('longitude', 33.7741))
        crop_type = request.GET.get('crop_type', 'maize')
        
        weather_predictor = WeatherPredictor()
        weather_data = weather_predictor.get_weather(latitude, longitude)
        crop_prediction = weather_predictor.predict_crop_success(weather_data, crop_type)
        
        return JsonResponse({
            'success': True,
            'weather': weather_data,
            'crop_prediction': crop_prediction,
            'location': {
                'latitude': latitude,
                'longitude': longitude
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


def health_check(request):
    """Health check endpoint for the AI models service"""
    try:
        # Test basic functionality
        disease_detector = DiseaseDetector()
        weather_predictor = WeatherPredictor()
        recommendation_engine = RecommendationEngine()
        
        return JsonResponse({
            'status': 'healthy',
            'services': {
                'disease_detection': 'available',
                'weather_prediction': 'available', 
                'recommendations': 'available'
            },
            'timestamp': '2025-08-21T00:00:00Z'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)