// API utility for chat functionality
// This simulates backend interaction for development

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
  private baseUrl = '/api'; // This would be your actual backend URL
  
  // Simulate network delay
  private delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convert File objects to base64 for storage simulation
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // These are mock AI responsec(for testing chat interface)
  private generateAIResponse(userMessage: string): string {
    const responses = [
      "Based on your query, I recommend checking the soil moisture levels and adjusting irrigation accordingly.",
      "For optimal crop growth, consider applying organic fertilizer during the early morning hours.",
      "The weather conditions suggest implementing pest control measures in the next 48 hours.",
      "Your crop analysis indicates healthy growth patterns. Continue current care routine.",
      "I've analyzed your farm data and suggest monitoring temperature fluctuations this week."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Create a new chat
  async createChat(request: CreateChatRequest): Promise<Chat> {
    console.log('API: Creating new chat', request);
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

    // Generate AI response
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

    console.log('API: Chat created', chat);
    return chat;
  }

  // Get all chats
  async getChats(): Promise<Chat[]> {
    console.log('API: Fetching all chats');
    await this.delay(200);

    const chats = this.getStoredChats();
    console.log('API: Retrieved chats', chats);
    return chats;
  }

  // Get specific chat by ID
  async getChat(chatId: string): Promise<Chat | null> {
    console.log('API: Fetching chat', chatId);
    await this.delay(200);

    const chats = this.getStoredChats();
    const chat = chats.find(c => c.id === chatId) || null;
    
    console.log('API: Retrieved chat', chat);
    return chat;
  }

  // Send message to existing chat
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage[]> {
    console.log('API: Sending message to chat', request);
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

    console.log('API: Message sent, new messages:', [userMessage, aiMessage]);
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
