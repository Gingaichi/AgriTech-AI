import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../utils/api';
import type { Chat } from '../utils/api';
import ChatBox from '../components/ChatBox';
import ChatMessageComponent from '../components/ChatMessage';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      // Handle optimistic navigation from Dashboard
      if (chatId.startsWith('temp-') && location.state?.isNewChat) {
        handleOptimisticChat();
      } else {
        loadChat(chatId);
      }
    }
  }, [chatId]);

  const handleOptimisticChat = async () => {
    const { initialMessage, isStreaming } = location.state as any;
    
    try {
      // Create optimistic UI immediately
      const tempUserMessage = {
        id: 'temp-user',
        content: initialMessage,
        timestamp: new Date(),
        sender: 'user' as const
      };

      const tempAiMessage = {
        id: 'temp-ai',
        content: 'Thinking...',
        timestamp: new Date(),
        sender: 'ai' as const
      };

      const optimisticChat = {
        id: chatId!,
        title: initialMessage.length > 50 ? initialMessage.substring(0, 47) + '...' : initialMessage,
        messages: [tempUserMessage, tempAiMessage],
        lastMessage: initialMessage,
        lastMessageTime: new Date(),
        createdAt: new Date()
      };

      setChat(optimisticChat);
      setLoading(false);
      setStreamingMessageId('temp-ai');

      // Now create the real chat
      const realChat = await apiService.createChat({ message: initialMessage });
      
      // Update with real chat data and start streaming
      const realAiMessage = realChat.messages.find(m => m.sender === 'ai');
      if (realAiMessage) {
        setStreamingMessageId(realAiMessage.id);
        setChat(prev => prev ? {
          ...prev,
          id: realChat.id,
          messages: prev.messages.map(msg => 
            msg.id === 'temp-ai' 
              ? { ...realAiMessage, content: realAiMessage.content }
              : msg.id === 'temp-user' 
                ? realChat.messages.find(m => m.sender === 'user') || msg
                : msg
          )
        } : null);
      }

      // Update URL to real chat ID
      navigate(`/chat/${realChat.id}`, { replace: true });
      
    } catch (error) {
      console.error('Error creating optimistic chat:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async (id: string) => {
    try {
      setLoading(true);
      const chatData = await apiService.getChat(id);
      setChat(chatData);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string, images?: File[], useAdvancedAnalysis?: boolean) => {
    if (!chatId || (!message.trim() && (!images || images.length === 0))) return;

    try {
      setSending(true);
      
      // Add user message immediately for better UX
      const tempUserMessage = {
        id: 'temp-user-' + Date.now(),
        content: message,
        images: images?.map(img => URL.createObjectURL(img)),
        timestamp: new Date(),
        sender: 'user' as const
      };

      setChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, tempUserMessage]
        };
      });
      
      // If advanced analysis is requested and images are provided
      if (useAdvancedAnalysis && images && images.length > 0) {
        console.log('🔬 Performing advanced image analysis...');
        
        try {
          // First, perform advanced image analysis
          const analysisResult = await apiService.analyzeImage(images, 'maize');
          
          // Create a special message that includes both the user's message and analysis results
          const enhancedMessage = message.trim() 
            ? `${message}\n\n[Advanced Analysis Results]\n${JSON.stringify(analysisResult.analysis, null, 2)}`
            : `[Advanced Image Analysis]\n${JSON.stringify(analysisResult.analysis, null, 2)}`;
          
          const newMessages = await apiService.sendMessage({
            chatId,
            message: enhancedMessage,
            images
          });

          // Start streaming the AI response
          const aiMessage = newMessages.find(m => m.sender === 'ai');
          if (aiMessage) {
            setStreamingMessageId(aiMessage.id);
          }

          // Update local state
          setChat(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...prev.messages.filter(m => m.id !== tempUserMessage.id), ...newMessages],
              lastMessage: newMessages[newMessages.length - 1].content,
              lastMessageTime: newMessages[newMessages.length - 1].timestamp
            };
          });
          
        } catch (analysisError) {
          console.error('Advanced analysis failed, falling back to regular chat:', analysisError);
          
          // Fallback to regular message if advanced analysis fails
          const fallbackMessage = message.trim() 
            ? `${message}\n\n[Note: Advanced analysis was requested but is currently unavailable. Please analyze these crop images and provide recommendations.]`
            : '[Note: Advanced analysis was requested but is currently unavailable. Please analyze these crop images and provide recommendations.]';
          
          const newMessages = await apiService.sendMessage({
            chatId,
            message: fallbackMessage,
            images
          });

          // Start streaming the AI response
          const aiMessage = newMessages.find(m => m.sender === 'ai');
          if (aiMessage) {
            setStreamingMessageId(aiMessage.id);
          }

          setChat(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...prev.messages.filter(m => m.id !== tempUserMessage.id), ...newMessages],
              lastMessage: newMessages[newMessages.length - 1].content,
              lastMessageTime: newMessages[newMessages.length - 1].timestamp
            };
          });
        }
        
      } else {
        // Regular message handling
        const newMessages = await apiService.sendMessage({
          chatId,
          message,
          images
        });

        // Start streaming the AI response
        const aiMessage = newMessages.find(m => m.sender === 'ai');
        if (aiMessage) {
          setStreamingMessageId(aiMessage.id);
        }

        // Update local state
        setChat(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages.filter(m => m.id !== tempUserMessage.id), ...newMessages],
            lastMessage: newMessages[newMessages.length - 1].content,
            lastMessageTime: newMessages[newMessages.length - 1].timestamp
          };
        });
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary user message on error
      setChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(m => !m.id.startsWith('temp-user-'))
        };
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chat not found</h3>
          <p className="text-gray-500">The chat you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {chat.title}
              </h1>
              <p className="text-sm text-gray-500 text-left">
                Created {formatDate(chat.createdAt)} at {formatTime(chat.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {chat.messages.map((message, index) => {
            const prevMessage = chat.messages[index - 1];
            const showDateSeparator = !prevMessage || 
              formatDate(message.timestamp) !== formatDate(prevMessage.timestamp);

            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                      <span className="text-sm text-gray-600 font-medium">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message Component */}
                <ChatMessageComponent 
                  message={message} 
                  isStreaming={streamingMessageId === message.id}
                  onStreamComplete={() => setStreamingMessageId(null)}
                />
              </div>
            );
          })}
          
          {/* Sending indicator */}
          {sending && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[85%] mr-12">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-emerald-700">AgriMate</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">AgriMate is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <ChatBox
            className="max-w-none"
            onSendMessage={handleSendMessage}
            placeholder="Ask AgriMate about farming, crops, weather, or upload images of your plants..."
            disabled={sending}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
