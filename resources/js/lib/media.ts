import { usePage } from '@inertiajs/react';

export function mediaUrl(path?: string | null, base?: string | null): string | null {
    if (!path) {
        return null;
    }

    const mediaBase = (base || '/storage').replace(/\/+$/, '');
    let value = path;

    if (path.startsWith('http://') || path.startsWith('https://')) {
        try {
            const parsed = new URL(path);

            if (!parsed.pathname.startsWith('/storage/')) {
                return path;
            }

            value = parsed.pathname;
        } catch {
            return path;
        }
    }

    const normalizedPath = value
        .replace(/^\/?storage\//, '')
        .replace(/^\/+/, '');

    if (!normalizedPath) {
        return null;
    }

    return `${mediaBase}/${normalizedPath}`;
}

export function useMediaUrl(path?: string | null): string | null {
    const mediaUrlBase = (usePage().props as { mediaUrlBase?: string }).mediaUrlBase;

    return mediaUrl(path, mediaUrlBase);
}
