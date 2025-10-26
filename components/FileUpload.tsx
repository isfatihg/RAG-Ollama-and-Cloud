import React, { useState, useCallback } from 'react';
import type { StoredFile } from '../types';
import { UploadIcon, DocumentTextIcon } from './icons';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// Let TypeScript know about the globally available 'mammoth' object from the script tag
declare const mammoth: any;


interface FileUploadProps {
  addFile: (file: File, content: string) => Promise<StoredFile>;
  isDBReady: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ addFile, isDBReady }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setError(null);
      setFileName(file.name);
      
      try {
        let content = '';
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        switch (fileExtension) {
          case 'txt':
          case 'md':
          case 'text':
            content = await file.text();
            break;
          case 'pdf':
            const pdfBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument(pdfBuffer).promise;
            const texts = [];
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                texts.push(textContent.items.map((item: any) => item.str).join(' '));
            }
            content = texts.join('\n\n'); // Separate pages with double newlines
            break;
          case 'docx':
            const docxBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
            content = result.value;
            break;
          case 'doc':
             throw new Error('.doc files are not supported. Please save as .docx or .pdf first.');
          default:
            throw new Error(`Unsupported file type: .${fileExtension}`);
        }

        if (!content.trim()) {
          throw new Error('File is empty or content could not be extracted.');
        }

        await addFile(file, content);

      } catch (err) {
        console.error('Error processing file:', err);
        setError(err instanceof Error ? err.message : 'Failed to process file.');
      } finally {
        setIsProcessing(false);
        setFileName(null);
        event.target.value = '';
      }
    }
  }, [addFile]);

  const getUploadMessage = () => {
    if (!isDBReady) return 'Database not ready...';
    if (isProcessing) return `Processing ${fileName}...`;
    return 'Upload .txt, .md, .pdf, or .docx';
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col items-center justify-center text-center">
       <h2 className="text-lg font-semibold text-white flex items-center self-start mb-2">
        <DocumentTextIcon className="h-5 w-5 mr-2 text-cyan-400" />
        Knowledge Base
      </h2>
      <div className={`w-full p-4 border-2 border-dashed border-gray-700 rounded-lg ${!isDBReady ? 'opacity-50' : ''}`}>
        <label htmlFor="file-upload" className={`${isDBReady && !isProcessing ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
          <div className="flex flex-col items-center">
            <UploadIcon className="h-8 w-8 text-gray-500 mb-2" />
            <span className="text-sm text-gray-400 font-semibold">
              {getUploadMessage()}
            </span>
            <p className="text-xs text-gray-500">Click to select or drag and drop</p>
          </div>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.text,.pdf,.docx,.doc" disabled={isProcessing || !isDBReady} />
        </label>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
};