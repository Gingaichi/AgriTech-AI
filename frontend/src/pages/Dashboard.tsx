import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox';
import { TypingHeader } from '../components/TypingAnimated';
import SuggestedQuestions from '../components/SuggestedQuestions';
import WeatherForecast from '../components/WeatherForecast';
import CropYieldTrends from '../components/CropYieldTrends';
import WeeklyTips from '../components/WeeklyTips';
import { apiService } from '../utils/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleSendMessage = async (message: string, images?: File[]) => {
    try {
      console.log('Creating new chat with message:', message, 'Images:', images);
      const newChat = await apiService.createChat({ message, images });
      // Navigate to the new chat page
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleQuestionSelect = async (question: string) => {
    await handleSendMessage(question);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <TypingHeader text="Hello! User" />       
        <p className="text-gray-600 mt-1">Welcome to your AgriTech AI dashboard</p>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ask AgriTech AI</h2>
          <ChatBox
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors duration-200"
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Suggested Questions */}
      <SuggestedQuestions onQuestionSelect={handleQuestionSelect} />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Forecast */}
        <WeatherForecast />

        {/* Crop Yield Trends */}
        <CropYieldTrends />
      </div>

      {/* Weekly Tips Section */}
      <WeeklyTips />
    </div>
  );
};

export default Dashboard;