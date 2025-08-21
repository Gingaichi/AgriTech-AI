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

  const handleSendMessage = async (message: string, images?: File[], useAdvancedAnalysis?: boolean) => {
    try {
      console.log('Creating new chat with message:', message, 'Images:', images, 'Advanced Analysis:', useAdvancedAnalysis);
      
      // If advanced analysis is requested and images are provided
      if (useAdvancedAnalysis && images && images.length > 0) {
        try {
          // First, perform advanced image analysis
          const analysisResult = await apiService.analyzeImage(images, 'maize');
          
          // Create a new chat with enhanced message that includes analysis results
          const enhancedMessage = message.trim() 
            ? `${message}\n\n[Advanced Analysis Results]\n${JSON.stringify(analysisResult.analysis, null, 2)}`
            : `[Advanced Image Analysis]\n${JSON.stringify(analysisResult.analysis, null, 2)}`;
          
          const newChat = await apiService.createChat({ 
            message: enhancedMessage, 
            images 
          });
          
          navigate(`/chat/${newChat.id}`);
          
        } catch (analysisError) {
          console.error('Advanced analysis failed, falling back to regular chat:', analysisError);
          
          // Fallback to regular chat creation if advanced analysis fails
          const fallbackMessage = message.trim() 
            ? `${message}\n\n[Note: Advanced analysis was requested but is currently unavailable. Please analyze these crop images and provide recommendations.]`
            : '[Note: Advanced analysis was requested but is currently unavailable. Please analyze these crop images and provide recommendations.]';
          
          const newChat = await apiService.createChat({ 
            message: fallbackMessage, 
            images 
          });
          
          navigate(`/chat/${newChat.id}`);
        }
      } else {
        // Regular chat creation
        const newChat = await apiService.createChat({ message, images });
        navigate(`/chat/${newChat.id}`);
      }
      
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleQuestionSelect = async (question: string) => {
    try {
      // Navigate immediately with a temporary chat ID
      const tempChatId = 'temp-' + Date.now();
      navigate(`/chat/${tempChatId}`, { 
        state: { 
          isNewChat: true, 
          initialMessage: question,
          isStreaming: true 
        } 
      });
    } catch (error) {
      console.error('Error handling question selection:', error);
    }
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