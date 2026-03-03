// Backend pagination utilities
export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
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

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(
  page?: number | string,
  limit?: number | string
): { skip: number; take: number; page: number; limit: number } {
  const pageNum = Math.max(1, parseInt(String(page || 1), 10) || 1);
  const limitNum = Math.min(
    Math.max(1, parseInt(String(limit || 10), 10) || 10),
    100 // Max 100 items per page
  );

  const skip = (pageNum - 1) * limitNum;

  return {
    skip,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
}

/**
 * Format paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
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
}
