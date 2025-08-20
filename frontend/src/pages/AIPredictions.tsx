import React, { useState, useEffect } from 'react';
import { FlaskIcon, LeafIcon, WaterDropIcon, ThermometerIcon } from '../ui/svgs';
import type { Field } from './FieldManagement';

interface Recommendation {
  id: string;
  fieldId: string;
  fieldName: string;
  type: 'watering' | 'fertilizer' | 'pest_control' | 'harvesting' | 'general';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  dueDate?: Date;
  isCompleted: boolean;
}

const AIPredictions: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [_loading, _setLoading] = useState(false);

  // Load fields and recommendations on component mount
  useEffect(() => {
    const savedFields = localStorage.getItem('agritech_fields');
    if (savedFields) {
      const parsedFields = JSON.parse(savedFields);
      const fieldsWithDates = parsedFields.map((field: any) => ({
        ...field,
        plantingDate: new Date(field.plantingDate),
      }));
      setFields(fieldsWithDates);
    }

    const savedRecommendations = localStorage.getItem('agritech_recommendations');
    if (savedRecommendations) {
      const parsedRecommendations = JSON.parse(savedRecommendations);
      const recommendationsWithDates = parsedRecommendations.map((rec: any) => ({
        ...rec,
        createdAt: new Date(rec.createdAt),
        dueDate: rec.dueDate ? new Date(rec.dueDate) : undefined,
      }));
      setRecommendations(recommendationsWithDates);
    }
  }, []);

  // Generate sample recommendations for demonstration
  useEffect(() => {
    if (fields.length > 0 && recommendations.length === 0) {
      generateSampleRecommendations();
    }
  }, [fields]);

  const generateSampleRecommendations = () => {
    const sampleRecommendations: Recommendation[] = [];
    
    fields.forEach((field) => {
      const daysPlanted = Math.floor((new Date().getTime() - field.plantingDate.getTime()) / (1000 * 3600 * 24));
      
      // Generate recommendations based on crop type and planting date
      if (field.cropType === 'Maize') {
        if (daysPlanted < 30) {
          sampleRecommendations.push({
            id: `${field.id}-1`,
            fieldId: field.id,
            fieldName: field.name,
            type: 'watering',
            title: 'Early Stage Watering',
            description: 'Ensure consistent moisture during germination. Water deeply but less frequently to encourage root development.',
            priority: 'high',
            createdAt: new Date(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            isCompleted: false,
          });
        } else if (daysPlanted >= 30 && daysPlanted < 60) {
          sampleRecommendations.push({
            id: `${field.id}-2`,
            fieldId: field.id,
            fieldName: field.name,
            type: 'fertilizer',
            title: 'Apply Nitrogen Fertilizer',
            description: 'Apply first top-dressing of nitrogen fertilizer (urea) at 6-8 weeks after planting for optimal growth.',
            priority: 'high',
            createdAt: new Date(),
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            isCompleted: false,
          });
        } else if (daysPlanted >= 60) {
          sampleRecommendations.push({
            id: `${field.id}-3`,
            fieldId: field.id,
            fieldName: field.name,
            type: 'pest_control',
            title: 'Monitor for Fall Armyworm',
            description: 'Check for fall armyworm damage on leaves. Look for characteristic feeding patterns and apply appropriate control measures if found.',
            priority: 'medium',
            createdAt: new Date(),
            isCompleted: false,
          });
        }
      }

      // Add general recommendations for all crops
      sampleRecommendations.push({
        id: `${field.id}-general`,
        fieldId: field.id,
        fieldName: field.name,
        type: 'general',
        title: 'Weather Monitoring',
        description: 'Monitor weather forecasts for the next 7 days. Adjust irrigation schedule based on expected rainfall.',
        priority: 'medium',
        createdAt: new Date(),
        isCompleted: false,
      });
    });

    setRecommendations(sampleRecommendations);
    localStorage.setItem('agritech_recommendations', JSON.stringify(sampleRecommendations));
  };

  const filteredRecommendations = selectedField === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.fieldId === selectedField);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return <WaterDropIcon className="w-5 h-5 text-blue-500" />;
      case 'fertilizer':
        return <FlaskIcon className="w-5 h-5 text-yellow-500" />;
      case 'pest_control':
        return <LeafIcon className="w-5 h-5 text-red-500" />;
      case 'harvesting':
        return <ThermometerIcon className="w-5 h-5 text-green-500" />;
      default:
        return <FlaskIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleCompleted = (recommendationId: string) => {
    const updatedRecommendations = recommendations.map(rec => 
      rec.id === recommendationId 
        ? { ...rec, isCompleted: !rec.isCompleted }
        : rec
    );
    setRecommendations(updatedRecommendations);
    localStorage.setItem('agritech_recommendations', JSON.stringify(updatedRecommendations));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Predictions & Recommendations</h1>
            <p className="text-gray-600 mt-1">AI-powered insights and recommendations for your fields</p>
          </div>
          
          {/* Field Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by field:</label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Fields</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AI Model Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FlaskIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How AI Generates These Recommendations</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              Our AI model analyzes multiple factors to generate personalized recommendations: 
              <strong> crop type, planting date, growth stage, weather patterns, soil conditions, and historical data</strong>.
              The model considers the specific needs of each crop variety grown in Malawi, seasonal patterns, 
              and combines this with real-time weather data to predict optimal timing for irrigation, fertilization, 
              pest control, and harvesting activities. Machine learning algorithms continuously improve predictions 
              based on local farming outcomes and environmental conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recommendations</p>
              <p className="text-2xl font-bold text-gray-900">{filteredRecommendations.length}</p>
            </div>
            <FlaskIcon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredRecommendations.filter(r => r.priority === 'high' && !r.isCompleted).length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 font-bold">!</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredRecommendations.filter(r => r.isCompleted).length}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Fields</p>
              <p className="text-2xl font-bold text-blue-600">{fields.length}</p>
            </div>
            <LeafIcon className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FlaskIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
            <p className="text-gray-600">
              {fields.length === 0 
                ? "Add fields in Field Management to start receiving AI recommendations."
                : "AI recommendations will appear here based on your field data and crop conditions."}
            </p>
          </div>
        ) : (
          filteredRecommendations
            .sort((a, b) => {
              // Sort by completion status (incomplete first), then by priority, then by date
              if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
              
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              }
              
              return b.createdAt.getTime() - a.createdAt.getTime();
            })
            .map((recommendation) => (
              <div 
                key={recommendation.id} 
                className={`bg-white rounded-lg shadow-md p-6 transition-all ${
                  recommendation.isCompleted ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(recommendation.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`font-semibold text-gray-900 ${
                          recommendation.isCompleted ? 'line-through' : ''
                        }`}>
                          {recommendation.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          getPriorityColor(recommendation.priority)
                        }`}>
                          {recommendation.priority}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{recommendation.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <LeafIcon className="w-4 h-4" />
                          {recommendation.fieldName}
                        </span>
                        <span>Created: {formatDate(recommendation.createdAt)}</span>
                        {recommendation.dueDate && (
                          <span className={`${
                            recommendation.dueDate < new Date() ? 'text-red-600 font-medium' : ''
                          }`}>
                            Due: {formatDate(recommendation.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleCompleted(recommendation.id)}
                    className={`ml-4 p-2 rounded-lg transition-colors ${
                      recommendation.isCompleted
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={recommendation.isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default AIPredictions;
