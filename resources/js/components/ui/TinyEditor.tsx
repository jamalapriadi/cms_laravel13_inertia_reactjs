import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils"

declare global {
    interface Window {
        tinymce: any;
    }
}

interface Props {
    value: string;
    onChange: (content: string) => void;
    height?: number;
}

export default function TinyEditor({ value, onChange, height = 400 }: Props) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!window.tinymce) return;

        window.tinymce.init({
            target: textareaRef.current,
            height,
            license_key: 'gpl',
            menubar: false,
            plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code", 
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
            ],
            toolbar:
                "undo redo | formatselect | bold italic backcolor | \
                alignleft aligncenter alignright alignjustify | \
                bullist numlist outdent indent | removeformat | image | code",

            content_style:
                "body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }",

            setup: (editor: any) => {
                editor.on("init", () => {
                    editor.setContent(value || "");
                });

                editor.on("change keyup", () => {
                    onChange(editor.getContent());
                });
            },

            images_upload_handler: async (blobInfo: any) => {
                const formData = new FormData();
                formData.append("file", blobInfo.blob());

                const response = await fetch("/dashboard/media/upload", {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN":
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                    },
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error("Upload failed");
                }

                return result.location;
            },
        });

        return () => {
            window.tinymce.remove();
        };
    }, []);

    useEffect(() => {
        if (!window.tinymce) return;

        const editor = window.tinymce.get(textareaRef.current);
        if (editor && editor.getContent() !== value) {
            editor.setContent(value || "");
        }
    }, [value]);

    return <textarea className={cn(
            "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            
          )} ref={textareaRef} />;
}