'use client';

import dynamic from 'next/dynamic';

const LiveMissionMap = dynamic(() => import('./LiveMissionMap'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-slate-900/50 text-secondary-400 font-mono text-xs tracking-widest">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-secondary-500/30 border-t-secondary-500 rounded-full animate-spin"></div>
                ESTABLISHING SATELLITE LINK...
            </div>
        </div>
    ),
});

export default function LiveMissionMapWrapper(props) {
    return <LiveMissionMap {...props} />;
}
