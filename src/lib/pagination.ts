// Pagination utilities for backend API responses
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  cursor: {
    next?: string;
    hasMore: boolean;
  };
}

/**
 * Calculate offset and limit for pagination
 */
export const getPaginationParams = (
  page: number = 1,
  limit: number = 10
) => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.min(Math.max(1, limit), 100); // Max 100 per page
  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

/**
 * Format pagination response
 */
export const formatPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
};

/**
 * Encode cursor (use base64)
 */
export const encodeCursor = (id: string, timestamp: number): string => {
  return Buffer.from(`${id}:${timestamp}`).toString('base64');
};

/**
 * Decode cursor
 */
export const decodeCursor = (cursor: string): { id: string; timestamp: number } => {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [id, timestamp] = decoded.split(':');
    return {
      id,
      timestamp: parseInt(timestamp),
    };
  } catch {
    throw new Error('Invalid cursor');
  }
};
