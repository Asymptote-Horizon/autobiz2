import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const examples = [
    "I run a small grocery store in Pune with 3 employees. We sell daily essentials and have about 200 regular customers. Our biggest challenge is managing inventory and keeping track of expenses manually.",
    "I own a beauty parlour in Mumbai. We have 5 staff members and around 50-60 appointments per week. I want to automate appointment booking and send reminders to customers.",
    "We are a mid-sized textile manufacturing unit in Surat. We export to 5 countries and have 120 employees. Looking to streamline our order management and financial reporting.",
];

export default function FreeTextOnboarding() {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [showExamples, setShowExamples] = useState(false);

    const handleContinue = () => {
        sessionStorage.setItem('onboardingData', JSON.stringify({ freeText: text }));
        navigate('/onboarding/upload');
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 flex items-center gap-3">
                <button onClick={() => navigate('/welcome')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400">Describe Your Business</span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                <div className="w-full max-w-lg animate-fade-in space-y-6">
                    <div>
                        <h2 className="text-2xl font-heading font-bold mb-2">Tell us about your business</h2>
                        <p className="text-gray-400">
                            Describe what you do, your challenges, and what you'd like to automate. The more detail, the better.
                        </p>
                    </div>

                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="E.g., I run a small electronics shop in Delhi with 5 employees. We sell mobile phones and accessories. I want to better manage my inventory, track sales, and handle customer complaints efficiently..."
                            rows={8}
                            className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-600">
                            {text.length} / 2000
                        </div>
                    </div>

                    {/* Examples */}
                    <button
                        onClick={() => setShowExamples(!showExamples)}
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Not sure what to write? See examples
                        {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showExamples && (
                        <div className="space-y-3 animate-fade-in">
                            {examples.map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => setText(ex)}
                                    className="block w-full text-left p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-gray-400 hover:bg-white/[0.06] hover:text-gray-300 transition-all"
                                >
                                    "{ex}"
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action */}
            <div className="px-6 pb-8">
                <button
                    onClick={handleContinue}
                    disabled={text.trim().length < 20}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed hover:shadow-2xl transition-all duration-300"
                >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
