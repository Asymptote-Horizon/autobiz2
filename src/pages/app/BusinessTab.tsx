import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, IndianRupee, Users, ShoppingCart, ArrowUpRight,
    AlertTriangle, Lightbulb, ArrowRight, Brain, X, Sparkles, BarChart3, UserX,
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { api } from '../../services/api';
import type { BusinessMetrics, ChartPoint, Recommendation } from '../../types';

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let start = 0;
        const end = value;
        const duration = 1500;
        const stepTime = 16;
        const steps = duration / stepTime;
        const increment = end / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                start = end;
                clearInterval(timer);
            }
            setDisplayValue(Math.floor(start));
        }, stepTime);
        return () => clearInterval(timer);
    }, [value]);

    const formatted = displayValue >= 100000
        ? `${(displayValue / 100000).toFixed(1)}L`
        : displayValue >= 1000
            ? `${(displayValue / 1000).toFixed(1)}K`
            : displayValue.toString();

    return (
        <span ref={ref} className="tabular-nums">
            {prefix}{formatted}{suffix}
        </span>
    );
}

function MetricCard({ title, value, change, prefix, suffix, icon: Icon, color }: {
    title: string; value: number; change: number; prefix?: string; suffix?: string;
    icon: React.ElementType; color: string;
}) {
    const isPositive = change >= 0;
    return (
        <div className="metric-card group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change)}%
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
        </div>
    );
}

const priorityStyles: Record<string, string> = {
    high: 'border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20',
    medium: 'border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20',
    low: 'border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-950/20',
};

const priorityIcons: Record<string, React.ElementType> = {
    high: AlertTriangle,
    medium: Lightbulb,
    low: Lightbulb,
};

export default function BusinessTab() {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
    const [chartData, setChartData] = useState<Record<string, ChartPoint[]>>({});
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Prediction state
    const [showPrediction, setShowPrediction] = useState(false);
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [predictionType, setPredictionType] = useState<string>('revenue');
    const [predictionResult, setPredictionResult] = useState<{
        prediction_type: string;
        title: string;
        description: string;
        data_points: Array<Record<string, unknown>>;
        confidence: number;
        model_info: string;
        insights: string[];
    } | null>(null);

    useEffect(() => {
        Promise.all([api.getMetrics(), api.getChartData(), api.getRecommendations()]).then(
            ([m, c, r]) => { setMetrics(m); setChartData(c); setRecommendations(r); setTimeout(() => setLoaded(true), 100); }
        );
    }, []);

    const handleRunPrediction = async (type: string) => {
        setPredictionType(type);
        setPredictionLoading(true);
        setPredictionResult(null);
        setShowPrediction(true);
        try {
            const result = await api.getPrediction(type, 7);
            setPredictionResult(result);
        } catch (err) {
            console.error('Prediction failed:', err);
        } finally {
            setPredictionLoading(false);
        }
    };

    if (!metrics) {
        return (
            <div className="h-full overflow-y-auto p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="metric-card"><div className="skeleton h-4 w-24 mb-4" /><div className="skeleton h-8 w-32 mb-2" /><div className="skeleton h-3 w-20" /></div>
                    ))}
                </div>
            </div>
        );
    }

    const predictionTypeOptions = [
        { id: 'revenue', label: 'Revenue Forecast', icon: TrendingUp, color: '#3b82f6', desc: '7-day revenue prediction' },
        { id: 'demand', label: 'Demand Forecast', icon: BarChart3, color: '#8b5cf6', desc: 'Category demand analysis' },
        { id: 'churn', label: 'Churn Prediction', icon: UserX, color: '#ef4444', desc: 'Customer churn risk' },
    ];

    return (
        <div className="h-full overflow-y-auto scrollbar-thin">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className={`mb-8 transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Business Overview</h1>
                            <p className="text-sm text-gray-500 mt-1">Your business at a glance</p>
                        </div>
                        <button
                            onClick={() => setShowPrediction(!showPrediction)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                        >
                            <Brain className="w-4 h-4" />
                            AI Predictions
                            <Sparkles className="w-3.5 h-3.5 opacity-70" />
                        </button>
                    </div>
                </div>

                {/* ── Prediction Panel ── */}
                {showPrediction && (
                    <div className={`mb-8 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 rounded-2xl border border-violet-200 dark:border-violet-800/40 overflow-hidden transition-all duration-500 animate-slide-up`}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                        <Brain className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Prediction Engine</h3>
                                        <p className="text-xs text-gray-500">Powered by AutoBiz ML Pipeline</p>
                                    </div>
                                </div>
                                <button onClick={() => { setShowPrediction(false); setPredictionResult(null); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Prediction Type Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                                {predictionTypeOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleRunPrediction(opt.id)}
                                        disabled={predictionLoading}
                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                            predictionType === opt.id && predictionResult
                                                ? 'border-violet-400 dark:border-violet-500 bg-white dark:bg-gray-800 shadow-md'
                                                : 'border-transparent bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 hover:border-violet-200 dark:hover:border-violet-700'
                                        } disabled:opacity-50`}
                                    >
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${opt.color}15` }}>
                                            <opt.icon className="w-5 h-5" style={{ color: opt.color }} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{opt.label}</div>
                                            <div className="text-xs text-gray-500">{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Loading State */}
                            {predictionLoading && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="relative mb-4">
                                        <div className="w-16 h-16 rounded-full border-4 border-violet-200 dark:border-violet-800 border-t-violet-500 animate-spin" />
                                        <Brain className="w-6 h-6 text-violet-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzing business data...</p>
                                    <p className="text-xs text-gray-500 mt-1">Running prediction model</p>
                                </div>
                            )}

                            {/* Prediction Results */}
                            {predictionResult && !predictionLoading && (
                                <div className="space-y-5 animate-fade-in">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{predictionResult.title}</h4>
                                            <p className="text-xs text-gray-500">{predictionResult.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 mb-1">Confidence</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{
                                                            width: `${predictionResult.confidence * 100}%`,
                                                            backgroundColor: predictionResult.confidence > 0.8 ? '#10b981' : predictionResult.confidence > 0.6 ? '#f59e0b' : '#ef4444',
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold" style={{
                                                    color: predictionResult.confidence > 0.8 ? '#10b981' : predictionResult.confidence > 0.6 ? '#f59e0b' : '#ef4444',
                                                }}>{Math.round(predictionResult.confidence * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-gray-800/80">
                                                        {predictionResult.data_points.length > 0 &&
                                                            Object.keys(predictionResult.data_points[0]).map(key => (
                                                                <th key={key} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                                    {key.replace(/_/g, ' ')}
                                                                </th>
                                                            ))
                                                        }
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {predictionResult.data_points.map((row, i) => (
                                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                            {Object.values(row).map((val, j) => (
                                                                <td key={j} className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                                                                    {typeof val === 'number'
                                                                        ? val < 1 ? `${(val as number * 100).toFixed(0)}%`
                                                                        : val > 1000 ? `₹${(val as number).toLocaleString('en-IN')}`
                                                                        : String(val)
                                                                        : String(val)
                                                                    }
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Insights */}
                                    <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Lightbulb className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Key Insights</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {predictionResult.insights.map((insight, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="text-amber-500 mt-0.5">•</span>
                                                    {insight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Model Info */}
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>Model: {predictionResult.model_info}</span>
                                        <span>Generated just now</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Metric Cards */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-all duration-500 delay-100 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <MetricCard title="Revenue" value={metrics.revenue.current} change={metrics.revenue.change} prefix="₹" icon={IndianRupee} color="#3b82f6" />
                    <MetricCard title="Customers" value={metrics.customers.current} change={metrics.customers.change} icon={Users} color="#8b5cf6" />
                    <MetricCard title="Completed Orders" value={metrics.orders.completed} change={12.4} icon={ShoppingCart} color="#10b981" />
                    <MetricCard title="Growth Rate" value={metrics.growth.current} change={metrics.growth.change} suffix="%" icon={ArrowUpRight} color="#f59e0b" />
                </div>

                {/* Charts Grid */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 transition-all duration-500 delay-200 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {/* Revenue Line Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData.revenue || []}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `₹${v / 1000}K`} />
                                <Tooltip formatter={(value: unknown) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']} />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Sales Bar Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Sales by Category</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData.sales_by_category || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                                <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `₹${v / 1000}K`} />
                                <Tooltip formatter={(value: unknown) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']} />
                                <Bar dataKey="sales" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Customer Segments Pie */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Customer Segments</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={chartData.customer_segments || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {(chartData.customer_segments || []).map((entry, i) => (
                                        <Cell key={i} fill={entry.color || '#6366f1'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-3 justify-center mt-2">
                            {(chartData.customer_segments || []).map((seg) => (
                                <div key={seg.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                                    {seg.name}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Traffic Area Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Weekly Traffic & Conversions</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData.daily_traffic || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb40" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <Tooltip />
                                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Visitors" />
                                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Conversions" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className={`transition-all duration-500 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-white">AI Recommendations</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recommendations.map((rec, i) => {
                            const PriorityIcon = priorityIcons[rec.priority] || Lightbulb;
                            return (
                                <div key={i} className={`rounded-2xl border p-5 ${priorityStyles[rec.priority]} transition-all duration-300 card-hover`}>
                                    <div className="flex items-start gap-3 mb-3">
                                        <PriorityIcon className={`w-5 h-5 flex-shrink-0 ${rec.priority === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{rec.description}</p>
                                    <button
                                        onClick={() => navigate(`/app/agents?agent=${rec.agent_id}`)}
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                                    >
                                        {rec.action_text || 'Take Action'}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
