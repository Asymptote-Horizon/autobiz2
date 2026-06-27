import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';

const messages = [
    'Analyzing your business data...',
    'Identifying key opportunities...',
    'Crafting your personalized strategy...',
    'Selecting the best AI agents for you...',
    'Almost there...',
];

export default function AnalyzingScreen() {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 1;
            });
        }, 100);

        const msgInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2500);

        const timeout = setTimeout(() => {
            navigate('/onboarding/results');
        }, 10500);

        return () => {
            clearInterval(progressInterval);
            clearInterval(msgInterval);
            clearTimeout(timeout);
        };
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-md animate-fade-in">
                {/* Animated Logo */}
                <div className="relative mb-10">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse-soft">
                        <Bot className="w-12 h-12 text-white" />
                    </div>
                    {/* Orbiting dots */}
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="absolute w-3 h-3 rounded-full bg-blue-400"
                            style={{
                                top: '50%',
                                left: '50%',
                                animation: `orbit 3s linear ${i * 1}s infinite`,
                                transformOrigin: '0 0',
                            }}
                        />
                    ))}
                    <style>{`
            @keyframes orbit {
              0% { transform: rotate(0deg) translateX(60px) rotate(0deg); opacity: 0.6; }
              50% { opacity: 1; }
              100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); opacity: 0.6; }
            }
          `}</style>
                </div>

                {/* Message */}
                <div className="h-8 mb-8">
                    <p
                        key={messageIndex}
                        className="text-lg text-gray-300 font-medium animate-fade-in"
                    >
                        {messages[messageIndex]}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xs mx-auto">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{progress}%</p>
                </div>
            </div>
        </div>
    );
}
