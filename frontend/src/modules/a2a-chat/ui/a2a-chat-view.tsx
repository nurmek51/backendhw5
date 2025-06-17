import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { useA2AChatStore } from '../model/a2a-chat-store';
import type { AgentCreate, MessageCreate, MessageResponse, AgentResponse } from '@/backend-schemas';

export default function A2AChatView() {
  const { agents, messages, currentAgent, activeChatAgent, setCurrentAgent, setActiveChatAgent, connectWebSocket, disconnectWebSocket } = useA2AChatStore();
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    useA2AChatStore.getState().fetchAgents();
  }, []);

  useEffect(() => {
    if (currentAgent) {
      connectWebSocket(currentAgent.id);
      useA2AChatStore.getState().fetchMessages(currentAgent.id);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [currentAgent, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRegisterAgent = async () => {
    if (newAgentName.trim() === '') return;
    const newAgent: AgentCreate = { name: newAgentName.trim(), status: "online" };
    await useA2AChatStore.getState().registerAgent(newAgent);
    setNewAgentName('');
    useA2AChatStore.getState().fetchAgents();
  };

  const handleSendMessage = async () => {
    if (newMessageContent.trim() === '' || !currentAgent || !activeChatAgent) return;
    const message: MessageCreate = {
      content: newMessageContent.trim(),
      receiver_id: activeChatAgent.id,
      message_type: "text",
    };
    await useA2AChatStore.getState().sendMessage(currentAgent.id, message);
    setNewMessageContent('');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-mono">
      <div className="w-1/4 border-r border-gray-700 p-4 flex flex-col">
        <Card className="bg-gray-800 border-gray-700 text-white shadow-neon-sm mb-4">
          <CardHeader>
            <CardTitle className="text-cyan-400">Your Agent</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAgent ? (
              <div className="text-lg">
                <p>Name: <span className="text-fuchsia-400">{currentAgent.name}</span></p>
                <p>Status: <span className="text-green-500">{currentAgent.status}</span></p>
                <Button
                  variant="outline"
                  className="mt-2 bg-gray-700 text-fuchsia-400 border-fuchsia-500 hover:bg-gray-600 shadow-neon-sm"
                  onClick={() => {
                    setCurrentAgent(null);
                    disconnectWebSocket();
                  }}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div>
                <Input
                  type="text"
                  placeholder="Enter your agent name"
                  value={newAgentName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAgentName(e.target.value)}
                  className="mb-2 bg-gray-700 border-fuchsia-500 text-white placeholder-gray-400 shadow-neon-inner"
                />
                <Button
                  onClick={handleRegisterAgent}
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 shadow-neon-button"
                >
                  Register Agent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 text-white shadow-neon-sm flex-grow">
          <CardHeader>
            <CardTitle className="text-cyan-400">Available Agents</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <ScrollArea className="flex-grow h-0">
              {agents.length === 0 ? (
                <p className="text-gray-400">No other agents available.</p>
              ) : (
                agents.filter((agent: AgentResponse) => agent.id !== currentAgent?.id).map((agent: AgentResponse) => (
                  <Button
                    key={agent.id}
                    variant="ghost"
                    className={`w-full justify-start mb-2 ${activeChatAgent?.id === agent.id ? "bg-indigo-600 hover:bg-indigo-700 shadow-neon-button" : "hover:bg-gray-700"}`}
                    onClick={() => setActiveChatAgent(agent)}
                  >
                    <span className={`w-3 h-3 rounded-full mr-2 ${agent.status === 'online' ? 'bg-green-500' : agent.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                    {agent.name}
                  </Button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex-grow flex flex-col">
        {activeChatAgent ? (
          <div className="flex-grow flex flex-col">
            <Card className="bg-gray-800 border-gray-700 text-white shadow-neon-sm mb-4">
              <CardHeader>
                <CardTitle className="text-cyan-400">Chat with <span className="text-fuchsia-400">{activeChatAgent.name}</span></CardTitle>
              </CardHeader>
            </Card>

            <ScrollArea className="flex-grow p-4 space-y-4 h-0">
              {messages
                .filter((msg: MessageResponse) => 
                  (msg.sender_id === currentAgent?.id && msg.receiver_id === activeChatAgent.id) ||
                  (msg.sender_id === activeChatAgent.id && msg.receiver_id === currentAgent?.id)
                )
                .map((msg: MessageResponse, index: number) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender_id === currentAgent?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`p-3 rounded-lg max-w-xs ${msg.sender_id === currentAgent?.id ? 'bg-indigo-700 shadow-neon-button' : 'bg-gray-700 shadow-neon-sm'}`}>
                      <p className="text-sm text-gray-400 mb-1">
                        {msg.sender_id === currentAgent?.id ? "You" : activeChatAgent.name} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="p-4 border-t border-gray-700 flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessageContent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessageContent(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                className="flex-grow bg-gray-700 border-fuchsia-500 text-white placeholder-gray-400 shadow-neon-inner"
              />
              <Button onClick={handleSendMessage} className="bg-fuchsia-600 hover:bg-fuchsia-700 shadow-neon-button">
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-400 text-2xl">Select an agent to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
} 