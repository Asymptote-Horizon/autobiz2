// TypeScript interfaces for AutoBiz AI

export interface Agent {
    id: string;
    name: string;
    avatar: string;
    color: string;
    description: string;
    status: 'online' | 'busy' | 'offline';
    model?: string;
    tools?: string[];
    lastMessage?: string;
    timestamp?: string;
    groupId?: string;
    category?: string;
    creator?: string;
}

export interface AgentGroup {
    id: string;
    name: string;
    agentIds: string[];
    color: string;
    collapsed: boolean;
}

export interface Message {
    id: string;
    type: 'user' | 'agent' | 'tool_execution';
    content: string;
    timestamp: string;
    tool?: string;
    metadata?: Record<string, unknown>;
}

export interface Conversation {
    messages: Message[];
}

export interface MetricData {
    current: number;
    previous: number;
    change: number;
    currency?: string;
}

export interface OrderMetrics {
    pending: number;
    completed: number;
    cancelled: number;
}

export interface BusinessMetrics {
    revenue: MetricData;
    customers: MetricData;
    orders: OrderMetrics;
    growth: MetricData;
}

export interface ChartPoint {
    month?: string;
    day?: string;
    category?: string;
    name?: string;
    value?: number;
    sales?: number;
    visitors?: number;
    conversions?: number;
    color?: string;
}

export interface Recommendation {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    agent_id: string;
    action_text?: string;
}

export interface MarketplaceAgent {
    id: string;
    name: string;
    creator: string;
    description: string;
    category: string;
    rating: number;
    reviews?: number;
    price: number | 'free';
    tags: string[];
    downloads: number;
    avatar: string;
    color: string;
    featured?: boolean;
}

export interface OnboardingData {
    businessName: string;
    industry: string;
    customerSize: string;
    revenueRange: string;
    goals: string[];
    challenges: string[];
    teamSize: string;
    freeText?: string;
}

export interface OnboardingConfig {
    system_prompt: string;
    available_agents: string[];
    industries: string[];
    business_goals: string[];
    challenges: string[];
    mock_response: {
        summary: string;
        recommended_agents: Array<{
            agent_id: string;
            reason: string;
        }>;
    };
}
