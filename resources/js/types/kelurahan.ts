export interface Kelurahan {
    id: string
    name: string
    kecamatan: {
        name: string
        kabupaten: {
            name: string
            province: {
                name: string
            }
        }
    }
}