export interface Template {
    id: string;
    name: string | null;
    description: string | null;
    template_preview: string | null;
    path_template: string | null;
    default: 'Y' | 'N';
    custom_template: 'Y' | 'N';
    created_at: string;
    updated_at: string;
}
