import type { Kabupaten } from './kabupaten';

export interface Kecamatan {
    id: number;
    name: string;
    kabupaten: Kabupaten;
}
