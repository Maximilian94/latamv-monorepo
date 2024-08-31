export interface ErrorResponse {
  message: string;
}

export function createErrorResponse(message: string): ErrorResponse {
  return { message };
}
