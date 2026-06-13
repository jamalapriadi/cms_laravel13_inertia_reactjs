import { useEditor, EditorContent } from '@tiptap/react';
import axios from 'axios';
import { editorExtensions } from './extensions';
import Toolbar from './Toolbar';

export default function Editor({
    value,
    onChange,
}: {
    value: string;
    onChange: (val: string) => void;
}) {
    const editor = useEditor({
        extensions: editorExtensions,
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    /**
     * ✅ IMAGE UPLOAD HANDLER (Laravel)
     */
    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await axios.post('/my-admin/dashboard/upload-image', formData);

        return res.data.url;
    };

    /**
     * ✅ HANDLE IMAGE INPUT
     */
    const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editor || !e.target.files?.length) {
            return;
        }

        const file = e.target.files[0];
        const url = await uploadImage(file);

        editor.chain().focus().setImage({ src: url }).run();
    };

    return (
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
            <Toolbar editor={editor} />

            <div className="py-4">
                <EditorContent
                    editor={editor}
                    className="prose prose-sm max-w-none focus:outline-none"
                />
            </div>

            {/* Upload */}
            <div className="border-t pt-3">
                <input type="file" onChange={handleImage} />
            </div>
        </div>
    );
}
