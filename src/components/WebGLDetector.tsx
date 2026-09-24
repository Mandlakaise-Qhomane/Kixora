import { useState } from 'react';

function detectWebGLSupport(): boolean {
    if (typeof document === 'undefined') return false;

    try {
        const canvas = document.createElement('canvas');
        return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
        return false;
    }
}

export default function WebGLDetector() {
    // Lazy state initializer: detection runs once during the first render, so no
    // setState() call inside an effect is needed (react-hooks/set-state-in-effect).
    const [ok] = useState(detectWebGLSupport);
    return ok;
}
