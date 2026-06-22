export const generateSlug = (value: string): string =>
    value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const shouldAutoSyncSlug = (
    currentSlug: string,
    previousTitle: string,
): boolean => currentSlug === '' || currentSlug === generateSlug(previousTitle);
