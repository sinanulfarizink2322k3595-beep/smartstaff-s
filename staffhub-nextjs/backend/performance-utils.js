/**
 * Performance Optimization Utilities
 * 
 * Database query optimizations, caching, and performance monitoring
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Create optimized Prisma client with connection pooling
 */
function createOptimizedPrismaClient() {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    
    // Connection pool configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Query performance middleware
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      console.warn(`⚠️  Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
    }

    return result;
  });

  return prisma;
}

/**
 * Batch operations helper for bulk inserts/updates
 */
class BatchOperations {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Bulk create with transaction
   */
  async bulkCreate(model, data, batchSize = 100) {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    return this.prisma.$transaction(
      batches.map(batch => 
        this.prisma[model].createMany({ data: batch, skipDuplicates: true })
      )
    );
  }

  /**
   * Bulk update with transaction
   */
  async bulkUpdate(model, updates) {
    return this.prisma.$transaction(
      updates.map(({ where, data }) =>
        this.prisma[model].update({ where, data })
      )
    );
  }

  /**
   * Bulk delete with transaction
   */
  async bulkDelete(model, ids) {
    return this.prisma[model].deleteMany({
      where: { id: { in: ids } },
    });
  }
}

/**
 * Query optimization helpers
 */
class QueryOptimizer {
  /**
   * Get organization data with efficient includes
   */
  static async getOrganizationWithData(prisma, orgId) {
    return prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        settings: true,
        
        // Get counts instead of full data
        _count: {
          select: {
            users: true,
            departments: true,
            customRoles: true,
            outpasses: true,
            meetings: true,
          },
        },
      },
    });
  }

  /**
   * Get user with minimal necessary data
   */
  static async getUserMinimal(prisma, userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        departmentId: true,
        isActive: true,
      },
    });
  }

  /**
   * Get department tree with selective loading
   */
  static async getDepartmentTree(prisma, orgId, maxDepth = 2) {
    // Get only parent departments with limited depth
    return prisma.department.findMany({
      where: {
        organizationId: orgId,
        parentId: null, // Root level only
      },
      include: {
        children: {
          include: maxDepth > 1 ? {
            children: maxDepth > 2 ? true : false,
          } : false,
        },
        _count: {
          select: {
            customRoles: true,
          },
        },
      },
    });
  }

  /**
   * Paginated queries with cursor-based pagination (more efficient)
   */
  static async paginateWithCursor(prisma, model, {
    cursor,
    take = 20,
    where = {},
    orderBy = { createdAt: 'desc' },
    select,
  }) {
    const results = await prisma[model].findMany({
      take: take + 1, // Take one extra to check if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy,
      select,
    });

    const hasMore = results.length > take;
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Efficient outpass queries with filtered includes
   */
  static async getOutpassesOptimized(prisma, orgId, filters = {}) {
    const where = {
      organizationId: orgId,
      ...filters,
    };

    return prisma.outpass.findMany({
      where,
      select: {
        id: true,
        reason: true,
        destination: true,
        outTime: true,
        expectedReturnTime: true,
        status: true,
        createdAt: true,
        
        // Only get necessary user fields
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to prevent overwhelming queries
    });
  }
}

/**
 * Caching helper (simple in-memory cache)
 */
class SimpleCache {
  constructor(ttlSeconds = 300) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  /**
   * Get or set pattern for caching queries
   */
  async getOrSet(key, fetchFunction) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFunction();
    this.set(key, fresh);
    return fresh;
  }
}

/**
 * Database index recommendations
 */
const RECOMMENDED_INDEXES = [
  {
    model: 'User',
    fields: ['organizationId', 'role'],
    reason: 'Frequently filtered by organization and role',
  },
  {
    model: 'User',
    fields: ['email'],
    reason: 'Used for authentication lookups',
  },
  {
    model: 'Department',
    fields: ['organizationId', 'parentId'],
    reason: 'Hierarchical queries and organization filtering',
  },
  {
    model: 'CustomRole',
    fields: ['organizationId', 'departmentId'],
    reason: 'Role lookups by organization and department',
  },
  {
    model: 'Permission',
    fields: ['roleId', 'resource', 'action'],
    reason: 'Permission checks are frequent',
  },
  {
    model: 'Outpass',
    fields: ['organizationId', 'status', 'studentId'],
    reason: 'Status filtering and student lookups',
  },
  {
    model: 'Meeting',
    fields: ['organizationId', 'status', 'staffId', 'studentId'],
    reason: 'Status and user filtering',
  },
  {
    model: 'Notification',
    fields: ['userId', 'isRead'],
    reason: 'User notification queries',
  },
];

/**
 * Performance monitoring
 */
class PerformanceMonitor {
  static async analyzeQueries(prisma) {
    console.log('📊 Analyzing database performance...\n');

    // Check table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
      LIMIT 10;
    `;

    console.log('Top 10 largest tables:');
    console.table(tableSizes);

    // Check index usage
    const indexUsage = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10;
    `;

    console.log('\nTop 10 most used indexes:');
    console.table(indexUsage);

    // Check for missing indexes
    const missingIndexes = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
        AND n_distinct > 100
        AND correlation < 0.1
      LIMIT 10;
    `;

    if (missingIndexes.length > 0) {
      console.log('\n⚠️  Potential missing indexes:');
      console.table(missingIndexes);
    }

    return {
      tableSizes,
      indexUsage,
      missingIndexes,
    };
  }

  static async getSlowQueries(prisma) {
    // Requires pg_stat_statements extension
    try {
      const slowQueries = await prisma.$queryRaw`
        SELECT
          query,
          calls,
          total_time,
          mean_time,
          max_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_time DESC
        LIMIT 10;
      `;

      console.log('Top 10 slowest queries:');
      console.table(slowQueries);
      
      return slowQueries;
    } catch (error) {
      console.log('⚠️  pg_stat_statements extension not available');
      return [];
    }
  }
}

// Export utilities
module.exports = {
  createOptimizedPrismaClient,
  BatchOperations,
  QueryOptimizer,
  SimpleCache,
  PerformanceMonitor,
  RECOMMENDED_INDEXES,
};

// CLI usage example
if (require.main === module) {
  const prisma = createOptimizedPrismaClient();
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     DATABASE PERFORMANCE ANALYSIS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  Promise.all([
    PerformanceMonitor.analyzeQueries(prisma),
    PerformanceMonitor.getSlowQueries(prisma),
  ])
    .then(() => {
      console.log('\n✅ Analysis complete');
      console.log('\n📖 Recommended indexes:');
      RECOMMENDED_INDEXES.forEach(({ model, fields, reason }) => {
        console.log(`   ${model}: [${fields.join(', ')}] - ${reason}`);
      });
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
