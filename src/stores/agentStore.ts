import { create } from 'zustand';
import type { Agent, AgentGroup, Message } from '../types';
import { api } from '../services/api';

interface AgentState {
    agents: Agent[];
    currentAgent: Agent | null;
    chatHistory: Record<string, Message[]>;
    agentGroups: AgentGroup[];
    loading: boolean;
    sendingMessage: boolean;

    // Actions
    fetchAgents: () => Promise<void>;
    setCurrentAgent: (agent: Agent) => void;
    fetchChatHistory: (agentId: string) => Promise<void>;
    sendMessage: (message: string) => Promise<void>;
    sendMessageWithFile: (message: string, file: File) => Promise<void>;
    addAgent: (agent: Agent) => void;
    removeAgent: (agentId: string) => void;
    clearChatHistory: (agentId: string) => void;

    // Grouping
    createGroup: (name: string, agentIds: string[]) => void;
    removeGroup: (groupId: string) => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    agents: [],
    currentAgent: null,
    chatHistory: {},
    agentGroups: [],
    loading: false,
    sendingMessage: false,

    fetchAgents: async () => {
        set({ loading: true });
        try {
            const agents = await api.getAgents();
            set({ agents, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    setCurrentAgent: (agent) => {
        set({ currentAgent: agent });
        get().fetchChatHistory(agent.id);
    },

    fetchChatHistory: async (agentId) => {
        try {
            const conversation = await api.getConversation(agentId);
            if (conversation) {
                set((state) => ({
                    chatHistory: { ...state.chatHistory, [agentId]: conversation.messages },
                }));
            }
        } catch {
            // silently fail
        }
    },

    sendMessage: async (message) => {
        const { currentAgent, chatHistory } = get();
        if (!currentAgent) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        };

        const currentMessages = chatHistory[currentAgent.id] || [];
        set({
            chatHistory: {
                ...chatHistory,
                [currentAgent.id]: [...currentMessages, userMsg],
            },
            sendingMessage: true,
        });

        try {
            const response = await api.sendMessage(currentAgent.id, message);

            const newMessages: Message[] = [];

            // Add tool execution messages if any
            if (response.toolExecutions && response.toolExecutions.length > 0) {
                for (const exec of response.toolExecutions) {
                    newMessages.push({
                        id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        type: 'tool_execution',
                        content: exec.content,
                        timestamp: new Date().toISOString(),
                        tool: exec.tool,
                    });
                }
            }

            // Add agent response message
            newMessages.push({
                id: `agent-${Date.now()}`,
                type: 'agent',
                content: response.reply,
                timestamp: new Date().toISOString(),
            });

            set((state) => ({
                chatHistory: {
                    ...state.chatHistory,
                    [currentAgent.id]: [...(state.chatHistory[currentAgent.id] || []), ...newMessages],
                },
                sendingMessage: false,
            }));
        } catch {
            set({ sendingMessage: false });
        }
    },

    sendMessageWithFile: async (message, file) => {
        const { currentAgent, chatHistory } = get();
        if (!currentAgent) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            type: 'user',
            content: `${message}\n📎 ${file.name}`,
            timestamp: new Date().toISOString(),
        };

        const currentMessages = chatHistory[currentAgent.id] || [];
        set({
            chatHistory: {
                ...chatHistory,
                [currentAgent.id]: [...currentMessages, userMsg],
            },
            sendingMessage: true,
        });

        try {
            const response = await api.sendMessageWithFile(currentAgent.id, message, file);

            const newMessages: Message[] = [];

            if (response.toolExecutions && response.toolExecutions.length > 0) {
                for (const exec of response.toolExecutions) {
                    newMessages.push({
                        id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        type: 'tool_execution',
                        content: exec.content,
                        timestamp: new Date().toISOString(),
                        tool: exec.tool,
                    });
                }
            }

            newMessages.push({
                id: `agent-${Date.now()}`,
                type: 'agent',
                content: response.reply,
                timestamp: new Date().toISOString(),
            });

            set((state) => ({
                chatHistory: {
                    ...state.chatHistory,
                    [currentAgent.id]: [...(state.chatHistory[currentAgent.id] || []), ...newMessages],
                },
                sendingMessage: false,
            }));
        } catch {
            set({ sendingMessage: false });
        }
    },

    addAgent: (agent) => {
        set((state) => {
            // Don't add duplicates
            if (state.agents.some((a) => a.id === agent.id)) return state;
            return { agents: [...state.agents, agent] };
        });
    },

    removeAgent: (agentId) => {
        set((state) => ({
            agents: state.agents.filter((a) => a.id !== agentId),
            currentAgent: state.currentAgent?.id === agentId ? null : state.currentAgent,
        }));
    },

    clearChatHistory: (agentId) => {
        api.clearAgentSession(agentId);
        set((state) => ({
            chatHistory: { ...state.chatHistory, [agentId]: [] },
        }));
    },

    createGroup: (name, agentIds) => {
        const group: AgentGroup = {
            id: `group-${Date.now()}`,
            name,
            agentIds,
            color: '#6366f1',
            collapsed: false,
        };
        set((state) => ({
            agentGroups: [...state.agentGroups, group],
            agents: state.agents.map((a) =>
                agentIds.includes(a.id) ? { ...a, groupId: group.id } : a
            ),
        }));
    },

    removeGroup: (groupId) => {
        set((state) => ({
            agentGroups: state.agentGroups.filter((g) => g.id !== groupId),
            agents: state.agents.map((a) =>
                a.groupId === groupId ? { ...a, groupId: undefined } : a
            ),
        }));
    },
}));
