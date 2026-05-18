export interface Media {
    id: string;
    user_id?: string | null;

    model_type?: string | null;
    model_id?: string | null;

    uuid?: string | null;

    collection_name?: string | null;
    name?: string | null;
    file_name: string;
    mime_type: string;

    width?: number | null;
    height?: number | null;
    orientation?: string | null;

    path: string;
    disk: string;
    size?: number | null;

    alt?: string | null;

    custom_properties?: Record<string, any> | null;

    created_at: string;
    updated_at: string;

    // Accessor dari model
    url?: string;
}

export interface MediaUploadProps {
    multiple?: boolean;
    collection?: string;
    modelType?: string;
    modelId?: string;
    onUploaded?: (media: Media | Media[]) => void;
}
