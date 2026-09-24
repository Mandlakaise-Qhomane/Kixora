import { Suspense, lazy } from 'react';

const LazyViewer = lazy(() => import('./Sneaker3DScene'));

type Sneaker3DViewerProps = {
    modelUrl?: string;
};

export default function Sneaker3DViewer({ modelUrl }: Sneaker3DViewerProps) {
    return (
        <Suspense
            fallback={
                <div className="w-full h-64 bg-[#232323] animate-pulse rounded-lg" />
            }
        >
            <LazyViewer modelUrl={modelUrl} />
        </Suspense>
    );
}