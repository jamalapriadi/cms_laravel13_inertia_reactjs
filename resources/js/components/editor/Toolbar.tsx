import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';

export default function Toolbar({ editor }: { editor: Editor | null }) {
    if (!editor) {
        return null;
    }

    const btn = (active: boolean) => (active ? 'default' : 'outline');

    return (
        <div className="flex flex-wrap items-center gap-2 border-b pb-3">
            {/* TEXT STYLE */}
            <Button
                size="sm"
                variant={btn(editor.isActive('bold'))}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                B
            </Button>

            <Button
                size="sm"
                variant={btn(editor.isActive('italic'))}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                I
            </Button>

            <Button
                size="sm"
                variant={btn(editor.isActive('strike'))}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            >
                S
            </Button>

            <Button
                size="sm"
                variant={btn(editor.isActive('underline'))}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
                U
            </Button>

            {/* SEPARATOR */}
            <div className="mx-2 h-6 w-px bg-border" />

            {/* HEADINGS */}
            {[1, 2, 3].map((level) => (
                <Button
                    key={level}
                    size="sm"
                    variant={btn(editor.isActive('heading', { level }))}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level }).run()
                    }
                >
                    H{level}
                </Button>
            ))}

            {/* SEPARATOR */}
            <div className="mx-2 h-6 w-px bg-border" />

            {/* LIST */}
            <Button
                size="sm"
                variant={btn(editor.isActive('bulletList'))}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
                • List
            </Button>

            <Button
                size="sm"
                variant={btn(editor.isActive('orderedList'))}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
                1. List
            </Button>

            {/* SEPARATOR */}
            <div className="mx-2 h-6 w-px bg-border" />

            {/* BLOCK */}
            <Button
                size="sm"
                variant={btn(editor.isActive('blockquote'))}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
                ❝ Quote
            </Button>

            <Button
                size="sm"
                variant={btn(editor.isActive('codeBlock'))}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
                {'</>'}
            </Button>

            <Button
                size="sm"
                variant={btn(editor.isActive('code'))}
                onClick={() => editor.chain().focus().toggleCode().run()}
            >
                Code
            </Button>

            {/* SEPARATOR */}
            <div className="mx-2 h-6 w-px bg-border" />

            {/* LINK */}
            <Button
                size="sm"
                onClick={() => {
                    const url = prompt('Enter URL');
                    if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                    }
                }}
            >
                🔗 Link
            </Button>

            <Button
                size="sm"
                onClick={() => editor.chain().focus().unsetLink().run()}
            >
                ❌ Link
            </Button>

            {/* SEPARATOR */}
            <div className="mx-2 h-6 w-px bg-border" />

            {/* HISTORY */}
            <Button
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
            >
                ↺
            </Button>

            <Button
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
            >
                ↻
            </Button>
        </div>
    );
}
