import type { Provinsi } from "./provinsi";

export interface Kabupaten {
    id: number
    name: string
    province: Provinsi
}