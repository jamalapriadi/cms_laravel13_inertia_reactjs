import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';

export const editorExtensions = [
    StarterKit.configure({
        heading: {
            levels: [1, 2, 3],
        },
    }),
    Image,
    Link.configure({
        openOnClick: false,
    }),
    Underline,
];
