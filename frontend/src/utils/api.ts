// API utility for chat functionality
// This integrates with backend API for persistent chat storage

export interface ChatMessage {
  id: string;
  content: string;
  images?: string[]; // Base64 or URLs
  timestamp: Date;
  sender: 'user' | 'ai';
}

export interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface CreateChatRequest {
  message: string;
  images?: File[];
}

export interface SendMessageRequest {
  chatId: string;
  message: string;
  images?: File[];
}

export interface WeatherData {
  location: { latitude: number; longitude: number };
  daily: Array<{
    date: string;
    temperature: { max: number; min: number };
    precipitation: number;
    windSpeed: number;
    weatherCode: number;
  }>;
}

export interface YieldPrediction {
  predictedYield: number;
  confidence: number;
  factors: Record<string, number>;
  analysis: string;
  recommendations: string[];
  riskAssessment: string;
  generatedAt: string;
}

export interface WeeklyTip {
  id: string;
  action: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  completed: boolean;
  dueDate: string;
}

export interface CropInsight {
  crop: string;
  totalArea: number;
  fieldCount: number;
  keyActions: string[];
  riskFactors: string[];
  expectedHarvest: {
    estimatedYield: number;
    unit: string;
    harvestWindow: string;
  };
}

export interface Recommendations {
  weeklyTips: WeeklyTip[];
  cropInsights: CropInsight[];
  generatedAt: string;
  validUntil: string;
  farmSummary: {
    totalFields: number;
    primaryCrops: string[];
    totalArea: number;
  };
}

class ApiService {
  private baseUrl = import.meta.env.VITE_BACKEND_URL 
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : '/api'; // In production, use relative path since frontend and backend are served from same domain 

  // Create a new chat
  async createChat(request: CreateChatRequest): Promise<Chat> {
    console.log('API: Creating new chat', request);
    
    // Prepare form data for file uploads
    const formData = new FormData();
    formData.append('message', request.message);
    
    if (request.images) {
      request.images.forEach((image) => {
        formData.append(`images`, image);
      });
    }

    const response = await fetch(`${this.baseUrl}/chats`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Chat created', result);
    
    // Convert timestamp strings to Date objects
    const chat = this.formatChatDates(result.chat);
    return chat;
  }

  // Get all chats
  async getChats(): Promise<Chat[]> {
    console.log('API: Fetching all chats');
    
    const response = await fetch(`${this.baseUrl}/chats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Chats fetched', result);
    
    // Convert timestamp strings to Date objects
    // Backend returns array directly, not wrapped in { chats: [...] }
    const chats = result.map((chat: any) => this.formatChatDates(chat));
    return chats;
  }

  // Get a specific chat by ID
  async getChat(chatId: string): Promise<Chat | null> {
    console.log('API: Fetching chat', chatId);
    
    const response = await fetch(`${this.baseUrl}/chat/${chatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch chat: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Chat fetched', result);
    
    // Convert timestamp strings to Date objects
    const chat = this.formatChatDates(result.chat);
    return chat;
  }

  // Send message to existing chat
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage[]> {
    console.log('API: Sending message to chat', request);
    
    // Prepare form data for file uploads
    const formData = new FormData();
    formData.append('message', request.message);
    
    if (request.images) {
      request.images.forEach((image) => {
        formData.append(`images`, image);
      });
    }

    const response = await fetch(`${this.baseUrl}/chat/${request.chatId}/message`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Message sent', result);
    
    // Convert timestamp strings to Date objects and return messages
    const userMessage = this.formatMessageDates(result.userMessage);
    const aiMessage = this.formatMessageDates(result.aiMessage);
    
    return [userMessage, aiMessage];
  }

  // Get suggested questions
  async getSuggestedQuestions(): Promise<string[]> {
    console.log('API: Fetching suggested questions');
    
    const response = await fetch(`${this.baseUrl}/suggested-questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch suggested questions: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Suggested questions fetched', result);
    return result.questions;
  }

  // Get weather forecast for coordinates
  async getWeatherForecast(latitude: number, longitude: number): Promise<WeatherData> {
    console.log('API: Fetching weather forecast for', latitude, longitude);
    
    const response = await fetch(`${this.baseUrl}/weather/${latitude}/${longitude}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather forecast: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Weather forecast fetched', result);
    return result;
  }

  // Get crop yield prediction
  async getCropYieldPrediction(
    fieldData: any, 
    weatherData?: WeatherData, 
    historicalYield?: any
  ): Promise<YieldPrediction> {
    console.log('API: Getting crop yield prediction', { fieldData, weatherData, historicalYield });
    
    const response = await fetch(`${this.baseUrl}/crop-yield-prediction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fieldData,
        weatherData,
        historicalYield
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get crop yield prediction: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Crop yield prediction received', result);
    return result;
  }

  // Get AI-powered recommendations
  async getRecommendations(
    fields: any[], 
    preferences?: any, 
    currentSeason?: string
  ): Promise<Recommendations> {
    console.log('API: Getting recommendations', { fields, preferences, currentSeason });
    
    const response = await fetch(`${this.baseUrl}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields,
        preferences,
        currentSeason
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.status}`);
    }

    const result = await response.json();
    console.log('API: Recommendations received', result);
    return result;
  }

  // Helper method to convert timestamp strings to Date objects for chats
  private formatChatDates(chat: any): Chat {
    return {
      id: chat.id,
      title: chat.title,
      lastMessage: '', // Backend doesn't provide this in list view
      lastMessageTime: new Date(chat.updated_at || chat.updatedAt),
      createdAt: new Date(chat.created_at || chat.createdAt),
      messages: chat.messages ? chat.messages.map((msg: any) => this.formatMessageDates(msg)) : []
    };
  }

  // Helper method to convert timestamp strings to Date objects for messages
  private formatMessageDates(message: any): ChatMessage {
    return {
      ...message,
      timestamp: new Date(message.timestamp)
    };
  }

  // Clear all chats (for development)
  async clearAllChats(): Promise<void> {
    console.log('API: Clearing all chats not implemented in backend yet');
    // This would need to be implemented in the backend if needed
  }

  // Delete a specific chat
  async deleteChat(chatId: string): Promise<void> {
    console.log('API: Deleting chat', chatId);
    
    const response = await fetch(`${this.baseUrl}/chat/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.status}`);
    }

    console.log('API: Chat deleted successfully');
  }

  // Update chat title
  async updateChatTitle(chatId: string, newTitle: string): Promise<void> {
    console.log('API: Updating chat title', chatId, newTitle);
    
    const response = await fetch(`${this.baseUrl}/chat/${chatId}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: newTitle }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update chat title: ${response.status}`);
    }

    console.log('API: Chat title updated successfully');
  }
}

export const apiService = new ApiService();