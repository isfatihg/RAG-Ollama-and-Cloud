import React, { useState, useCallback, useEffect } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { ChatInterface } from './components/ChatInterface';
import { useVectorStore } from './hooks/useVectorStore';
import type { Settings, ChatMessage, StoredFile } from './types';
import { generateAnswer } from './services/api';
import { LogoIcon, DatabaseIcon } from './components/icons';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    llmProvider: 'ollama',
    embeddingProvider: 'ollama',
    llmModel: 'llama3',
    embeddingModel: 'nomic-embed-text',
    openRouterApiKey: '',
  });
  const { addFile, searchChunks, files, clearFiles, removeFile, isDBReady, dbInitError } = useVectorStore();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addFileWithSettings = (file: File, content: string) => {
    return addFile(file, content, settings);
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !isDBReady) return;

    const userMessage: ChatMessage = { author: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const contextChunks = await searchChunks(message, 5, settings);
      const context = contextChunks.map(c => c.content).join('\n---\n');
      
      const assistantMessageContent = await generateAnswer(settings, message, context);
      
      const assistantMessage: ChatMessage = { author: 'assistant', content: assistantMessageContent, context: contextChunks };
      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error generating answer:', error);
      const errorMessageContent = error instanceof Error ? error.message : "An unknown error occurred.";
      const errorMessage: ChatMessage = { author: 'assistant', content: `Sorry, I encountered an error: ${errorMessageContent}` };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [searchChunks, settings, isDBReady]);
  
  const handleClearChat = () => {
    setChatMessages([]);
  };

  const getDBStatus = () => {
    if (dbInitError) return { text: 'DB Error', color: 'text-red-400', busy: false };
    if (isDBReady) return { text: 'DB Ready', color: 'text-green-400', busy: false };
    return { text: 'DB Loading...', color: 'text-yellow-400', busy: true };
  }

  const dbStatus = getDBStatus();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-sans flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center">
          <LogoIcon className="h-8 w-8 text-cyan-400 mr-3" />
          <h1 className="text-xl font-bold text-white">Local & Cloud RAG UI</h1>
        </div>
        <div 
          className="flex items-center text-sm font-mono" 
          title={dbInitError ? dbInitError : 'Vector database status'}
        >
          <DatabaseIcon className={`h-4 w-4 mr-2 ${dbStatus.color} ${dbStatus.busy ? 'animate-pulse' : ''}`} />
          <span className={dbStatus.color}>{dbStatus.text}</span>
        </div>
      </header>

      <div className="flex-grow grid md:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Panel */}
        <aside className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2">
          <SettingsPanel settings={settings} onSettingsChange={setSettings} />
          <FileUpload addFile={addFileWithSettings} isDBReady={isDBReady} />
          <FileList files={files} onClearFiles={clearFiles} onRemoveFile={removeFile} />
        </aside>

        {/* Right Panel (Chat) */}
        <main className="md:col-span-8 lg:col-span-9 flex flex-col h-full max-h-[calc(100vh-80px)]">
          <ChatInterface 
            messages={chatMessages} 
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isDBReady={isDBReady}
          />
        </main>
      </div>
    </div>
  );
};

export default App;