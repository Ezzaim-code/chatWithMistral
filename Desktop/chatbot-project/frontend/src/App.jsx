import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, X, Menu, Trash2 } from 'lucide-react';

// Configuration API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialiser avec message de bienvenue
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: "Bonjour ! 👋 Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
        timestamp: new Date()
      }]);
    }
  }, []);

  // Charger conversations
  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Envoyer message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          session_id: sessionId,
          context: {
            page: window.location.pathname
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur réseau');
      }

      const data = await response.json();
      
      // Sauvegarder session ID
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id);
      }

      // Ajouter réponse assistant
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        sources: data.sources,
        timestamp: new Date(data.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Recharger conversations
      loadConversations();

    } catch (error) {
      console.error('Erreur:', error);
      setError('Désolé, une erreur est survenue. Veuillez réessayer.');
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger conversation
  const loadConversation = async (convSessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/history/${convSessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.map(msg => ({
          ...msg,
          timestamp: new Date(msg.created_at)
        })));
        setSessionId(convSessionId);
        setShowSidebar(false);
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
  };

  // Nouvelle conversation
  const newConversation = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: "Bonjour ! 👋 Nouvelle conversation. Comment puis-je vous aider ?",
      timestamp: new Date()
    }]);
    setSessionId(null);
    setShowSidebar(false);
  };

  // Supprimer conversation
  const deleteConversation = async (convId) => {
    try {
      const response = await fetch(`${API_URL}/api/chat/${convId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadConversations();
        if (sessionId === convId) {
          newConversation();
        }
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const quickActions = [
    'Comment créer un compte ?',
    'Quels sont vos tarifs ?',
    'Contacter le support',
    'Fonctionnalités disponibles'
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Conversations</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <button
              onClick={newConversation}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all text-sm font-medium"
            >
              + Nouvelle conversation
            </button>
          </div>

          {/* Liste conversations */}
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-4">Aucune conversation</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="group p-3 mb-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadConversation(conv.session_id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conv.message_count} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden text-gray-600 hover:text-gray-800"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                  <Bot className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Assistant Virtuel</h1>
                  <p className="text-xs text-gray-500">Toujours disponible pour vous aider</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                message.role === 'assistant'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  : 'bg-gray-300'
              }`}>
                {message.role === 'assistant' ? (
                  <Bot size={20} className="text-white" />
                ) : (
                  <User size={20} className="text-gray-600" />
                )}
              </div>

              <div className={`flex flex-col max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'assistant'
                    ? 'bg-white shadow-md border border-gray-100'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'assistant' ? 'text-gray-800' : 'text-white'
                  }`}>
                    {message.content}
                  </p>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Sources :</p>
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="text-xs text-gray-600 mb-1">
                          • {source.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 mt-1 px-2">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(action)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-300 whitespace-nowrap transition-all"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center h-12"
            >
              {isLoading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Appuyez sur Entrée pour envoyer • Shift+Entrée pour nouvelle ligne
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
