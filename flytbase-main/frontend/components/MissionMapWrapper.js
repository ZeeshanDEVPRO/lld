'use client';

import dynamic from 'next/dynamic';

const MissionMap = dynamic(() => import('./MissionMap'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full flex items-center justify-center bg-slate-900/50 text-primary-400 font-mono text-xs tracking-widest">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                CALIBRATING TACTICAL GRID...
            </div>
        </div>
    ),
});

export default function MissionMapWrapper(props) {
    return <MissionMap {...props} />;
}
