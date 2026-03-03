// Optimized React Query configuration with caching strategy
import { DefaultOptions } from '@tanstack/react-query';

export const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: How long until fresh data is stale (prevents unnecessary refetches)
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Garbage collection time: How long until unused cache is deleted
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Retry failed requests
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch behavior
    refetchOnWindowFocus: false, // Only refetch if stale
    refetchOnReconnect: false,
    refetchOnMount: false,
  },
  mutations: {
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

// Query key factory for type-safe and organized cache keys
export const queryKeys = {
  all: ['queries'] as const,
  
  users: {
    all: ['users'] as const,
    list: (page?: number, limit?: number) =>
      [...queryKeys.users.all, 'list', page, limit] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
  
  outpasses: {
    all: ['outpasses'] as const,
    list: (page?: number, limit?: number, status?: string) =>
      [...queryKeys.outpasses.all, 'list', page, limit, status] as const,
    detail: (id: string) => [...queryKeys.outpasses.all, 'detail', id] as const,
  },
  
  meetings: {
    all: ['meetings'] as const,
    list: (page?: number, limit?: number) =>
      [...queryKeys.meetings.all, 'list', page, limit] as const,
    detail: (id: string) => [...queryKeys.meetings.all, 'detail', id] as const,
  },
  
  staff: {
    all: ['staff'] as const,
    list: (page?: number, limit?: number) =>
      [...queryKeys.staff.all, 'list', page, limit] as const,
    detail: (id: string) => [...queryKeys.staff.all, 'detail', id] as const,
    availability: () => [...queryKeys.staff.all, 'availability'] as const,
  },
  
  organization: {
    all: ['organization'] as const,
    settings: () => [...queryKeys.organization.all, 'settings'] as const,
  },
};

// Smart mutation invalidation helpers
export const invalidationStrategies = {
  // After creating a new user, invalidate the user list
  onUserCreated: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  
  // After updating a user, invalidate specific user and list
  onUserUpdated: (queryClient: any, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  
  // After deleting a user, invalidate list
  onUserDeleted: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  },
  
  // After creating outpass, invalidate related queries
  onOutpassCreated: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.outpasses.all });
  },
  
  // After updating outpass status
  onOutpassUpdated: (queryClient: any, outpassId: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.outpasses.detail(outpassId),
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.outpasses.all });
  },
};
