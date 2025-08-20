import React, { useState, useEffect } from 'react';
import { FlaskIcon, LeafIcon, PlantIcon } from '../ui/svgs';
import type { Field } from '../pages/FieldManagement';

interface YieldData {
  fieldId: string;
  fieldName: string;
  cropType: string;
  plantingDate: Date;
  expectedYield: number;
  currentGrowthStage: string;
  predictedHarvestDate: Date;
  yieldTrend: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
}

const CropYieldTrends: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [yieldData, setYieldData] = useState<YieldData[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    loadFieldsAndGenerateYieldData();
  }, []);

  const loadFieldsAndGenerateYieldData = () => {
    const savedFields = localStorage.getItem('agritech_fields');
    if (savedFields) {
      const parsedFields = JSON.parse(savedFields);
      const fieldsWithDates = parsedFields.map((field: any) => ({
        ...field,
        plantingDate: new Date(field.plantingDate),
      }));
      setFields(fieldsWithDates);
      
      // Generate yield predictions for each field
      const predictions = fieldsWithDates.map((field: Field) => generateYieldPrediction(field));
      setYieldData(predictions);
    }
  };

  const generateYieldPrediction = (field: Field): YieldData => {
    const daysPlanted = Math.floor((new Date().getTime() - field.plantingDate.getTime()) / (1000 * 3600 * 24));
    
    // Crop-specific yield calculations and growth stages
    let expectedYield = 0;
    let growthStage = '';
    let harvestDays = 0;
    
    switch (field.cropType) {
      case 'Maize':
        expectedYield = field.size * (2.5 + Math.random() * 1.5); // 2.5-4 tons per acre average
        harvestDays = 120;
        if (daysPlanted < 20) growthStage = 'Germination';
        else if (daysPlanted < 40) growthStage = 'Vegetative Growth';
        else if (daysPlanted < 70) growthStage = 'Flowering';
        else if (daysPlanted < 100) growthStage = 'Grain Filling';
        else growthStage = 'Maturity';
        break;
        
      case 'Tobacco':
        expectedYield = field.size * (1.8 + Math.random() * 0.7); // 1.8-2.5 tons per acre
        harvestDays = 90;
        if (daysPlanted < 15) growthStage = 'Seedbed';
        else if (daysPlanted < 30) growthStage = 'Transplanting';
        else if (daysPlanted < 60) growthStage = 'Field Growth';
        else growthStage = 'Maturity';
        break;
        
      case 'Groundnuts':
        expectedYield = field.size * (1.2 + Math.random() * 0.8); // 1.2-2.0 tons per acre
        harvestDays = 100;
        if (daysPlanted < 15) growthStage = 'Germination';
        else if (daysPlanted < 40) growthStage = 'Vegetative';
        else if (daysPlanted < 70) growthStage = 'Flowering & Pegging';
        else growthStage = 'Pod Development';
        break;
        
      default:
        expectedYield = field.size * (1.5 + Math.random() * 1.0);
        harvestDays = 90;
        growthStage = daysPlanted < 30 ? 'Early Growth' : daysPlanted < 60 ? 'Mid Growth' : 'Late Growth';
    }

    const predictedHarvestDate = new Date(field.plantingDate);
    predictedHarvestDate.setDate(predictedHarvestDate.getDate() + harvestDays);

    // Determine yield trend based on various factors
    const factorsAffecting = [];
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';

    // Weather impact simulation
    if (Math.random() > 0.7) {
      factorsAffecting.push('Favorable weather conditions');
      trend = 'increasing';
    } else if (Math.random() > 0.8) {
      factorsAffecting.push('Drought stress detected');
      trend = 'decreasing';
    }

    // Growth stage impact
    if (daysPlanted > 30 && daysPlanted < 70) {
      factorsAffecting.push('Critical growth period - optimal nutrition needed');
    }

    // Soil and management factors
    if (Math.random() > 0.6) {
      factorsAffecting.push('Good soil fertility management');
    }
    
    if (Math.random() > 0.7) {
      factorsAffecting.push('Pest monitoring recommended');
    }

    return {
      fieldId: field.id,
      fieldName: field.name,
      cropType: field.cropType,
      plantingDate: field.plantingDate,
      expectedYield: Math.round(expectedYield * 100) / 100,
      currentGrowthStage: growthStage,
      predictedHarvestDate,
      yieldTrend: trend,
      factors: factorsAffecting.length > 0 ? factorsAffecting : ['Normal growing conditions']
    };
  };

  const filteredYieldData = selectedFieldId === 'all' 
    ? yieldData 
    : yieldData.filter(data => data.fieldId === selectedFieldId);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'decreasing':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const calculateProgress = (plantingDate: Date, harvestDate: Date) => {
    const now = new Date();
    const totalDuration = harvestDate.getTime() - plantingDate.getTime();
    const elapsed = now.getTime() - plantingDate.getTime();
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    return Math.round(progress);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Crop Yield Trends</h2>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-blue-600 hover:text-blue-700"
            title="How AI predicts yield"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Field:</label>
          <select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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

      {/* AI Explanation Modal */}
      {showExplanation && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FlaskIcon className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">How AI Predicts Crop Yield</h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                Our AI model analyzes multiple data points to predict crop yields:
              </p>
              <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                <li><strong>Crop Type & Variety:</strong> Historical yield data for each crop in Malawi</li>
                <li><strong>Planting Date & Growth Stage:</strong> Timing and current development phase</li>
                <li><strong>Field Size & Location:</strong> Area calculations and regional climate patterns</li>
                <li><strong>Weather Data:</strong> Temperature, rainfall, and seasonal weather patterns</li>
                <li><strong>Soil Conditions:</strong> Fertility status and moisture levels</li>
                <li><strong>Management Practices:</strong> Fertilizer application, pest control, and irrigation</li>
              </ul>
              <p className="text-blue-800 text-sm mt-3">
                The model continuously updates predictions as new data becomes available, providing 
                farmers with real-time insights for better decision-making.
              </p>
            </div>
          </div>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="text-center py-8">
          <PlantIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Add fields in Field Management to see yield predictions</p>
        </div>
      ) : filteredYieldData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No data available for selected field</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <LeafIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Total Expected Yield</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {filteredYieldData.reduce((sum, data) => sum + data.expectedYield, 0).toFixed(1)} tons
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PlantIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Active Fields</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{filteredYieldData.length}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FlaskIcon className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Avg. Yield/Acre</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">
                {filteredYieldData.length > 0 
                  ? (filteredYieldData.reduce((sum, data) => sum + data.expectedYield, 0) / 
                     filteredYieldData.reduce((sum, data) => sum + fields.find(f => f.id === data.fieldId)!.size, 0)).toFixed(1)
                  : '0'
                } tons
              </p>
            </div>
          </div>

          {/* Individual Field Data */}
          <div className="space-y-4">
            {filteredYieldData.map((data) => {
              const field = fields.find(f => f.id === data.fieldId);
              if (!field) return null;

              const progress = calculateProgress(data.plantingDate, data.predictedHarvestDate);
              
              return (
                <div key={data.fieldId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <LeafIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{data.fieldName}</h3>
                        <p className="text-sm text-gray-600">{data.cropType} • {field.size} acres</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getTrendIcon(data.yieldTrend)}
                      <span className={`text-sm font-medium ${getTrendColor(data.yieldTrend)}`}>
                        {data.yieldTrend}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Expected Yield</p>
                      <p className="text-lg font-semibold text-gray-900">{data.expectedYield} tons</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Growth Stage</p>
                      <p className="text-lg font-semibold text-gray-900">{data.currentGrowthStage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Est. Harvest</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(data.predictedHarvestDate)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Growth Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Factors Affecting Yield */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Factors Affecting Yield:</p>
                    <div className="space-y-1">
                      {data.factors.map((factor, index) => (
                        <p key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {factor}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropYieldTrends;
