export interface LaravelPagination<T>{
    data:T[],
    links:{
        url: string | null
        label: string
        active: boolean
    }[]
    meta:{
        current_page: number 
        from: number | null 
        last_page: number 
        path: string 
        per_page: number 
        to: number | null 
        total: number
    }
}