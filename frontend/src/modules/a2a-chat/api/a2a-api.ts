import axios from 'axios';
import type { AgentCreate, AgentResponse, MessageCreate, MessageResponse } from '@/backend-schemas';

// Determine API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAgents = async (): Promise<AgentResponse[]> => {
  const response = await api.get<AgentResponse[]>('/agents/');
  return response.data;
};

export const registerAgent = async (agent: AgentCreate): Promise<AgentResponse> => {
  const response = await api.post<AgentResponse>('/agents/', agent);
  return response.data;
};

export const getMessages = async (agentId: number): Promise<MessageResponse[]> => {
  const response = await api.get<MessageResponse[]>(`/messages/${agentId}`);
  return response.data;
};

export const sendMessage = async (senderId: number, message: MessageCreate): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>(`/messages/${senderId}`, message);
  return response.data;
};

export const connectToChatWebSocket = (agentId: number): WebSocket => {
  const ws = new WebSocket(`${WS_BASE_URL}/api/ws/chat/${agentId}`);
  return ws;
}; 