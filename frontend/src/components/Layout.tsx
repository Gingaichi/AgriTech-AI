import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Chat } from '../utils/api';
import { apiService } from '../utils/api';
import logo from '../assets/oak-icon.png';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, chatId: string | null, chatTitle: string}>({
    isOpen: false,
    chatId: null,
    chatTitle: ''
  });
  const location = useLocation();

  useEffect(() => {
    if (isMenuOpen) {
      loadChats();
    }
  }, [isMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deleteModal.isOpen) {
          cancelDeleteChat();
        } else if (activeDropdown) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [deleteModal.isOpen, activeDropdown]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatHistory = await apiService.getChats();
      setChats(chatHistory);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChatTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (chatDate.getTime() === today.getTime()) {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  const truncateTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length <= 3) {
      return title;
    }
    return words.slice(0, 3).join(' ') + '...';
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const toggleChatDropdown = (chatId: string) => {
    setActiveDropdown(activeDropdown === chatId ? null : chatId);
  };

  const handleEditChat = (chat: Chat) => {
    console.log('Starting edit for chat:', chat.id, chat.title);
    setEditingChat(chat.id);
    setEditTitle(chat.title);
    setActiveDropdown(null);
  };

  const handleSaveTitle = async (chatId: string) => {
    if (!editTitle.trim()) {
      console.log('Empty title, not saving');
      return;
    }
    
    try {
      console.log('Saving title:', editTitle, 'for chat:', chatId);
      await apiService.updateChatTitle(chatId, editTitle.trim());
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title: editTitle.trim() } : chat
      ));
      setEditingChat(null);
      setEditTitle('');
      console.log('Title saved successfully');
    } catch (error) {
      console.error('Error updating chat title:', error);
      alert('Failed to update chat title: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleCancelEdit = () => {
    console.log('Cancelling edit');
    setEditingChat(null);
    setEditTitle('');
  };

  const handleDeleteChat = async (chatId: string) => {
    console.log('Delete requested for chat:', chatId);
    const chat = chats.find(c => c.id === chatId);
    setDeleteModal({
      isOpen: true,
      chatId: chatId,
      chatTitle: chat?.title || 'this chat'
    });
    setActiveDropdown(null);
  };

  const confirmDeleteChat = async () => {
    if (!deleteModal.chatId) return;
    
    try {
      console.log('Deleting chat:', deleteModal.chatId);
      await apiService.deleteChat(deleteModal.chatId);
      setChats(chats.filter(chat => chat.id !== deleteModal.chatId));
      setDeleteModal({ isOpen: false, chatId: null, chatTitle: '' });
      console.log('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const cancelDeleteChat = () => {
    setDeleteModal({ isOpen: false, chatId: null, chatTitle: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left side - Hamburger menu */}
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Center - Logo/Title */}
          <div className="flex-1 flex justify-center">
            {/* <h1 className="text-xl font-semibold text-gray-900">AgriTech AI</h1> */}
            <img src={logo} alt="AgriTech AI" className='h-10' />
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center space-x-4">
            {/* Notification bell */}
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={toggleUserDropdown}
                className="flex items-center p-2 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </button>

              {/* User dropdown menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Profile Settings
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      General Settings
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-16 left-0 z-40 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`flex items-center p-2 rounded-lg group ${
                  location.pathname === '/' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 12L12 4l8 8M6 12v6a2 2 0 002 2h2a2 2 0 002-2v-4h0v4a2 2 0 002 2h2a2 2 0 002-2v-6"
                  />
                </svg>
                <span className="ml-3">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/ai-predictions"
                className={`flex items-center p-2 rounded-lg group ${
                  location.pathname === '/ai-predictions' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="ml-3">AI Predictions</span>
              </Link>
            </li>
            <li>
              <Link
                to="/field-management"
                className={`flex items-center p-2 rounded-lg group ${
                  location.pathname === '/field-management' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8l4-4 4 4 4-4 4 4v12l-4-4-4 4-4-4-4 4V8z"
                  />
                </svg>
                <span className="ml-3">Field Management</span>
              </Link>
            </li>
          </ul>

          {/* Chat History Section */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Chat History
              </h3>
              {loading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400"></div>
              )}
            </div>
            
            {/* New Chat Button */}
            <Link
              to="/"
              className="flex items-center justify-center w-full mb-3 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start New Chat
            </Link>
            
            {chats.length === 0 && !loading ? (
              <p className="text-xs text-gray-400 italic">No chat history yet</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {chats.map((chat) => (
                  <div key={chat.id} className="relative group">
                    {editingChat === chat.id ? (
                      /* Edit Mode */
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveTitle(chat.id);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleCancelEdit();
                            }
                          }}
                        />
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleSaveTitle(chat.id)}
                            className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Mode */
                      <div className="flex items-start group pr-8 relative">
                        <Link
                          to={`/chat/${chat.id}`}
                          className={`flex-1 p-2 rounded-lg text-sm transition-colors ${
                            location.pathname === `/chat/${chat.id}`
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="text-left">
                            <div className="font-medium mb-1 truncate pr-2">
                              {truncateTitle(chat.title)}
                            </div>
                            <div className="text-xs text-gray-500 truncate pr-2">
                              {formatChatTime(chat.lastMessageTime)}
                            </div>
                          </div>
                        </Link>
                        
                        {/* Three Dots Menu - Fixed positioning */}
                        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity dropdown-container">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleChatDropdown(chat.id);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {/* Dropdown Menu */}
                          {activeDropdown === chat.id && (
                            <div className="absolute right-0 top-8 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 dropdown-container">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Edit clicked for chat:', chat.id);
                                    handleEditChat(chat);
                                  }}
                                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Delete clicked for chat:', chat.id);
                                    handleDeleteChat(chat.id);
                                  }}
                                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile when menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={cancelDeleteChat}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Chat
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{truncateTitle(deleteModal.chatTitle)}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeleteChat}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDeleteChat}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`pt-16 transition-all duration-300 ${isMenuOpen ? 'lg:ml-64' : ''}`}>
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;