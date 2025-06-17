// This is a placeholder file for backend schemas. 
// When running the full Docker Compose setup, these schemas will be generated automatically.
// For isolated frontend development, this file prevents import errors.

export interface AgentCreate { name: string; status?: string; }
export interface AgentResponse { id: number; name: string; status: string; }
export interface MessageCreate { receiver_id: number; content: string; message_type: string; }
export interface MessageResponse { id: number; sender_id: number; receiver_id: number; content: string; message_type: string; timestamp: string; } 