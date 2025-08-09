import React from 'react';
import { 
  PlantIcon, 
  WaterDropIcon, 
  SearchIcon, 
  CloudRainIcon, 
  LeafIcon, 
  FlaskIcon,
  ThermometerIcon 
} from '../ui/svgs';

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  iconType?: 'plant' | 'water' | 'search' | 'rain' | 'leaf' | 'fertilizer' | 'temperature';
  priority?: 'high' | 'medium' | 'low';
}

interface RecommendationProps {
  title?: string;
  recommendations?: RecommendationItem[];
  className?: string;
}

const RecommendationsSection: React.FC<RecommendationProps> = ({
  title = "This Week's Tips",
  recommendations = [
    {
      id: '1',
      title: 'Fertilize Tomatoes Today',
      description: 'Apply NPK fertilizer early morning for best absorption.',
      iconType: 'fertilizer',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Check Soil Moisture',
      description: 'Monitor your crops for optimal water levels this week.',
      iconType: 'water',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Pest Control Inspection',
      description: 'Inspect leaves for aphids and other common pests.',
      iconType: 'search',
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Weather Alert',
      description: 'Rain expected this weekend. Adjust irrigation schedule.',
      iconType: 'rain',
      priority: 'high'
    },
    {
      id: '5',
      title: 'Harvest Ready Crops',
      description: 'Your lettuce crops are ready for harvesting.',
      iconType: 'leaf',
      priority: 'low'
    }
  ],
  className = ''
}) => {
  const getPriorityColor = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getPriorityDot = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const renderIcon = (iconType?: string) => {
    const iconProps = { 
      className: 'text-gray-600', 
      size: 20 
    };

    switch (iconType) {
      case 'plant':
        return <PlantIcon {...iconProps} />;
      case 'water':
        return <WaterDropIcon {...iconProps} />;
      case 'search':
        return <SearchIcon {...iconProps} />;
      case 'rain':
        return <CloudRainIcon {...iconProps} />;
      case 'leaf':
        return <LeafIcon {...iconProps} />;
      case 'fertilizer':
        return <FlaskIcon {...iconProps} />;
      case 'temperature':
        return <ThermometerIcon {...iconProps} />;
      default:
        return <PlantIcon {...iconProps} />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Recommendations Stack */}
      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.id}
            className={`relative rounded-lg border-l-4 p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${getPriorityColor(recommendation.priority)}`}
          >
            {/* Priority Indicator */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${getPriorityDot(recommendation.priority)}`}></div>
            
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {renderIcon(recommendation.iconType)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    {recommendation.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {recommendation.description}
                </p>
                
                {/* Action Button */}
                <div className="mt-3 flex items-center justify-between">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
                    Learn More →
                  </button>
                  <span className="text-xs text-gray-400">
                    Tip #{index + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-md hover:bg-blue-50 transition-colors duration-200">
          View All Recommendations
        </button>
      </div>
    </div>
  );
};

export default RecommendationsSection;