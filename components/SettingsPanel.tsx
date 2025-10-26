import React from 'react';
import type { Settings, Provider } from '../types';
import { ModelIcon, CpuChipIcon, KeyIcon } from './icons';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
}

const ProviderButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {

  const handleProviderChange = <T extends keyof Settings,>(
    key: T,
    value: Settings[T]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onSettingsChange({ ...settings, [name]: value });
  }

  const showOpenRouterKeyInput = settings.llmProvider === 'openrouter' || settings.embeddingProvider === 'openrouter';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center">
        <CpuChipIcon className="h-5 w-5 mr-2 text-cyan-400" />
        Model Configuration
      </h2>

      {/* LLM Provider */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">LLM Provider</label>
        <div className="flex bg-gray-800 p-1 rounded-lg">
          <ProviderButton 
            label="Ollama" 
            isActive={settings.llmProvider === 'ollama'} 
            onClick={() => handleProviderChange('llmProvider', 'ollama')}
          />
          <ProviderButton 
            label="OpenRouter" 
            isActive={settings.llmProvider === 'openrouter'} 
            onClick={() => handleProviderChange('llmProvider', 'openrouter')}
          />
        </div>
        <div className="relative">
           <ModelIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="llmModel"
            value={settings.llmModel}
            onChange={handleInputChange}
            placeholder="LLM Model Name"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Embedding Provider */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Embedding Provider</label>
        <div className="flex bg-gray-800 p-1 rounded-lg">
          <ProviderButton 
            label="Ollama" 
            isActive={settings.embeddingProvider === 'ollama'} 
            onClick={() => handleProviderChange('embeddingProvider', 'ollama')}
          />
          <ProviderButton 
            label="OpenRouter" 
            isActive={settings.embeddingProvider === 'openrouter'} 
            onClick={() => handleProviderChange('embeddingProvider', 'openrouter')}
          />
        </div>
        <div className="relative">
           <ModelIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="embeddingModel"
            value={settings.embeddingModel}
            onChange={handleInputChange}
            placeholder="Embedding Model Name"
            className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* OpenRouter API Key */}
      {showOpenRouterKeyInput && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">OpenRouter API Key</label>
          <div className="relative">
             <KeyIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              name="openRouterApiKey"
              value={settings.openRouterApiKey}
              onChange={handleInputChange}
              placeholder="Enter your OpenRouter API key"
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            />
          </div>
        </div>
      )}
    </div>
  );
};
