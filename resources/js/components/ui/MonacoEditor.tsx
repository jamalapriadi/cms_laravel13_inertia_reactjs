'use client';

import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    height?: string;
}

export default function MonacoEditor({
    value,
    onChange,
    language = 'html',
    height = '400px',
}: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="rounded-xl border shadow-sm overflow-hidden">
            <Editor
                height={height}
                language={language}
                value={value}
                onChange={(val) => onChange(val || '')}
                theme="vs-light"
                options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                }}
            />
        </div>
    );
}