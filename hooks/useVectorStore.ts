import { useState, useCallback, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import type { DocumentChunk, StoredFile, Settings } from '../types';
import { generateEmbedding } from '../services/api';

const CHUNK_SIZE = 500; // characters
const CHUNK_OVERLAP = 100; // characters

// DuckDB singleton instance
let db: duckdb.AsyncDuckDB | null = null;

async function initDB() {
    if (db) return db;

    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'application/javascript' })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    const newDb = new duckdb.AsyncDuckDB(logger, worker);
    await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);

    // Use browser's Origin Private File System for persistence
    await newDb.open({ path: 'rag-app.db' });
    db = newDb;

    // Create tables if they don't exist
    const c = await db.connect();
    await c.query(`
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            name TEXT,
            size BIGINT,
            processedAt TEXT
        );
    `);
    await c.query(`
        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            fileId TEXT,
            fileName TEXT,
            content TEXT,
            vector FLOAT[]
        );
    `);
    await c.close();
    
    return db;
}


export const useVectorStore = () => {
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [isDBReady, setIsDBReady] = useState(false);
    const [dbInitError, setDbInitError] = useState<string | null>(null);

    // Initialize DB and load files on mount
    useEffect(() => {
        const setup = async () => {
            try {
                await initDB();
                const c = await db!.connect();
                // FIX: Removed generic type argument from c.query to resolve TypeScript error. A cast is added to row.toJSON() to preserve type safety.
                const filesResult = await c.query(`SELECT id, name, size, processedAt FROM files;`);
                setFiles(filesResult.toArray().map(row => row.toJSON() as StoredFile));
                await c.close();
                setIsDBReady(true);
            } catch (error) {
                console.error("Failed to initialize DuckDB:", error);
                setDbInitError(error instanceof Error ? error.message : "Unknown database error");
                setIsDBReady(false);
            }
        };
        setup();
    }, []);

    const addFile = useCallback(async (file: File, content: string, settings: Settings): Promise<StoredFile> => {
        if (!db) throw new Error("Database not initialized");

        const fileId = `file_${Date.now()}`;
        const newFile: StoredFile = {
            id: fileId,
            name: file.name,
            size: file.size,
            processedAt: new Date().toISOString(),
        };

        // Chunking logic
        const rawChunks: string[] = [];
        for (let i = 0; i < content.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
            rawChunks.push(content.substring(i, i + CHUNK_SIZE));
        }

        const c = await db.connect();
        try {
            // FIX: The 'run' method does not exist on AsyncDuckDBConnection. Use 'prepare' and 'query' for parameterized queries.
            const fileInsertStmt = await c.prepare(
                'INSERT INTO files (id, name, size, processedAt) VALUES (?, ?, ?, ?)'
            );
            await fileInsertStmt.query(newFile.id, newFile.name, newFile.size, newFile.processedAt);
            await fileInsertStmt.close();

            // Prepare statement for efficient chunk insertion
            const stmt = await c.prepare('INSERT INTO chunks (id, fileId, fileName, content, vector) VALUES (?, ?, ?, ?, ?)');

            for (let i = 0; i < rawChunks.length; i++) {
                const chunkContent = rawChunks[i];
                const vector = await generateEmbedding(settings, chunkContent);
                const chunkId = `chunk_${fileId}_${i}`;
                // FIX: The 'run' method does not exist on AsyncPreparedStatement. Use 'query' instead.
                await stmt.query(chunkId, fileId, file.name, chunkContent, vector);
            }

            await stmt.close();

        } catch(err) {
            console.error('DB transaction failed', err);
            // Rollback might be needed in a more complex scenario
            throw err;
        } finally {
            await c.close();
        }

        setFiles(prev => [...prev, newFile]);
        return newFile;
    }, []);

    const removeFile = useCallback(async (fileId: string) => {
        if (!db) throw new Error("Database not initialized");

        const c = await db.connect();
        try {
            // FIX: The 'run' method does not exist on AsyncDuckDBConnection. Use 'prepare' and 'query' for parameterized queries.
            const deleteFilesStmt = await c.prepare('DELETE FROM files WHERE id = ?');
            await deleteFilesStmt.query(fileId);
            await deleteFilesStmt.close();
            
            // FIX: The 'run' method does not exist on AsyncDuckDBConnection. Use 'prepare' and 'query' for parameterized queries.
            const deleteChunksStmt = await c.prepare('DELETE FROM chunks WHERE fileId = ?');
            await deleteChunksStmt.query(fileId);
            await deleteChunksStmt.close();
        } finally {
            await c.close();
        }
        
        setFiles(prev => prev.filter(f => f.id !== fileId));
    }, []);

    const clearFiles = useCallback(async () => {
        if (!db) throw new Error("Database not initialized");

        const c = await db.connect();
        try {
            // FIX: The 'run' method does not exist on AsyncDuckDBConnection. Use 'query' for non-parameterized queries.
            await c.query('DELETE FROM files');
            // FIX: The 'run' method does not exist on AsyncDuckDBConnection. Use 'query' for non-parameterized queries.
            await c.query('DELETE FROM chunks');
        } finally {
            await c.close();
        }
        
        setFiles([]);
    }, []);

    const searchChunks = useCallback(async (query: string, topK: number, settings: Settings): Promise<DocumentChunk[]> => {
        if (!db) throw new Error("Database not initialized");

        const queryVector = await generateEmbedding(settings, query);
        const c = await db.connect();

        try {
            // Use DuckDB's native vector functions for efficient similarity search
            // FIX: Removed generic type argument from c.query to resolve a TypeScript error. A cast is added to row.toJSON() to preserve type safety.
            const queryResult = await c.query(`
                WITH scores AS (
                    SELECT 
                        *, 
                        list_dot_product(vector, [${queryVector.join(',')}]) / 
                        (list_norm(vector) * list_norm([${queryVector.join(',')}])) as similarity
                    FROM chunks
                )
                SELECT id, fileId, fileName, content, vector
                FROM scores
                WHERE similarity IS NOT NULL
                ORDER BY similarity DESC
                LIMIT ${topK};
            `);
            
            return queryResult.toArray().map(row => row.toJSON() as DocumentChunk);
        } finally {
            await c.close();
        }
    }, []);

    return { addFile, removeFile, searchChunks, files, clearFiles, isDBReady, dbInitError };
};
