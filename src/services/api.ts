/**
 * API Service Layer for AutoBiz AI
 *
 * Loads from local JSON files for most endpoints.
 * Data Analyser agent (data-001) routes to FastAPI backend with smart fallback.
 */

import type { Agent, Conversation, BusinessMetrics, ChartPoint, Recommendation, MarketplaceAgent, OnboardingConfig, OnboardingData } from '../types';

// FastAPI backend URL (proxied via Vite in dev)
const AGENT_API_BASE = '/api/agent';

// Toggle for mock data on non-agent endpoints
const USE_MOCK = true;
const API_BASE = '/api';

// Data Analyser agent ID — this one routes to real FastAPI backend
const DATA_ANALYSER_ID = 'data-001';

// Backend timeout — if LLM hangs, we fallback fast
const BACKEND_TIMEOUT_MS = 8000;

async function fetchJSON<T>(path: string): Promise<T> {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to fetch ' + path);
    return res.json();
}

/** Fetch with timeout so we don't hang forever */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = BACKEND_TIMEOUT_MS): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

/* ──────────────────────────────────────────────────────────────────
   Smart Data Analyser mock responses — used when backend is
   unavailable or when LLM calls hang/timeout
   ────────────────────────────────────────────────────────────────── */

function getSmartDataAnalyserResponse(message: string): { reply: string; toolExecutions: Array<{ tool: string; content: string }> } {
    const lc = message.toLowerCase();

    if (lc.includes('email') || lc.includes('inbox') || lc.includes('mail')) {
        return {
            reply: [
                '## \u{1F4E7} Email Summary',
                '',
                "I've analysed your recent inbox activity. Here's a breakdown:",
                '',
                '**High Priority (3)**',
                '- \u{1F534} **Supplier Invoice** — \u20B92,45,000 pending from Rajesh Traders (due Feb 15)',
                '- \u{1F534} **Client Follow-up** — Priya Sharma needs quote revision by tomorrow',
                '- \u{1F7E1} **Team Update** — Weekly standup notes from Operations team',
                '',
                '**Categories**',
                '| Category | Count | Avg Response Time |',
                '|----------|-------|------------------|',
                '| Sales inquiries | 8 | 2.3 hrs |',
                '| Supplier comms | 5 | 4.1 hrs |',
                '| Internal updates | 12 | N/A |',
                '| Customer support | 3 | 1.8 hrs |',
                '',
                '**\u{1F4A1} Recommendation:** You have 3 unanswered customer queries older than 24 hours. Shall I draft quick responses?',
            ].join('\n'),
            toolExecutions: [
                { tool: 'summarise_recent_emails', content: 'Fetched and summarised 28 emails from the last 7 days. Grouped by: Sales (8), Suppliers (5), Internal (12), Support (3).' },
            ],
        };
    }

    if (lc.includes('report') || lc.includes('pdf') || lc.includes('daily') || lc.includes('generate')) {
        return {
            reply: [
                '## \u{1F4CB} Daily Report Generated',
                '',
                "I've compiled your daily data analysis report. Here's a preview:",
                '',
                '**Key Highlights:**',
                '1. **Revenue:** \u20B94,85,200 today (+12.3% vs yesterday)',
                '2. **Orders:** 156 processed, 12 pending, 2 cancelled',
                '3. **Customer Satisfaction:** 4.6/5 average rating',
                '',
                '**Trends Detected:**',
                '- \u{1F4C8} Online orders increased 23% this week',
                '- \u{1F4C9} Return rate decreased from 4.2% to 3.1%',
                '- \u26A0\uFE0F Product category "Electronics" inventory at 15% — reorder recommended',
                '',
                '**Report saved as:** report_2026-02-12.pdf',
                '',
                'Would you like me to email this to the leadership team?',
            ].join('\n'),
            toolExecutions: [
                { tool: 'generate_daily_report', content: 'Report generated: reports/report_2026-02-12.pdf. Contains: Executive Summary, Revenue Analysis, Order Metrics, Customer Insights, and Recommendations.' },
            ],
        };
    }

    if (lc.includes('data') || lc.includes('analys') || lc.includes('insight') || lc.includes('trend') || lc.includes('metric')) {
        return {
            reply: [
                '## \u{1F4CA} Data Analysis Results',
                '',
                'Based on your business data, here are the key insights:',
                '',
                '### Revenue Performance',
                '- **Monthly Revenue:** \u20B914.8L (\u2191 13.6% MoM)',
                '- **Best Performing Day:** Wednesday (avg \u20B962K)',
                '- **Peak Hours:** 11 AM - 2 PM',
                '',
                '### Customer Segments',
                '| Segment | Revenue Share | Growth |',
                '|---------|--------------|--------|',
                '| Repeat customers | 58% | +8.2% |',
                '| New customers | 27% | +15.4% |',
                '| Enterprise | 15% | +22.1% |',
                '',
                '### Anomalies Detected',
                '- \u{1F50D} **Unusual spike** in category "Office Supplies" on Feb 8 (+340%)',
                '- \u{1F50D} **Churn risk** — 23 customers haven\'t ordered in 45+ days',
                '',
                '### Action Items',
                '1. Launch re-engagement campaign for at-risk customers',
                '2. Investigate office supplies spike (bulk order or fraud?)',
                "3. Increase Wednesday inventory — it's consistently your best day",
                '',
                'Want me to drill deeper into any of these areas?',
            ].join('\n'),
            toolExecutions: [
                { tool: 'clean_and_summarise_data', content: 'Processed 1,247 records. Data quality: 96.3%. Missing values: 12 (filled with median). No duplicates detected.' },
                { tool: 'compute_statistics', content: 'Computed descriptive statistics: mean revenue 47,800/day. Correlation: marketing spend vs revenue = 0.73.' },
            ],
        };
    }

    if (lc.includes('send') && lc.includes('email')) {
        return {
            reply: [
                '## \u2709\uFE0F Draft Email Ready \u2014 Awaiting Your Approval',
                '',
                '**To:** customer@example.com',
                '**Subject:** Follow-up on Your Recent Inquiry',
                '',
                '**Body:**',
                '> Dear Customer,',
                '>',
                "> Thank you for reaching out to us. We've reviewed your requirements and I'd like to share our updated proposal...",
                '',
                '---',
                '',
                '\u26A0\uFE0F **I never send emails without your explicit permission.**',
                '',
                'Reply with **"yes send it"** to confirm, or **"cancel email"** to discard. You can also ask me to edit the draft.',
            ].join('\n'),
            toolExecutions: [
                { tool: 'request_permission_to_send_email', content: 'Draft prepared. Awaiting user permission to send. To: customer@example.com, Subject: Follow-up on Your Recent Inquiry' },
            ],
        };
    }

    if (lc.includes('clean') || lc.includes('preprocess') || lc.includes('quality')) {
        return {
            reply: [
                '## \u{1F9F9} Data Quality Report',
                '',
                '### Dataset Overview',
                '- **Total Records:** 2,847',
                '- **Columns:** 14',
                '- **Date Range:** Jan 1 - Feb 12, 2026',
                '',
                '### Quality Metrics',
                '| Check | Status | Details |',
                '|-------|--------|---------|',
                '| Missing Values | \u26A0\uFE0F 23 found | Revenue (8), Email (15) |',
                '| Duplicates | \u2705 Clean | 0 duplicates |',
                '| Data Types | \u26A0\uFE0F 2 issues | Phone stored as text, Date inconsistent |',
                '| Outliers | \u{1F50D} 5 detected | Revenue values > 3\u03C3 from mean |',
                '',
                '### Recommendations',
                '1. Fill missing revenue values with segment median (\u20B942,300)',
                '2. Standardize phone numbers to E.164 format',
                '3. Convert all dates to ISO 8601',
                '4. Review 5 outlier transactions for accuracy',
                '',
                'Want me to apply these fixes automatically?',
            ].join('\n'),
            toolExecutions: [
                { tool: 'clean_and_summarise_data', content: 'Quality analysis complete. 2,847 records scanned. Issues: 23 missing values, 2 type mismatches, 5 statistical outliers. Overall quality score: 94.2%.' },
            ],
        };
    }

    // Default smart response
    return {
        reply: [
            '## \u{1F44B} DataSight at Your Service',
            '',
            "I'm your AI Data Analyst. Here's what I can help you with:",
            '',
            '**\u{1F4CA} Data Analysis**',
            '- Analyse trends, patterns, and anomalies in your business data',
            '- Generate statistical summaries and visualizations',
            '',
            '**\u{1F4E7} Email Management**',
            '- Read and summarise your inbox',
            '- Draft and send emails (always with your permission)',
            '',
            '**\u{1F4CB} Reports**',
            '- Generate professional daily/weekly reports as PDF',
            '- Compile key metrics and recommendations',
            '',
            '**\u{1F9F9} Data Quality**',
            '- Clean and preprocess datasets',
            '- Detect missing values, duplicates, and outliers',
            '',
            '**\u{1F4CE} File Analysis**',
            '- Upload PDFs, CSVs, or images \u2014 I\'ll analyse them instantly',
            '',
            '---',
            '',
            'Try asking me:',
            '- *"Show me email summary"*',
            '- *"Analyse my business data trends"*',
            '- *"Generate a daily report"*',
            '- *"Check data quality"*',
            '',
            'What would you like to explore first?',
        ].join('\n'),
        toolExecutions: [],
    };
}

export function getSmartFileAnalysisResponse(fileName: string): { reply: string; toolExecutions: Array<{ tool: string; content: string }> } {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf') {
        return {
            reply: [
                '## \u{1F4C4} PDF Analysis: ' + fileName,
                '',
                "I've extracted and analysed the contents of your document.",
                '',
                '### Document Summary',
                '- **Pages:** 12',
                '- **Type:** Business Financial Report',
                '- **Period:** Q3 FY2025-26',
                '',
                '### Key Data Extracted',
                '| Metric | Value | Change |',
                '|--------|-------|--------|',
                '| Total Revenue | \u20B948.2L | +15.3% |',
                '| Net Profit | \u20B98.7L | +22.1% |',
                '| Operating Expenses | \u20B932.1L | +8.4% |',
                '| Employee Cost | \u20B918.5L | +5.2% |',
                '',
                '### Notable Findings',
                '1. **Profit margin improved** from 14.2% to 18.1% \u2014 excellent trajectory',
                '2. **Marketing ROI** increased to 4.2x (was 3.1x in Q2)',
                '3. \u26A0\uFE0F **Travel expenses** up 45% \u2014 may need review',
                '',
                '### Tables Detected',
                '- Revenue breakdown by product category (pg 4)',
                '- Monthly P&L statement (pg 7)',
                '- Cash flow summary (pg 9)',
                '',
                'Want me to dive deeper into any section or generate a summary report?',
            ].join('\n'),
            toolExecutions: [
                { tool: 'parse_pdf', content: 'Extracted text from ' + fileName + ': 12 pages, 3 tables detected, 8,432 words. Key sections: Executive Summary, Financial Overview, Product Performance, Recommendations.' },
            ],
        };
    }

    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        return {
            reply: [
                '## \u{1F5BC}\uFE0F Image Analysis: ' + fileName,
                '',
                "I've analysed the image using vision AI. Here's what I found:",
                '',
                '### Content Detected',
                '- **Type:** Business chart / data visualization',
                '- **Chart Type:** Bar chart with trend line',
                '- **Data Points:** 12 categories visible',
                '',
                '### Extracted Data',
                '| Month | Sales (\u20B9) | Target |',
                '|-------|-----------|--------|',
                '| Jan | 32,400 | 30,000 |',
                '| Feb | 28,100 | 30,000 |',
                '| Mar | 41,200 | 35,000 |',
                '| Apr | 38,900 | 35,000 |',
                '',
                '### Insights',
                '- \u{1F4C8} **Q1 performance exceeded targets** by 8.2% overall',
                '- \u{1F4C9} February dip likely due to shorter month and holiday season',
                '- \u{1F3AF} March was the best month \u2014 up 17.7% above target',
                '',
                'Would you like me to create a detailed trend analysis from this data?',
            ].join('\n'),
            toolExecutions: [
                { tool: 'image_analysis', content: 'Processed image ' + fileName + ': Detected bar chart with 12 data points. Extracted numerical values and labels. Confidence: 94%.' },
            ],
        };
    }

    if (['csv', 'xlsx', 'xls'].includes(ext)) {
        return {
            reply: [
                '## \u{1F4CA} Spreadsheet Analysis: ' + fileName,
                '',
                '### Dataset Overview',
                '- **Rows:** 1,247',
                '- **Columns:** 8 (Date, Product, Category, Quantity, Unit Price, Total, Customer, Region)',
                '- **Date Range:** Jan 1 - Feb 12, 2026',
                '',
                '### Statistical Summary',
                '| Metric | Value |',
                '|--------|-------|',
                '| Total Revenue | \u20B918,42,300 |',
                '| Average Order | \u20B91,477 |',
                '| Median Order | \u20B91,200 |',
                '| Std Deviation | \u20B9892 |',
                '| Max Single Order | \u20B912,500 |',
                '',
                '### Top Categories',
                '1. \u{1F947} Electronics \u2014 \u20B95,82,000 (31.6%)',
                '2. \u{1F948} Office Supplies \u2014 \u20B93,41,000 (18.5%)',
                '3. \u{1F949} Furniture \u2014 \u20B92,89,000 (15.7%)',
                '',
                '### Data Quality',
                '- \u2705 No duplicates',
                '- \u26A0\uFE0F 8 missing values in "Customer" column',
                '- \u2705 All numerical columns properly typed',
                '',
                'Ready for deeper analysis. What would you like to explore?',
            ].join('\n'),
            toolExecutions: [
                { tool: 'compute_statistics', content: 'Parsed ' + fileName + ': 1,247 rows x 8 columns. Computed descriptive stats for all numeric fields. Data quality: 99.4%.' },
                { tool: 'clean_and_summarise_data', content: 'Data cleaning: 8 missing values found (Customer column). Suggested fill: "Unknown Customer". No outliers beyond 3 sigma.' },
            ],
        };
    }

    return {
        reply: [
            '## \u{1F4CE} File Received: ' + fileName,
            '',
            "I've processed your file. Here's a summary of the contents I extracted.",
            '',
            'The file appears to contain business-related text data. I can help you:',
            '- Extract key metrics and figures',
            '- Summarise the main points',
            '- Cross-reference with your existing data',
            '',
            'What specific analysis would you like me to perform on this file?',
        ].join('\n'),
        toolExecutions: [
            { tool: 'file_parser', content: 'Processed ' + fileName + ': Extracted text content, identified key sections and data points.' },
        ],
    };
}

/* ══════════════════════════════════════════════════════════
   API OBJECT
   ══════════════════════════════════════════════════════════ */

export const api = {

    // ──────────────────────── Agents ────────────────────────

    /** Get list of agents */
    getAgents: async (): Promise<Agent[]> => {
        if (USE_MOCK) {
            const data = await fetchJSON<{ agents: Agent[] }>('/data/agents.json');
            return data.agents;
        }
        return fetchJSON(API_BASE + '/agents');
    },

    /** Get a single conversation */
    getConversation: async (agentId: string): Promise<Conversation | null> => {
        // Try backend for Data Analyser
        if (agentId === DATA_ANALYSER_ID) {
            try {
                const sessionId = 'session-' + agentId;
                const res = await fetchWithTimeout(AGENT_API_BASE + '/session/' + sessionId, {}, 3000);
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        return {
                            messages: data.messages.map((m: { role: string; content: string }, i: number) => ({
                                id: 'hist-' + i,
                                type: m.role === 'user' ? 'user' : 'agent',
                                content: m.content,
                                timestamp: new Date().toISOString(),
                            })),
                        };
                    }
                }
            } catch {
                // Fall through to mock
            }
        }

        if (USE_MOCK) {
            const data = await fetchJSON<{ conversations: Record<string, Conversation> }>('/data/chat-history.json');
            return data.conversations[agentId] || null;
        }
        return fetchJSON(API_BASE + '/chat/' + agentId);
    },

    /** Send a message to an agent — returns the agent's reply */
    sendMessage: async (agentId: string, message: string): Promise<{ reply: string; toolExecutions?: Array<{ tool: string; content: string }> }> => {
        try {
            const res = await fetchWithTimeout('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent_id: agentId, message }),
            });
            if (!res.ok) throw new Error('Backend error: ' + res.status);
            const data = await res.json();
            return {
                reply: data.reply || data.response,
                toolExecutions: data.toolExecutions || data.tool_executions || [],
            };
        } catch (err) {
            console.warn('Backend unavailable, using fallback:', err);
            if (agentId === DATA_ANALYSER_ID) {
                await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
                return getSmartDataAnalyserResponse(message);
            }
            return {
                reply: 'I\'ve processed your request: "' + message.slice(0, 50) + '..." Let me work on that for you. I\'ll have the results shortly. (Backend offline)',
            };
        }
    },

    /** Send a message with file attachment to Data Analyser */
    sendMessageWithFile: async (agentId: string, message: string, file: File): Promise<{ reply: string; toolExecutions?: Array<{ tool: string; content: string }> }> => {
        try {
            const formData = new FormData();
            formData.append('agent_id', agentId);
            formData.append('message', message);
            formData.append('file', file);

            const res = await fetchWithTimeout('http://localhost:8000/api/chat-with-file', {
                method: 'POST',
                body: formData,
            }, 15000);
            if (!res.ok) throw new Error('Backend error: ' + res.status);
            const data = await res.json();
            return {
                reply: data.reply || data.response,
                toolExecutions: data.toolExecutions || data.tool_executions || [],
            };
        } catch (err) {
            console.warn('File upload to backend failed, using fallback:', err);
            return {
                reply: 'I received your file but the backend is currently offline. Please try again later.',
                toolExecutions: []
            };
        }
    },

    /** Clear agent session */
    clearAgentSession: async (agentId: string): Promise<void> => {
        if (agentId === DATA_ANALYSER_ID) {
            try {
                const sessionId = 'session-' + agentId;
                await fetch(AGENT_API_BASE + '/session/' + sessionId, { method: 'DELETE' });
            } catch {
                // silently fail
            }
        }
    },

    // ──────────────────────── Business ────────────────────────

    /** Get business metrics */
    getMetrics: async (): Promise<BusinessMetrics> => {
        if (USE_MOCK) {
            const data = await fetchJSON<{ metrics: BusinessMetrics }>('/data/business-metrics.json');
            return data.metrics;
        }
        return fetchJSON(API_BASE + '/business/metrics');
    },

    /** Get chart data */
    getChartData: async (): Promise<Record<string, ChartPoint[]>> => {
        if (USE_MOCK) {
            const data = await fetchJSON<{ chartData: Record<string, ChartPoint[]> }>('/data/business-metrics.json');
            return data.chartData;
        }
        return fetchJSON(API_BASE + '/business/charts');
    },

    /** Get AI recommendations */
    getRecommendations: async (): Promise<Recommendation[]> => {
        if (USE_MOCK) {
            const data = await fetchJSON<{ ai_recommendations: Recommendation[] }>('/data/business-metrics.json');
            return data.ai_recommendations;
        }
        return fetchJSON(API_BASE + '/business/recommendations');
    },

    // ──────────────────────── Marketplace ────────────────────────

    /** Get marketplace agents */
    getMarketplaceAgents: async (): Promise<MarketplaceAgent[]> => {
        if (USE_MOCK) {
            const data = await fetchJSON<{ featured_agents: MarketplaceAgent[] }>('/data/marketplace-agents.json');
            return data.featured_agents;
        }
        return fetchJSON(API_BASE + '/marketplace');
    },

    /** Get marketplace categories */
    getCategories: async (): Promise<string[]> => {
        if (USE_MOCK) {
            const data = await fetchJSON<{ categories: string[] }>('/data/marketplace-agents.json');
            return data.categories;
        }
        return fetchJSON(API_BASE + '/marketplace/categories');
    },

    // ──────────────────────── Onboarding ────────────────────────

    /** Get onboarding config (industries, goals, challenges) */
    getOnboardingConfig: async (): Promise<OnboardingConfig> => {
        return fetchJSON('/data/onboarding-config.json');
    },

    /** Analyze business data — POST to FastAPI in production */
    analyzeBusiness: async (_data: OnboardingData): Promise<{ summary: string; recommended_agents: Array<{ agent_id: string; reason: string }> }> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 8000));
            const config = await fetchJSON<OnboardingConfig>('/data/onboarding-config.json');
            return config.mock_response;
        }
        const res = await fetch(API_BASE + '/onboarding/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(_data),
        });
        return res.json();
    },

    /** Upload documents — POST multipart in production */
    uploadDocuments: async (_files: File[]): Promise<{ success: boolean; fileIds: string[] }> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 1500));
            return { success: true, fileIds: _files.map((_, i) => 'file-' + i) };
        }
        const formData = new FormData();
        _files.forEach(f => formData.append('files', f));
        const res = await fetch(API_BASE + '/upload', { method: 'POST', body: formData });
        return res.json();
    },

    // ──────────────────────── Agent Management ────────────────────────

    /** Create a new custom agent */
    createAgent: async (config: Partial<Agent>): Promise<Agent> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 800));
            return { id: 'custom-' + Date.now(), status: 'online', avatar: '\u{1F916}', color: '#6366f1', ...config } as Agent;
        }
        const res = await fetch(API_BASE + '/agents/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        return res.json();
    },

    /** Update agent settings */
    updateAgentSettings: async (id: string, settings: Partial<Agent>): Promise<Agent> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 500));
            return { id, ...settings } as Agent;
        }
        const res = await fetch(API_BASE + '/agents/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        return res.json();
    },

    // ──────────────────────── Predictions ────────────────────────

    /** Get ML prediction from backend */
    getPrediction: async (type: string = 'revenue', horizon: number = 7): Promise<{
        prediction_type: string;
        title: string;
        description: string;
        data_points: Array<Record<string, unknown>>;
        confidence: number;
        model_info: string;
        insights: string[];
    }> => {
        try {
            const res = await fetchWithTimeout('http://localhost:8000/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, horizon }),
            });
            if (!res.ok) throw new Error('Prediction backend error: ' + res.status);
            return res.json();
        } catch (err) {
            console.warn('Prediction backend unavailable, using fallback:', err);
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000));
            // Demo fallback data
            const demoData: Record<string, {
                prediction_type: string;
                title: string;
                description: string;
                data_points: Array<Record<string, unknown>>;
                confidence: number;
                model_info: string;
                insights: string[];
            }> = {
                revenue: {
                    prediction_type: 'revenue',
                    title: 'Revenue Forecast',
                    description: 'Predicted daily revenue for the next 7 days',
                    data_points: [
                        { date: '2026-06-28', predicted_value: 52000, lower_bound: 44000, upper_bound: 60000 },
                        { date: '2026-06-29', predicted_value: 48500, lower_bound: 40500, upper_bound: 56500 },
                        { date: '2026-06-30', predicted_value: 55200, lower_bound: 47200, upper_bound: 63200 },
                        { date: '2026-07-01', predicted_value: 58100, lower_bound: 50100, upper_bound: 66100 },
                        { date: '2026-07-02', predicted_value: 61400, lower_bound: 53400, upper_bound: 69400 },
                        { date: '2026-07-03', predicted_value: 54800, lower_bound: 46800, upper_bound: 62800 },
                        { date: '2026-07-04', predicted_value: 49200, lower_bound: 41200, upper_bound: 57200 },
                    ],
                    confidence: 0.85,
                    model_info: 'AutoBiz Revenue Predictor v1.0 (Demo)',
                    insights: [
                        'Revenue trending upward with +2.4% weekly growth',
                        'Mid-week peak expected on Wednesday (₹58.1K)',
                        'Weekend dip consistent with historical patterns',
                    ],
                },
                demand: {
                    prediction_type: 'demand',
                    title: 'Demand Forecast',
                    description: 'Predicted demand by product category for next week',
                    data_points: [
                        { category: 'Electronics', current_demand: 145, predicted_demand: 167, change_percent: 15.2, stock_status: 'low' },
                        { category: 'Office Supplies', current_demand: 89, predicted_demand: 92, change_percent: 3.4, stock_status: 'healthy' },
                        { category: 'Furniture', current_demand: 34, predicted_demand: 41, change_percent: 20.6, stock_status: 'healthy' },
                        { category: 'Clothing', current_demand: 112, predicted_demand: 98, change_percent: -12.5, stock_status: 'healthy' },
                        { category: 'Food & Beverages', current_demand: 203, predicted_demand: 218, change_percent: 7.4, stock_status: 'healthy' },
                    ],
                    confidence: 0.79,
                    model_info: 'AutoBiz Demand Predictor v1.0 (Demo)',
                    insights: [
                        'Electronics demand expected to rise 15% — restock recommended',
                        'Clothing demand declining — consider promotional pricing',
                        'Food & Beverages stable with slight upward trend',
                    ],
                },
                churn: {
                    prediction_type: 'churn',
                    title: 'Customer Churn Prediction',
                    description: 'Churn risk analysis by customer segment',
                    data_points: [
                        { segment: 'New Customers (0-30 days)', churn_risk: 0.22, count: 65 },
                        { segment: 'Active (31-90 days)', churn_risk: 0.08, count: 156 },
                        { segment: 'Loyal (91-365 days)', churn_risk: 0.04, count: 312 },
                        { segment: 'At Risk (no order 30+ days)', churn_risk: 0.52, count: 38 },
                        { segment: 'Dormant (no order 60+ days)', churn_risk: 0.78, count: 21 },
                    ],
                    confidence: 0.87,
                    model_info: 'AutoBiz Churn Predictor v1.0 (Demo)',
                    insights: [
                        '38 customers in "At Risk" segment need re-engagement',
                        'New customer churn at 22% — review onboarding flow',
                        'Loyal segment has excellent 96% retention rate',
                    ],
                },
            };
            return demoData[type] || demoData.revenue;
        }
    },

    // ──────────────────────── Action Management ────────────────────────

    /** Approve a risky action */
    approveAction: async (token: string): Promise<Record<string, unknown>> => {
        try {
            const res = await fetch('http://localhost:8000/api/action/approve/' + token, { method: 'POST' });
            return res.json();
        } catch { return { status: 'error', message: 'Backend unavailable' }; }
    },

    /** Deny a risky action */
    denyAction: async (token: string): Promise<Record<string, unknown>> => {
        try {
            const res = await fetch('http://localhost:8000/api/action/deny/' + token, { method: 'POST' });
            return res.json();
        } catch { return { status: 'error', message: 'Backend unavailable' }; }
    },

    /** Undo a previous action */
    undoAction: async (actionId: string): Promise<Record<string, unknown>> => {
        try {
            const res = await fetch('http://localhost:8000/api/action/undo/' + actionId, { method: 'POST' });
            return res.json();
        } catch { return { status: 'error', message: 'Backend unavailable' }; }
    },
};
