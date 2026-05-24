export type CustomerSession = {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    [key: string]: unknown;
};
