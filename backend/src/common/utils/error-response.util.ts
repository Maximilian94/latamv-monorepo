export interface ErrorResponse {
  message: string;
}

export function createErrorResponse(message: string): ErrorResponse {
  return { message };
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.message !== undefined;
}
