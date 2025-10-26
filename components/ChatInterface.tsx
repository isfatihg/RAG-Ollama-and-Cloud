import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { ChatMessageItem } from './ChatMessage';
import { SendIcon, ClearIcon } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  isDBReady: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSendMessage, onClearChat, isDBReady }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);
  
  const handleSend = () => {
    if (input.trim() && !isLoading && isDBReady) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg flex flex-col flex-grow h-full">
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
        <button
          onClick={onClearChat}
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
          title="Clear chat history"
        >
          <ClearIcon className="h-4 w-4 mr-1"/>
          New Chat
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 pt-10">
              <p>{isDBReady ? 'Upload a document and ask a question to start.' : 'Waiting for database to be ready...'}</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <ChatMessageItem key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.author === 'user' && (
            <ChatMessageItem message={{ author: 'assistant', content: '...' }} isLoading={true} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDBReady ? "Ask a question about your documents..." : "Database not ready..."}
            rows={1}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-4 pr-12 text-gray-200 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            disabled={isLoading || !isDBReady}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !isDBReady}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cyan-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};