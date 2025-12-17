import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import ChillButton from './ChillButton';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-surface p-4">
                    <div className="glass-panel p-8 max-w-md text-center border-red-500/20">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-text mb-2">Vibe Check Failed</h1>
                        <p className="text-slate-500 mb-6">Something went wrong. It's not you, it's us.</p>

                        <div className="bg-red-950/30 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32">
                            <code className="text-xs text-red-400 font-mono">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>

                        <ChillButton onClick={this.handleReset} className="w-full justify-center">
                            <RefreshCcw className="w-4 h-4" /> Restart App
                        </ChillButton>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
