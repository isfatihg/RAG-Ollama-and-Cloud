
import React, { useState } from 'react';
import type { ChatMessage, DocumentChunk } from '../types';
import { UserIcon, AssistantIcon, ChevronDownIcon, DocumentTextIcon } from './icons';

interface ChatMessageItemProps {
  message: ChatMessage;
  isLoading?: boolean;
}

const ContextViewer: React.FC<{ context: DocumentChunk[] }> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);
  
    if (!context || context.length === 0) return null;
  
    return (
      <div className="mt-2 border-t border-gray-600 pt-2">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-xs text-gray-400 hover:text-cyan-400 w-full"
        >
          <span>Retrieved Context ({context.length} chunks)</span>
          <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto bg-gray-900 p-2 rounded-md">
            {context.map((chunk) => (
              <div key={chunk.id} className="text-xs text-gray-400 border border-gray-700 p-2 rounded">
                 <p className="font-semibold text-gray-300 mb-1 flex items-center"><DocumentTextIcon className="h-3 w-3 mr-1.5"/>Source: {chunk.fileName}</p>
                <p className="whitespace-pre-wrap font-mono">{chunk.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isLoading }) => {
  const isAssistant = message.author === 'assistant';

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'justify-end'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <AssistantIcon className="h-5 w-5 text-white" />
        </div>
      )}

      <div className={`max-w-xl p-3 rounded-lg ${isAssistant ? 'bg-gray-800' : 'bg-blue-600 text-white'}`}>
        <div className="prose prose-sm prose-invert max-w-none">
          {isLoading ? (
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 bg-current rounded-full animate-bounce"></span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        {isAssistant && !isLoading && <ContextViewer context={message.context || []} />}
      </div>
      
      {!isAssistant && (
         <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-gray-300" />
         </div>
      )}
    </div>
  );
};
