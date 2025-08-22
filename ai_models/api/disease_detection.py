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
        self.api_key = os.getenv('PLANTID_API_KEY')
        self.api_url = "https://crop.kindwise.com/api/v1/identification"
    
    def encode_image(self, image_path):
        """Encode image to base64 for API with proper MIME type"""
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")
            # Determine MIME type based on file extension
            if image_path.lower().endswith('.png'):
                mime_type = 'image/png'
            elif image_path.lower().endswith(('.jpg', '.jpeg')):
                mime_type = 'image/jpeg'
            else:
                mime_type = 'image/jpeg'  # default
            
            return f"data:{mime_type};base64,{image_data}"
    
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
                "similar_images": True
            }
            
            # Make API request
            response = requests.post(self.api_url, json=payload, headers=headers)
            
            # Check response content type and status
            print(f"Plant.ID API response status: {response.status_code}")
            print(f"Plant.ID API response headers: {dict(response.headers)}")
            print(f"Plant.ID API response content (first 500 chars): {response.text[:500]}")
            print(f"Image path: {image_path}")
            print(f"API key length: {len(self.api_key) if self.api_key else 0}")
            print(f"Payload keys: {list(payload.keys())}")
            print(f"Encoded image prefix: {encoded_image[:50] if encoded_image else 'None'}...")
            
            # Try to parse JSON response
            try:
                response_text = response.text.strip()
                if not response_text:
                    print("Empty response from Plant.ID API - likely invalid image")
                    return {
                        'status': 'success',
                        'plant_name': 'Unable to analyze image',
                        'probability': 0,
                        'is_healthy': True,
                        'details': {},
                        'message': 'Image quality too low for analysis. Please upload a clearer image of the plant.'
                    }
                
                data = response.json()
            except ValueError as json_error:
                print(f"JSON parsing error: {json_error}")
                print(f"Response text: {response.text}")
                return {
                    'status': 'error',
                    'error': f'Invalid JSON response from Plant.ID API: {str(json_error)}',
                    'plant_name': 'Unknown',
                    'probability': 0,
                    'is_healthy': True,
                    'details': {},
                    'message': 'Plant identification service returned invalid response'
                }
            
            # Process response
            if response.status_code in [200, 201] and data.get("result"):
                result_data = data["result"]
                
                # Check if image contains a plant
                is_plant = result_data.get("is_plant", {})
                if not is_plant.get("binary", False):
                    return {
                        'status': 'success',
                        'plant_name': 'No plant detected',
                        'probability': is_plant.get("probability", 0),
                        'is_healthy': True,
                        'details': {},
                        'message': f'No plant detected in image (confidence: {is_plant.get("probability", 0):.1%})'
                    }
                
                # Get disease and crop suggestions
                disease_suggestions = result_data.get("disease", {}).get("suggestions", [])
                crop_suggestions = result_data.get("crop", {}).get("suggestions", [])
                
                # Use crop suggestion if available, otherwise use disease suggestion
                if crop_suggestions:
                    suggestion = crop_suggestions[0]
                    plant_name = suggestion.get("name", "Unknown crop")
                    is_healthy = True  # Crop identified, likely healthy
                elif disease_suggestions:
                    suggestion = disease_suggestions[0]
                    plant_name = suggestion.get("name", "Unknown disease")
                    is_healthy = False  # Disease detected
                else:
                    return {
                        'status': 'success',
                        'plant_name': 'Plant detected but unidentified',
                        'probability': is_plant.get("probability", 0),
                        'is_healthy': True,
                        'details': {},
                        'message': 'Plant detected but could not be identified'
                    }
                
                result = {
                    'status': 'success',
                    'plant_name': plant_name,
                    'probability': suggestion.get("probability", 0),
                    'is_healthy': is_healthy,
                    'details': suggestion.get("details", {}),
                    'message': self._generate_message_from_plantid(suggestion, is_healthy)
                }
                
                return result
            else:
                return {
                    'status': 'error', 
                    'error': f'API request failed with status {response.status_code}', 
                    'details': data,
                    'plant_name': 'Unknown',
                    'probability': 0,
                    'is_healthy': True,
                    'message': 'Could not analyze image'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': f'Prediction failed: {str(e)}',
                'plant_name': 'Unknown',
                'probability': 0,
                'is_healthy': True,
                'details': {},
                'message': f'Error analyzing image: {str(e)}'
            }
    
    def _generate_message_from_plantid(self, suggestion, is_healthy):
        """Generate user-friendly message from Plant.ID API response"""
        name = suggestion.get("name", "unknown")
        probability = suggestion.get("probability", 0) * 100
        
        if is_healthy:
            return f"Crop identified as {name} ({probability:.1f}% confidence). Plant appears healthy!"
        else:
            return f"Potential issue detected: {name} ({probability:.1f}% confidence). Please check for this disease/pest."
    
    def _check_health(self, suggestion):
        """Check if plant is healthy based on prediction"""
        plant_name = suggestion.get("plant_name", "").lower()
        # Simple check - if disease-related terms appear, plant might be unhealthy
        unhealthy_terms = ['disease', 'blight', 'rot', 'spot', 'mold', 'mildew', 'fungus']
        return not any(term in plant_name for term in unhealthy_terms)
    
    def _generate_message(self, suggestion):
        """Generate user-friendly message from API response"""
        if not suggestion:
            return "Could not analyze the plant image"
            
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
            'note': 'Using mock data - add PLANTID_API_KEY to .env for real detection'
        }