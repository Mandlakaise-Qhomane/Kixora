import { useEffect, useState } from 'react';
export default function WebGLDetector() {
    const [ok, setOk] = useState(false);
    useEffect(() => {
        try {
            const c = document.createElement('canvas');
            const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
            setOk(!!gl);
        } catch { setOk(false); }
    }, []);
    return ok;
}