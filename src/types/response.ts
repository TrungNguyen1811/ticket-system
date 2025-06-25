export interface Pagination {
  total: number;
  page: number;
  perPage: number;
}

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DataResponse<T> {
  data: T;
  pagination?: Pagination;
}

export interface CallbackResponse {
  success: boolean;
  message: string;
  error: string;
}
