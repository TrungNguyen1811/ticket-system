export interface Pagination {
    total: number
    page: number
    perPage: number
}

export interface Response<T> {
  success: boolean
  message: string
  data: T
}

export interface DataResponse<T> {
    data: T
    pagination?: Pagination
}

// export interface PaginationMeta {
//   current_page: number
//   total_pages: number
//   total_items: number
//   items_per_page: number
// }

// export interface DataResponse<T> {
//   data: T
//   meta?: PaginationMeta
// }