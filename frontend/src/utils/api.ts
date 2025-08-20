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

class ApiService {
  private baseUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`; 

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
    const chats = result.chats.map((chat: any) => this.formatChatDates(chat));
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

  // Helper method to convert timestamp strings to Date objects for chats
  private formatChatDates(chat: any): Chat {
    return {
      ...chat,
      lastMessageTime: new Date(chat.lastMessageTime),
      createdAt: new Date(chat.createdAt),
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
}

export const apiService = new ApiService();