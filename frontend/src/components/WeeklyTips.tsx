import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FlaskIcon, LeafIcon, WaterDropIcon, PlantIcon } from '../ui/svgs';
import type { Field } from '../pages/FieldManagement';

interface WeeklyTip {
  id: string;
  fieldId: string;
  fieldName: string;
  title: string;
  description: string;
  type: 'watering' | 'fertilizer' | 'pest_control' | 'general' | 'harvesting';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  isRead: boolean;
}

const WeeklyTips: React.FC = () => {
  const [tips, setTips] = useState<WeeklyTip[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    loadFieldsAndGenerateTips();
  }, []);

  const loadFieldsAndGenerateTips = () => {
    const savedFields = localStorage.getItem('agritech_fields');
    if (savedFields) {
      const parsedFields = JSON.parse(savedFields);
      const fieldsWithDates = parsedFields.map((field: any) => ({
        ...field,
        plantingDate: new Date(field.plantingDate),
      }));
      setFields(fieldsWithDates);

      // Load existing tips or generate new ones
      const savedTips = localStorage.getItem('agritech_weekly_tips');
      if (savedTips) {
        const parsedTips = JSON.parse(savedTips);
        const tipsWithDates = parsedTips.map((tip: any) => ({
          ...tip,
          createdAt: new Date(tip.createdAt),
        }));
        setTips(tipsWithDates);
      } else {
        generateWeeklyTips(fieldsWithDates);
      }
    }
  };

  const generateWeeklyTips = (fieldsData: Field[]) => {
    const generatedTips: WeeklyTip[] = [];
    const today = new Date();

    fieldsData.forEach((field) => {
      const daysPlanted = Math.floor((today.getTime() - field.plantingDate.getTime()) / (1000 * 3600 * 24));
      
      // Generate tips based on crop type and growth stage
      if (field.cropType === 'Maize') {
        if (daysPlanted >= 0 && daysPlanted < 30) {
          generatedTips.push({
            id: `${field.id}-tip-1`,
            fieldId: field.id,
            fieldName: field.name,
            title: 'Monitor Seedling Emergence',
            description: 'Check for uniform emergence and replant any gaps. Ensure soil moisture is adequate but avoid waterlogging.',
            type: 'general',
            priority: 'high',
            createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            isRead: false,
          });
        } else if (daysPlanted >= 30 && daysPlanted < 60) {
          generatedTips.push({
            id: `${field.id}-tip-2`,
            fieldId: field.id,
            fieldName: field.name,
            title: 'Apply First Nitrogen Top-Dressing',
            description: 'Apply urea fertilizer (46-0-0) at 6-8 weeks after planting. Apply at a rate of 100-150 kg/ha along the rows.',
            type: 'fertilizer',
            priority: 'high',
            createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            isRead: false,
          });
        } else if (daysPlanted >= 60 && daysPlanted < 90) {
          generatedTips.push({
            id: `${field.id}-tip-3`,
            fieldId: field.id,
            fieldName: field.name,
            title: 'Scout for Fall Armyworm',
            description: 'Check plants weekly for fall armyworm damage. Look for irregular holes in leaves and frass. Apply appropriate control measures if found.',
            type: 'pest_control',
            priority: 'medium',
            createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            isRead: false,
          });
        }
      } else if (field.cropType === 'Groundnuts') {
        if (daysPlanted >= 20 && daysPlanted < 50) {
          generatedTips.push({
            id: `${field.id}-tip-gn-1`,
            fieldId: field.id,
            fieldName: field.name,
            title: 'Weed Control for Groundnuts',
            description: 'Conduct second weeding before flowering starts. Keep the field weed-free to reduce competition for nutrients.',
            type: 'general',
            priority: 'medium',
            createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            isRead: false,
          });
        } else if (daysPlanted >= 50 && daysPlanted < 80) {
          generatedTips.push({
            id: `${field.id}-tip-gn-2`,
            fieldId: field.id,
            fieldName: field.name,
            title: 'Monitor Flowering Stage',
            description: 'Ensure adequate soil moisture during flowering and pegging. Avoid disturbing plants during this critical period.',
            type: 'watering',
            priority: 'high',
            createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            isRead: false,
          });
        }
      } else if (field.cropType === 'Tobacco') {
        if (daysPlanted >= 30 && daysPlanted < 60) {
          generatedTips.push({
            id: `${field.id}-tip-tb-1`,
            fieldId: field.id,
            fieldName: field.name,
            title: 'Tobacco Topping Time',
            description: 'Begin topping when flower heads appear. Remove the flower head and 2-4 top leaves to concentrate energy into remaining leaves.',
            type: 'general',
            priority: 'high',
            createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            isRead: false,
          });
        }
      }

      // Add seasonal general tips for all crops
      const month = today.getMonth();
      if (month >= 9 || month <= 2) { // Oct-Mar (planting/growing season)
        generatedTips.push({
          id: `${field.id}-seasonal-1`,
          fieldId: field.id,
          fieldName: field.name,
          title: 'Rainy Season Water Management',
          description: 'Ensure proper drainage to prevent waterlogging. Monitor for increased disease pressure due to high humidity.',
          type: 'watering',
          priority: 'medium',
          createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          isRead: false,
        });
      } else { // Apr-Sep (dry season)
        generatedTips.push({
          id: `${field.id}-seasonal-2`,
          fieldId: field.id,
          fieldName: field.name,
          title: 'Dry Season Irrigation',
          description: 'Monitor soil moisture levels carefully. Consider mulching to conserve soil moisture and reduce evaporation.',
          type: 'watering',
          priority: 'high',
          createdAt: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          isRead: false,
        });
      }
    });

    // Sort tips by priority and date, then take the 5 most recent
    const sortedTips = generatedTips
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, 5);

    setTips(sortedTips);
    localStorage.setItem('agritech_weekly_tips', JSON.stringify(sortedTips));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return <WaterDropIcon className="w-5 h-5 text-blue-500" />;
      case 'fertilizer':
        return <FlaskIcon className="w-5 h-5 text-yellow-500" />;
      case 'pest_control':
        return <LeafIcon className="w-5 h-5 text-red-500" />;
      case 'harvesting':
        return <PlantIcon className="w-5 h-5 text-green-500" />;
      default:
        return <PlantIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const markAsRead = (tipId: string) => {
    const updatedTips = tips.map(tip => 
      tip.id === tipId ? { ...tip, isRead: true } : tip
    );
    setTips(updatedTips);
    localStorage.setItem('agritech_weekly_tips', JSON.stringify(updatedTips));
  };

  const refreshTips = () => {
    if (fields.length > 0) {
      generateWeeklyTips(fields);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">This Week's Tips</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshTips}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
            disabled={fields.length === 0}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8">
          <PlantIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">Add fields to receive personalized tips</p>
          <p className="text-sm text-gray-500">Tips will be generated based on your crop types and planting dates</p>
        </div>
      ) : tips.length === 0 ? (
        <div className="text-center py-8">
          <FlaskIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No tips available</p>
          <button
            onClick={refreshTips}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Generate Tips
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map((tip) => (
            <div
              key={tip.id}
              className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(tip.priority)} ${
                tip.isRead ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-1 bg-white rounded-lg shadow-sm">
                    {getTypeIcon(tip.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium text-gray-900 ${tip.isRead ? 'line-through' : ''}`}>
                        {tip.title}
                      </h3>
                      <span className="text-xs text-gray-500">• {tip.fieldName}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{tip.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{formatDate(tip.createdAt)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tip.priority === 'high' ? 'bg-red-100 text-red-700' :
                        tip.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {tip.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
                {!tip.isRead && (
                  <button
                    onClick={() => markAsRead(tip.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    title="Mark as read"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200">
            <Link
              to="/ai-predictions"
              className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm py-2"
            >
              View All Recommendations
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyTips;
