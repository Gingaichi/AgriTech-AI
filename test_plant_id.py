#!/usr/bin/env python3
"""
Test script to debug Plant.ID API formatting issue
This script will test the exact flow that happens in the application
"""

import sys
import os
import tempfile
import requests
import base64
from dotenv import load_dotenv

# Add the ai_models directory to the path
sys.path.append('/home/johnlivingprooff/hackathon/AgriTech-AI/ai_models')

# Load environment variables from the root .env file
load_dotenv('/home/johnlivingprooff/hackathon/AgriTech-AI/.env')

from api.disease_detection import DiseaseDetector

def test_image_encoding(image_path):
    """Test the image encoding process"""
    print(f"Testing image encoding for: {image_path}")
    
    # Test our current encoding method
    detector = DiseaseDetector()
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return False
    
    print(f"✅ Image file found, size: {os.path.getsize(image_path)} bytes")
    
    try:
        # Test encoding
        encoded_image = detector.encode_image(image_path)
        print(f"✅ Image encoded successfully")
        print(f"   - Encoded length: {len(encoded_image)} characters")
        print(f"   - MIME type detected: {encoded_image.split(';')[0].replace('data:', '')}")
        print(f"   - First 100 chars: {encoded_image[:100]}...")
        
        # Validate base64 data
        try:
            base64_data = encoded_image.split(',')[1]
            decoded_data = base64.b64decode(base64_data)
            print(f"✅ Base64 validation successful, decoded size: {len(decoded_data)} bytes")
        except Exception as e:
            print(f"❌ Base64 validation failed: {e}")
            return False
        
        return encoded_image
        
    except Exception as e:
        print(f"❌ Image encoding failed: {e}")
        return False

def test_plantid_api_call(image_path):
    """Test the actual Plant.ID API call"""
    print("\n" + "="*50)
    print("Testing Plant.ID API Call")
    print("="*50)
    
    detector = DiseaseDetector()
    
    # Check API key
    if not detector.api_key:
        print("⚠️ No PLANTID_API_KEY found in environment")
        print("   Testing will use mock response")
        return detector._get_mock_prediction()
    
    print(f"✅ API key found (length: {len(detector.api_key)})")
    
    try:
        # Get encoded image
        encoded_image = test_image_encoding(image_path)
        if not encoded_image:
            return False
        
        # Prepare API request exactly as in the code
        headers = {
            "Content-Type": "application/json",
            "Api-Key": detector.api_key
        }
        
        payload = {
            "images": [encoded_image],
            "similar_images": True
        }
        
        print(f"✅ Payload prepared:")
        print(f"   - Number of images: {len(payload['images'])}")
        print(f"   - Modifiers: {payload['modifiers']}")
        print(f"   - Plant details: {payload['plant_details']}")
        print(f"   - Headers: {headers}")
        
        # Make the API call
        print(f"\n🔄 Making API call to: {detector.api_url}")
        response = requests.post(detector.api_url, json=payload, headers=headers)
        
        print(f"📋 Response received:")
        print(f"   - Status Code: {response.status_code}")
        print(f"   - Headers: {dict(response.headers)}")
        print(f"   - Content-Type: {response.headers.get('content-type', 'unknown')}")
        print(f"   - Response length: {len(response.text)} characters")
        
        if response.text:
            print(f"   - First 500 chars: {response.text[:500]}")
        else:
            print("   - Response body is empty")
        
        # Try to parse JSON
        try:
            if response.text.strip():
                data = response.json()
                print(f"✅ JSON parsing successful")
                print(f"   - Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                
                if isinstance(data, dict) and 'result' in data:
                    result = data['result']
                    print(f"   - Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
                    
                    if 'is_plant' in result:
                        is_plant = result['is_plant']
                        print(f"   - Is plant detected: {is_plant}")
                
                return data
            else:
                print("❌ Empty response from API")
                return None
                
        except Exception as json_error:
            print(f"❌ JSON parsing failed: {json_error}")
            print(f"   Raw response: {repr(response.text)}")
            return None
            
    except Exception as e:
        print(f"❌ API call failed: {e}")
        return None

def test_full_prediction_flow(image_path):
    """Test the full prediction flow as used in the application"""
    print("\n" + "="*50)
    print("Testing Full Prediction Flow")
    print("="*50)
    
    detector = DiseaseDetector()
    result = detector.predict(image_path)
    
    print(f"📋 Full prediction result:")
    print(f"   - Status: {result.get('status', 'unknown')}")
    print(f"   - Plant name: {result.get('plant_name', 'unknown')}")
    print(f"   - Probability: {result.get('probability', 0)}")
    print(f"   - Is healthy: {result.get('is_healthy', 'unknown')}")
    print(f"   - Message: {result.get('message', 'no message')}")
    
    if 'error' in result:
        print(f"   - Error: {result['error']}")
    
    if 'details' in result:
        print(f"   - Details: {result['details']}")
    
    return result

def test_with_malformed_data():
    """Test with various malformed data to understand what Plant.ID expects"""
    print("\n" + "="*50)
    print("Testing with Malformed Data")
    print("="*50)
    
    detector = DiseaseDetector()
    
    if not detector.api_key:
        print("⚠️ Skipping malformed data tests - no API key")
        return
    
    # Test cases
    test_cases = [
        {
            "name": "Empty images array",
            "payload": {
                "images": [],
                "modifiers": {"similar_images": True},
                "plant_details": ["common_names"]
            }
        },
        {
            "name": "Invalid base64",
            "payload": {
                "images": ["data:image/jpeg;base64,invalid_base64"],
                "modifiers": {"similar_images": True},
                "plant_details": ["common_names"]
            }
        },
        {
            "name": "Missing data URL prefix",
            "payload": {
                "images": ["base64_data_without_prefix"],
                "modifiers": {"similar_images": True},
                "plant_details": ["common_names"]
            }
        }
    ]
    
    headers = {
        "Content-Type": "application/json",
        "Api-Key": detector.api_key
    }
    
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        try:
            response = requests.post(detector.api_url, json=test_case['payload'], headers=headers)
            print(f"   - Status: {response.status_code}")
            print(f"   - Response: {response.text[:200]}...")
        except Exception as e:
            print(f"   - Error: {e}")

if __name__ == "__main__":
    # Test with the maize.jpg file
    image_path = "/home/johnlivingprooff/hackathon/AgriTech-AI/backend/maize.jpg"
    
    print("Plant.ID API Debugging Script")
    print("="*50)
    print(f"Testing with image: {image_path}")
    
    # Run all tests
    encoded_image = test_image_encoding(image_path)
    if encoded_image:
        api_result = test_plantid_api_call(image_path)
        full_result = test_full_prediction_flow(image_path)
        
        # Test malformed data
        test_with_malformed_data()
    
    print("\n" + "="*50)
    print("Testing Complete")
    print("="*50)
