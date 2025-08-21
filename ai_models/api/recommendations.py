class RecommendationEngine:
    """
    Simple rule-based recommendations for farmers
    """
    
    def __init__(self):
        self.crop_advice = {
            'maize': {
                'planting': 'Plant in November-December',
                'fertilizer': 'Use NPK fertilizer (23:21:0 + 4S)',
                'harvest': 'Harvest after 120-140 days',
                'water': 'Water regularly during dry spells',
                'spacing': 'Space plants 75-90 cm apart in rows 90 cm apart'
            },
            'tomato': {
                'planting': 'Plant in March-April or August-September',
                'fertilizer': 'Use compost and well-rotted manure',
                'harvest': 'Harvest 70-90 days after planting',
                'water': 'Water at the base to avoid leaf diseases',
                'spacing': 'Space plants 60 cm apart in rows 90 cm apart'
            },
            'beans': {
                'planting': 'Plant in December-January',
                'fertilizer': 'Use phosphorus-rich fertilizer',
                'harvest': 'Harvest when pods are firm and crisp (60-90 days)',
                'water': 'Keep soil consistently moist but not waterlogged',
                'spacing': 'Space plants 10-15 cm apart in rows 50 cm apart'
            },
            'cassava': {
                'planting': 'Plant at the beginning of rainy season',
                'fertilizer': 'Use organic manure or low-nitrogen fertilizer',
                'harvest': 'Harvest after 9-18 months depending on variety',
                'water': 'Drought tolerant but needs water during establishment',
                'spacing': 'Space stems 1 meter apart in rows 1 meter apart'
            }
        }
    
    def get_recommendations(self, crop_type, weather_data, disease_status=None):
        """Generate simple recommendations based on inputs"""
        recommendations = []
        
        # Basic crop advice
        crop_type = crop_type.lower()
        if crop_type in self.crop_advice:
            crop_info = self.crop_advice[crop_type]
            recommendations.append(f"🌱 Planting: {crop_info['planting']}")
            recommendations.append(f"💧 Water: {crop_info['water']}")
            recommendations.append(f"📏 Spacing: {crop_info['spacing']}")
            recommendations.append(f"🌾 Fertilizer: {crop_info['fertilizer']}")
            recommendations.append(f"🔄 Harvest: {crop_info['harvest']}")
        else:
            recommendations.append(f"Consult local agricultural extension for {crop_type} growing advice")
        
        # Weather-based advice
        if weather_data:
            temp = weather_data.get('temperature', 20)  # Default to moderate temperature
            precipitation = weather_data.get('precipitation', 0)
            
            if temp > 30:
                recommendations.append("🌡️ High temperature expected - ensure adequate irrigation and consider shade options")
            elif temp < 15:
                recommendations.append("❄️ Low temperature expected - protect young plants with covers")
            
            if precipitation > 10:
                recommendations.append("🌧️ Heavy rain expected - ensure good drainage to prevent waterlogging")
            elif precipitation == 0 and weather_data.get('conditions') != 'Rain':
                recommendations.append("☀️ No rain expected - irrigation will be necessary")
            
            # General advice based on forecast
            forecast = weather_data.get('forecast', [])
            if len(forecast) > 1 and forecast[1].get('precipitation', 0) > 5:
                recommendations.append("� Tomorrow's forecast shows significant rain - plan activities accordingly")
        else:
            # Default advice when no weather data is available
            recommendations.append("🌡️ Monitor weather conditions and adjust irrigation accordingly")
            recommendations.append("📅 Check local weather forecast for planning farm activities")
        
        # Disease advice
        if disease_status and not disease_status.get('is_healthy', True):
            recommendations.append("⚠️ Disease detected - consider organic fungicides and remove affected plants")
            recommendations.append("🌿 Practice crop rotation to prevent disease buildup")
            recommendations.append("💧 Avoid overhead watering to reduce humidity around plants")
        
        return recommendations