import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    images?: string[];
    timestamp: Date;
    sender: 'user' | 'ai';
  };
  showTimestamp?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, showTimestamp = true }) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] ${isUser ? 'ml-12' : 'mr-12'}`}>
        {/* AI Avatar and Name */}
        {isAI && (
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-emerald-700">AgriMate</span>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-emerald-500 text-white rounded-br-md text-right' 
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm text-left'
        }`}>
          {/* Images */}
          {message.images && message.images.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.images.map((image, imgIndex) => (
            <img
              key={imgIndex}
              src={image}
              alt={`Attachment ${imgIndex + 1}`}
              className="max-w-full h-auto rounded-lg border border-gray-200"
            />
              ))}
            </div>
          )}
          
          {/* Message Content */}
          <div className="text-sm leading-relaxed">
            {isAI ? (
              <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for markdown elements
              h1: ({ children }) => <h1 className="text-lg font-bold text-gray-800 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-semibold text-gray-800 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-gray-800 mb-1">{children}</h3>,
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-gray-700">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              code: ({ children, className }) => {
                const isInline = !className?.includes('language-');
                return isInline ? (
                  <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                {children}
                  </code>
                ) : (
                  <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-2 mb-2 overflow-x-auto">
                <code className="text-gray-800 text-xs font-mono">{children}</code>
                  </pre>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-emerald-200 pl-3 py-1 bg-emerald-50 text-gray-700 italic mb-2">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-2">
                  <table className="min-w-full border border-gray-200 rounded text-xs">
                {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-semibold text-gray-800">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-200 px-2 py-1 text-gray-700">
                  {children}
                </td>
              ),
            }}
              >
            {message.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          
          {/* Timestamp */}
          {showTimestamp && (
            <p className={`text-xs mt-2 ${
              isUser ? 'text-emerald-100' : 'text-gray-500'
            }`}>
              {formatTime(message.timestamp)}
            </p>
          )}
        </div>

        {/* User Avatar (bottom right) */}
        {isUser && (
          <div className="flex justify-end mt-1">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
