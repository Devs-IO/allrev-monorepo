export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
