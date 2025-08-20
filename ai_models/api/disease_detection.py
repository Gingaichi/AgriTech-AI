import requests
import base64
import os
from dotenv import load_dotenv

load_dotenv()

class DiseaseDetector:
    """
    Plant disease detection using Plant.ID API
    """
    
    def __init__(self):
        self.api_key = os.getenv('PLANT_DISEASE_API_KEY')
        self.api_url = "https://crop.kindwise.com/api/v1"
    
    def encode_image(self, image_path):
        """Encode image to base64 for API"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    
    def predict(self, image_path):
        """Detect plant diseases using Plant.ID API"""
        try:
            # If no API key, return mock data for testing
            if not self.api_key:
                return self._get_mock_prediction()
            
            # Prepare API request
            encoded_image = self.encode_image(image_path)
            
            headers = {
                "Content-Type": "application/json",
                "Api-Key": self.api_key
            }
            
            payload = {
                "images": [encoded_image],
                "modifiers": ["crops_fast", "similar_images"],
                "plant_details": ["common_names", "url", "wiki_description", "taxonomy"]
            }
            
            # Make API request
            response = requests.post(self.api_url, json=payload, headers=headers)
            data = response.json()
            
            # Process response
            if response.status_code == 200 and data.get("suggestions"):
                suggestion = data["suggestions"][0]  # Top suggestion
                
                result = {
                    'status': 'success',
                    'plant_name': suggestion.get("plant_name", "Unknown"),
                    'probability': suggestion.get("probability", 0),
                    'is_healthy': self._check_health(suggestion),
                    'details': suggestion.get("plant_details", {}),
                    'message': self._generate_message(suggestion)
                }
                
                return result
            else:
                return {'error': 'API request failed', 'details': data}
                
        except Exception as e:
            return {'error': f'Prediction failed: {str(e)}'}
    
    def _check_health(self, suggestion):
        """Check if plant is healthy based on prediction"""
        plant_name = suggestion.get("plant_name", "").lower()
        # Simple check - if disease-related terms appear, plant might be unhealthy
        unhealthy_terms = ['disease', 'blight', 'rot', 'spot', 'mold', 'mildew', 'fungus']
        return not any(term in plant_name for term in unhealthy_terms)
    
    def _generate_message(self, suggestion):
        """Generate user-friendly message from API response"""
        plant_name = suggestion.get("plant_name", "plant")
        probability = suggestion.get("probability", 0) * 100
        
        if self._check_health(suggestion):
            return f"Your plant appears healthy! Identified as {plant_name} ({probability:.1f}% confidence)"
        else:
            return f"Possible issue detected: {plant_name} ({probability:.1f}% confidence). Please check for diseases."
    
    def _get_mock_prediction(self):
        """Return mock data when no API key is available (for testing)"""
        import random
        
        healthy_plants = ["Tomato plant", "Maize plant", "Healthy crop", "Bean plant"]
        diseased_plants = ["Tomato blight", "Maize rust", "Leaf spot disease", "Powdery mildew"]
        
        is_healthy = random.choice([True, False])
        plant_name = random.choice(healthy_plants) if is_healthy else random.choice(diseased_plants)
        probability = random.uniform(0.7, 0.95)
        
        return {
            'status': 'success',
            'plant_name': plant_name,
            'probability': probability,
            'is_healthy': is_healthy,
            'details': {'common_names': [plant_name]},
            'message': 'Healthy plant detected' if is_healthy else 'Possible disease detected',
            'note': 'Using mock data - add PLANT_DISEASE_API_KEY to .env for real detection'
        }