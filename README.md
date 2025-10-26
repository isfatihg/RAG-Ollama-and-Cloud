# Local & Cloud RAG UI

A user-friendly, browser-based interface for a Retrieval-Augmented Generation (RAG) system. This application allows you to upload your documents, configure local (Ollama) or cloud (OpenRouter) models, and chat with your data. All file processing, embedding, and storage happen securely in your local browser.

 <!-- Placeholder image -->

## Key Features

- **Dual Provider Support**: Seamlessly switch between local models via **Ollama** and thousands of cloud models via **OpenRouter**.
- **Privacy First**: All documents are parsed, chunked, and embedded directly in your browser. Nothing is uploaded to a server.
- **Persistent Local Storage**: Utilizes **DuckDB-WASM** to store all file metadata and vector embeddings in your browser's persistent storage. Your data remains across sessions without needing a backend database.
- **Multiple File Types**: Upload and process `.txt`, `.md`, `.pdf`, and `.docx` files.
- **Advanced RAG Pipeline**: Implements a full RAG pipeline from document parsing and vector-based semantic search to context-augmented answer generation.
- **Zero Backend Required**: The entire application is a static site that runs locally, ensuring maximum privacy and ease of use.

---

## How It Works

1.  **Document Upload & Parsing**: When you upload a file, it is read and parsed directly in the browser. PDF and DOCX files are processed using `pdf.js` and `mammoth.js`.
2.  **Chunking**: The extracted text is divided into smaller, overlapping chunks to ensure semantic completeness.
3.  **Embedding**: Each chunk is sent to your selected embedding provider (Ollama or OpenRouter) to be converted into a numerical vector representation.
4.  **Storage**: The chunks and their corresponding vector embeddings are stored in a local, in-browser DuckDB database.
5.  **Querying & Retrieval**: When you ask a question, it is also embedded into a vector. A highly efficient cosine similarity search is performed within DuckDB to find the most relevant document chunks.
6.  **Answer Generation**: The retrieved chunks (context) and your original question are sent to the selected LLM provider. The model uses the context to generate a factual, relevant answer.

---

## Prerequisites

1.  **A Modern Web Browser**: Chrome, Firefox, Edge, or Safari.
2.  **(Optional) Ollama**: To use local models, you must have [Ollama](https://ollama.com/) installed and running on your machine.

    After installing Ollama, pull the models you wish to use. The default models for this app are:
    ```bash
    # For LLM chat
    ollama pull llama3

    # For embeddings
    ollama pull nomic-embed-text
    ```

3.  **(Optional) OpenRouter Account**: To use cloud models, you will need an account and an API key from [OpenRouter.ai](https://openrouter.ai/).

---

## Getting Started

This project is a static web application and does not require a complex build process.

1.  **Clone or Download the Project**: Get all the files (`index.html`, `index.tsx`, etc.) onto your local machine.

2.  **Serve the Files**: You need to serve the files from a local web server. The simplest way is to use Python's built-in HTTP server.

    - Open your terminal or command prompt.
    - Navigate to the project's root directory (where `index.html` is located).
    - Run the following command:

      ```bash
      # For Python 3
      python3 -m http.server
      ```
      This will start a web server, typically on port 8000.

3.  **Open the Application**: Open your web browser and navigate to:
    [http://localhost:8000](http://localhost:8000)

---

## How to Use

1.  **Configure Models**:
    - Use the **Model Configuration** panel on the left.
    - Select your desired "LLM Provider" and "Embedding Provider" (Ollama or OpenRouter).
    - Enter the specific model names you wish to use (e.g., `llama3` for LLM, `nomic-embed-text` for embedding).
    - If you select OpenRouter for either provider, an input field for your **OpenRouter API Key** will appear.

2.  **Upload Documents**:
    - Drag and drop your files onto the **Knowledge Base** panel, or click to select them.
    - The application will show a "Processing..." status while it chunks and embeds the file.
    - Once complete, the file will appear in the "Indexed Files" list.

3.  **Chat with Your Data**:
    - Once the database is ready and you have indexed at least one file, you can start asking questions in the chat panel on the right.
    - The assistant will retrieve relevant context from your documents to answer your questions. You can click on "Retrieved Context" to see the exact sources used for the answer.
