import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox';
import { TypingHeader } from '../components/TypingAnimated'
import RecommendationsSection from '../components/Recommendation';
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <TypingHeader text="Hello! User" />       
        <p className="text-gray-600 mt-1">Welcome to your AgriTech AI dashboard</p>
      </div>

      {/* NLP Feature */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Chat Box */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <ChatBox
            className="bg-white rounded-full p-4 hover:shadow-lg transition-shadow duration-200"
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Crop Yield Trends</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder - Crop yield data visualization</p>
            </div>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Weather Forecast</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart placeholder - Weather forecast visualization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Activity/Actions */}
      <div>
            <RecommendationsSection />
      </div>
      
    </div>
  );
};

export default Dashboard;