import os
from io import BytesIO
import requests
from PIL import Image
from dotenv import load_dotenv
from ..schemas import DiseasePrediction

load_dotenv()

class DiseaseDetector:
    def __init__(self):
        self.api_key = os.getenv("PLANTID_API_KEY")
        self.base_url = "https://api.plant.id/v2"
        
    async def detect_from_bytes(self, image_bytes: bytes) -> DiseasePrediction:
        """Detect disease from image bytes using PlantID API"""
        files = {'images': ('plant.jpg', image_bytes)}
        headers = {'Api-Key': self.api_key}
        
        try:
            # First identify the plant
            identify_response = requests.post(
                f"{self.base_url}/identify",
                files=files,
                headers=headers
            ).json()
            
            if not identify_response.get('suggestions'):
                return DiseasePrediction(
                    disease="Unknown",
                    confidence=0,
                    treatment_suggestion="No plant identified"
                )
            
            # Then check for diseases
            health_response = requests.post(
                f"{self.base_url}/health_assessment",
                files=files,
                headers=headers,
                data={'details': 'treatment'}
            ).json()
            
            best_match = health_response['result']['diseases'][0]
            return DiseasePrediction(
                disease=best_match['name'],
                confidence=best_match['probability'],
                treatment_suggestion=best_match['treatment']['prevention'][0]
            )
            
        except Exception as e:
            return DiseasePrediction(
                disease="Error",
                confidence=0,
                treatment_suggestion=str(e)
            )

    async def detect_from_file(self, file_path: str) -> DiseasePrediction:
        with open(file_path, 'rb') as f:
            return await self.detect_from_bytes(f.read())

# Example usage
if __name__ == '__main__':
    import asyncio
    detector = DiseaseDetector()
    result = asyncio.run(detector.detect_from_file("test_leaf.jpg"))
    print(f"Detected: {result.disease} ({result.confidence:.0%})")
    print(f"Treatment: {result.treatment_suggestion}")