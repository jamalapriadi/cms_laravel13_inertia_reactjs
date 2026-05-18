'use client';

import { useEffect, useState } from 'react';

// modes
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-php';

// themes
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

// core
import 'ace-builds/src-noconflict/ace';

interface Props {
    value: string;
    onChange: (value: string) => void;
    mode?: string;
    theme?: string;
    height?: string;
}

export default function AceEditorWrapper({
    value,
    onChange,
    mode = 'html',
    theme = 'github',
    height = '400px',
}: Props) {
    const [Editor, setEditor] = useState<any>(null);

    useEffect(() => {
        // 🔥 dynamic import (fix Vite issue)
        import('react-ace').then((mod) => {
            setEditor(() => mod.default || mod);
        });
    }, []);

    if (!Editor) return null;

    return (
        <div className="rounded-xl border shadow-sm">
            <Editor
                mode={mode}
                theme={theme}
                value={value}
                onChange={onChange}
                width="100%"
                height={height}
                fontSize={14}
                setOptions={{
                    useWorker: false,
                    showLineNumbers: true,
                    tabSize: 2,
                }}
                editorProps={{
                    $blockScrolling: true,
                }}
            />
        </div>
    );
}