export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: Array<{ url: string | null; label: string; active: boolean }>;
}

export interface DynamicContentType {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    is_active: boolean;
    sort_order: number;
    entries_count?: number;
    field_groups_count?: number;
}

export interface DynamicFieldOption {
    label: string;
    value: string;
}

export interface DynamicFieldDefinition {
    id: string;
    custom_field_group_id: string;
    label: string;
    name: string;
    type: string;
    placeholder?: string | null;
    instructions?: string | null;
    options: DynamicFieldOption[];
    default_value?: unknown;
    validation_rules?: string[];
    is_required: boolean;
    is_active: boolean;
    sort_order: number;
    value?: unknown;
}

export interface DynamicFieldGroup {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    sort_order: number;
    fields: DynamicFieldDefinition[];
}

export interface DynamicContentEntry {
    id: string;
    content_type_id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    status: string;
    published_at?: string | null;
    sort_order: number;
    data: Record<string, unknown>;
    created_at?: string | null;
    updated_at?: string | null;
    creator?: {
        id: number | string;
        name: string;
    } | null;
    updater?: {
        id: number | string;
        name: string;
    } | null;
}

export interface DynamicContentFormData {
    title: string;
    slug: string;
    excerpt: string;
    status: string;
    published_at: string;
    sort_order: number;
    fields: Record<string, DynamicContentFieldFormValue>;
}

export type DynamicContentFieldFormValue =
    | string
    | number
    | boolean
    | null
    | string[]
    | number[]
    | boolean[];

export interface CustomFieldGroupSummary {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    target_type: string;
    target_id?: string | null;
    is_active: boolean;
    sort_order: number;
    fields_count: number;
    content_type?: DynamicContentType | null;
    fields?: DynamicFieldDefinition[];
}

export interface MediaLibraryItem {
    name: string;
    path: string;
    url: string;
    mime_type?: string | null;
    size?: number | null;
    last_modified?: string | null;
}
