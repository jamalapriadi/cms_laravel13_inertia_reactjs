import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            logo: string | null;
            auth: Auth;
            mediaUrlBase: string;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
