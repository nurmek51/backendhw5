import { create } from 'zustand';
import type { AgentResponse, MessageResponse, AgentCreate, MessageCreate } from '@/backend-schemas';
import * as a2aApi from "../api/a2a-api";

interface A2AChatState {
  agents: AgentResponse[];
  messages: MessageResponse[];
  currentAgent: AgentResponse | null;
  activeChatAgent: AgentResponse | null;
  ws: WebSocket | null;
  
  setAgents: (agents: AgentResponse[]) => void;
  setCurrentAgent: (agent: AgentResponse | null) => void;
  setActiveChatAgent: (agent: AgentResponse | null) => void;
  addMessage: (message: MessageResponse) => void;
  
  fetchAgents: () => Promise<void>;
  registerAgent: (agent: AgentCreate) => Promise<void>;
  fetchMessages: (agentId: number) => Promise<void>;
  sendMessage: (senderId: number, message: MessageCreate) => Promise<void>;
  
  connectWebSocket: (agentId: number) => void;
  disconnectWebSocket: () => void;
}

export const useA2AChatStore = create<A2AChatState>((set, get) => ({
  agents: [],
  messages: [],
  currentAgent: null,
  activeChatAgent: null,
  ws: null,

  setAgents: (agents) => set({ agents }),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  setActiveChatAgent: (agent) => set({ activeChatAgent: agent }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  fetchAgents: async () => {
    try {
      const fetchedAgents = await a2aApi.getAgents();
      set({ agents: fetchedAgents });
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  },

  registerAgent: async (agent) => {
    try {
      const registeredAgent = await a2aApi.registerAgent(agent);
      set({ currentAgent: registeredAgent });
    } catch (error) {
      console.error("Failed to register agent:", error);
    }
  },

  fetchMessages: async (agentId) => {
    try {
      const fetchedMessages = await a2aApi.getMessages(agentId);
      set({ messages: fetchedMessages });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  },

  sendMessage: async (senderId, message) => {
    try {
      const sentMessage = await a2aApi.sendMessage(senderId, message);
      get().addMessage(sentMessage); // Add to local state immediately
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  },

  connectWebSocket: (agentId) => {
    const { ws: existingWs } = get();
    if (existingWs) {
      existingWs.close();
    }
    const newWs = a2aApi.connectToChatWebSocket(agentId);
    newWs.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      get().addMessage(message); // Add received message to state
    };
    newWs.onclose = (event: CloseEvent) => {
      console.log("WebSocket closed:", event.code, event.reason);
      set({ ws: null });
    };
    newWs.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };
    set({ ws: newWs });
  },

  disconnectWebSocket: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null });
    }
  },
})); 