import { usePage } from '@inertiajs/react';

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|gif|webp|svg)(?:[?#].*)?$/i;

export function mediaUrl(path?: string | null, base?: string | null): string | null {
    if (!path) {
        return null;
    }

    if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('data:') ||
        path.startsWith('blob:')
    ) {
        return path;
    }

    const mediaBase = (
        base ||
        import.meta.env.VITE_MEDIA_URL ||
        '/storage'
    ).replace(/\/+$/, '');
    let value = path;

    const normalizedPath = value
        .replace(/^\/?storage\//, '')
        .replace(/^\/+/, '');

    if (!normalizedPath) {
        return null;
    }

    return `${mediaBase}/${normalizedPath}`;
}

export function isImagePath(value?: string | null): boolean {
    if (!value) {
        return false;
    }

    try {
        return IMAGE_EXTENSION_PATTERN.test(new URL(value).pathname);
    } catch {
        return IMAGE_EXTENSION_PATTERN.test(value);
    }
}

export function isImageMimeType(mimeType?: string | null): boolean {
    return typeof mimeType === 'string' && mimeType.startsWith('image/');
}

export function isImageMedia(item: {
    name?: string | null;
    path?: string | null;
    url?: string | null;
    mime_type?: string | null;
}): boolean {
    return (
        isImageMimeType(item.mime_type) ||
        isImagePath(item.path) ||
        isImagePath(item.url) ||
        isImagePath(item.name)
    );
}

export function useMediaUrl(path?: string | null): string | null {
    const mediaUrlBase = (usePage().props as { mediaUrlBase?: string }).mediaUrlBase;

    return mediaUrl(path, mediaUrlBase);
}
