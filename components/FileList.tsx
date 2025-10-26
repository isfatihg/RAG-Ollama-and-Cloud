
import React from 'react';
import type { StoredFile } from '../types';
import { TrashIcon, DocumentIcon } from './icons';

interface FileListProps {
  files: StoredFile[];
  onClearFiles: () => void;
  onRemoveFile: (fileId: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onClearFiles, onRemoveFile }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex-grow flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Indexed Files</h3>
        {files.length > 0 && (
          <button 
            onClick={onClearFiles} 
            className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center"
            title="Clear all files and embeddings"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto -mr-2 pr-2">
        {files.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2 text-center">No files indexed yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.id} className="flex items-center justify-between bg-gray-800 p-2 rounded-md group">
                <div className="flex items-center overflow-hidden">
                  <DocumentIcon className="h-5 w-5 text-cyan-400 shrink-0 mr-2" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-gray-200 truncate" title={file.name}>{file.name}</span>
                    <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveFile(file.id)} 
                  className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                  title="Remove file"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
