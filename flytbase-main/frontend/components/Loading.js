'use client';

export default function LoadingSpinner({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`${sizes[size]} animate-spin rounded-full border-primary-500 border-t-transparent shadow-[0_0_10px_theme('colors.primary.900')]`}></div>
        </div>
    );
}

export function LoadingPage({ message = 'SYNCHRONIZING WITH COMMAND CENTER...' }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full space-y-4">
            <div className="relative">
                <LoadingSpinner size="lg" />
                <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
            </div>
            <div className="text-primary-400 font-mono text-sm tracking-[0.2em] animate-pulse uppercase">
                {message}
            </div>
        </div>
    );
}

export function ButtonLoader({ size = 'sm' }) {
    return (
        <div className="flex items-center gap-2">
            <LoadingSpinner size={size} className="mr-2" />
            <span>PROCESSING...</span>
        </div>
    );
}
