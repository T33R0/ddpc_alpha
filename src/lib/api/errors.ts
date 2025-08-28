import { NextResponse } from "next/server";

/**
 * Standardized error codes for consistent API responses
 */
export const ErrorCodes = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  BAD_REQUEST: 400,
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Standardized API error response structure
 */
export interface ApiError {
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: ErrorCode,
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse<ApiError> {
  const error: ApiError = {
    error: message,
    code,
    ...(details && { details }),
    ...(requestId && { requestId }),
  };

  return NextResponse.json(error, { status: code });
}

/**
 * Convenience functions for common error responses
 */
export const errors = {
  unauthorized: (message = "Unauthorized", details?: Record<string, unknown>) =>
    createErrorResponse(message, ErrorCodes.UNAUTHORIZED, details),

  forbidden: (message = "Forbidden", details?: Record<string, unknown>) =>
    createErrorResponse(message, ErrorCodes.FORBIDDEN, details),

  notFound: (message = "Not found", details?: Record<string, unknown>) =>
    createErrorResponse(message, ErrorCodes.NOT_FOUND, details),

  validation: (message = "Validation error", details?: Record<string, unknown>) =>
    createErrorResponse(message, ErrorCodes.VALIDATION_ERROR, details),

  conflict: (message = "Conflict", details?: Record<string, unknown>) =>
    createErrorResponse(message, ErrorCodes.CONFLICT, details),

  internal: (message = "Internal server error", details?: Record<string, unknown>) =>
    createErrorResponse(message, ErrorCodes.INTERNAL_ERROR, details),

  badRequest: (message = "Bad request", details?: Record<string, unknown>) =>
    createErrorResponse(message, ErrorCodes.BAD_REQUEST, details),
};

/**
 * Creates a success response with consistent structure
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  status: number = 200
): NextResponse<{ ok: true; data: T }> {
  return NextResponse.json({ ok: true, data }, { status });
}

/**
 * Creates a simple success response
 */
export function createSimpleSuccess(status: number = 200): NextResponse<{ ok: true }> {
  return NextResponse.json({ ok: true }, { status });
}
