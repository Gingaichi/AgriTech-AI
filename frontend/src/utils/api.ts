// API utility for chat functionality
// This integrates with backend API and falls back to localStorage for development

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

class ApiService {
  private baseUrl = `${import.meta.env.VITE_BACKEND_URL}/api`; 
  
  // Simulate network delay for development
  private delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convert File objects to base64 for storage simulation
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Generate a mock AI response based on user input (fallback only)
  private generateAIResponse(userMessage: string): string {
    const responses = [
      `I understand you're asking about "${userMessage.slice(0, 30)}...". Based on agricultural best practices, I recommend monitoring soil moisture and ensuring proper nutrient balance.`,
      `Great question about "${userMessage.slice(0, 30)}...". For optimal crop health, consider factors like weather patterns, soil conditions, and seasonal timing.`,
      `Thank you for your query about "${userMessage.slice(0, 30)}...". Here's what I suggest: Regular monitoring and data-driven decisions can significantly improve your agricultural outcomes.`,
      `Regarding "${userMessage.slice(0, 30)}...", this is a common concern in modern agriculture. I recommend consulting recent research and adapting techniques to your specific conditions.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Create a new chat
  async createChat(request: CreateChatRequest): Promise<Chat> {
    console.log('API: Creating new chat', request);
    
    try {
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
      console.log('API: Chat created from backend', result);
      return result.chat;
      
    } catch (error) {
      console.error('Backend unavailable, using localStorage fallback:', error);
      // Fallback to localStorage simulation
      return this.createChatFallback(request);
    }
  }

  // Fallback method for creating chat when backend is unavailable
  private async createChatFallback(request: CreateChatRequest): Promise<Chat> {
    await this.delay();

    const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let images: string[] = [];
    if (request.images) {
      images = await Promise.all(
        request.images.map(file => this.fileToBase64(file))
      );
    }

    const userMessage: ChatMessage = {
      id: messageId,
      content: request.message,
      images,
      timestamp: new Date(),
      sender: 'user'
    };

    // Generate AI response (this would come from backend in real implementation)
    const aiMessageId = `msg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`;
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      content: this.generateAIResponse(request.message),
      timestamp: new Date(Date.now() + 1000),
      sender: 'ai'
    };

    const chat: Chat = {
      id: chatId,
      title: request.message.slice(0, 50) + (request.message.length > 50 ? '...' : ''),
      lastMessage: aiMessage.content,
      lastMessageTime: aiMessage.timestamp,
      messages: [userMessage, aiMessage],
      createdAt: new Date()
    };

    // Store in localStorage for persistence during development
    const existingChats = this.getStoredChats();
    existingChats.unshift(chat);
    localStorage.setItem('agritech_chats', JSON.stringify(existingChats));

    console.log('API: Chat created (fallback)', chat);
    return chat;
  }

  // Get all chats
  async getChats(): Promise<Chat[]> {
    console.log('API: Fetching all chats');
    
    try {
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
      console.log('API: Chats fetched from backend', result);
      return result.chats || [];
      
    } catch (error) {
      console.error('Backend unavailable, using localStorage fallback:', error);
      // Fallback to localStorage simulation
      return this.getChatsFallback();
    }
  }

  // Fallback method for getting chats when backend is unavailable
  private async getChatsFallback(): Promise<Chat[]> {
    await this.delay();
    const chats = this.getStoredChats();
    console.log('API: Chats fetched (fallback)', chats);
    return chats;
  }

  // Get a specific chat by ID
  async getChat(chatId: string): Promise<Chat | null> {
    console.log('API: Fetching chat', chatId);
    
    try {
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
      console.log('API: Chat fetched from backend', result);
      return result.chat;
      
    } catch (error) {
      console.error('Backend unavailable, using localStorage fallback:', error);
      // Fallback to localStorage simulation
      return this.getChatFallback(chatId);
    }
  }

  // Fallback method for getting specific chat when backend is unavailable
  private async getChatFallback(chatId: string): Promise<Chat | null> {
    await this.delay();
    const chats = this.getStoredChats();
    const chat = chats.find(c => c.id === chatId) || null;
    console.log('API: Chat fetched (fallback)', chat);
    return chat;
  }

  // Send message to existing chat
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage[]> {
    console.log('API: Sending message to chat', request);
    
    try {
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
      console.log('API: Message sent to backend', result);
      return [result.userMessage, result.aiMessage];
      
    } catch (error) {
      console.error('Backend unavailable, using localStorage fallback:', error);
      // Fallback to localStorage simulation
      return this.sendMessageFallback(request);
    }
  }

  // Fallback method for sending message when backend is unavailable
  private async sendMessageFallback(request: SendMessageRequest): Promise<ChatMessage[]> {
    await this.delay();

    const chats = this.getStoredChats();
    const chatIndex = chats.findIndex(c => c.id === request.chatId);
    
    if (chatIndex === -1) {
      throw new Error('Chat not found');
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let images: string[] = [];
    if (request.images) {
      images = await Promise.all(
        request.images.map(file => this.fileToBase64(file))
      );
    }

    const userMessage: ChatMessage = {
      id: messageId,
      content: request.message,
      images,
      timestamp: new Date(),
      sender: 'user'
    };

    // Generate AI response
    const aiMessageId = `msg-${Date.now() + 1}-${Math.random().toString(36).substr(2, 9)}`;
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      content: this.generateAIResponse(request.message),
      timestamp: new Date(Date.now() + 1000),
      sender: 'ai'
    };

    // Update chat
    chats[chatIndex].messages.push(userMessage, aiMessage);
    chats[chatIndex].lastMessage = aiMessage.content;
    chats[chatIndex].lastMessageTime = aiMessage.timestamp;

    // Move to top of list
    const updatedChat = chats.splice(chatIndex, 1)[0];
    chats.unshift(updatedChat);

    localStorage.setItem('agritech_chats', JSON.stringify(chats));

    console.log('API: Message sent (fallback), new messages:', [userMessage, aiMessage]);
    return [userMessage, aiMessage];
  }

  // Helper method to get stored chats
  private getStoredChats(): Chat[] {
    try {
      const stored = localStorage.getItem('agritech_chats');
      if (!stored) return [];
      
      const chats = JSON.parse(stored);
      // Convert date strings back to Date objects
      return chats.map((chat: any) => ({
        ...chat,
        lastMessageTime: new Date(chat.lastMessageTime),
        createdAt: new Date(chat.createdAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error parsing stored chats:', error);
      return [];
    }
  }

  // Clear all chats (for development)
  async clearAllChats(): Promise<void> {
    localStorage.removeItem('agritech_chats');
    console.log('API: All chats cleared');
  }
}

export const apiService = new ApiService();