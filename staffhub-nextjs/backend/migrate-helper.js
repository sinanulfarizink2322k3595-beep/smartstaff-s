/**
 * Migration Helper Script
 * 
 * Simplifies database migration tasks with safety checks
 * Run with: node migrate-helper.js <command>
 * 
 * Commands:
 *   check     - Check migration status
 *   generate  - Generate migration
 *   apply     - Apply pending migrations
 *   reset     - Reset database (CAUTION!)
 *   backup    - Create backup before migration
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function question(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function checkConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    log('✅ Database connection successful', 'green');
    return true;
  } catch (error) {
    log('❌ Database connection failed', 'red');
    log(`   Error: ${error.message}`, 'red');
    log('\n💡 Check your DATABASE_URL in .env file', 'yellow');
    return false;
  }
}

async function checkMigrationStatus() {
  section('📊 Migration Status Check');
  
  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate status');
    
    if (stdout.includes('Database schema is up to date')) {
      log('✅ All migrations applied - database is up to date', 'green');
    } else if (stdout.includes('pending migration')) {
      log('⚠️  Pending migrations detected', 'yellow');
      console.log(stdout);
    } else {
      console.log(stdout);
    }
    
    if (stderr) {
      log('⚠️  Warnings:', 'yellow');
      console.log(stderr);
    }
    
    return true;
  } catch (error) {
    log('❌ Failed to check migration status', 'red');
    console.error(error.message);
    return false;
  }
}

async function generateMigration() {
  section('🔨 Generate Migration');
  
  log('This will create a new migration based on your schema changes', 'cyan');
  const name = await question('\nEnter migration name (e.g., "add_user_fields"): ');
  
  if (!name || name.trim() === '') {
    log('❌ Migration name is required', 'red');
    return false;
  }
  
  try {
    log(`\n🔄 Generating migration: ${name}...`, 'cyan');
    
    const { stdout, stderr } = await execAsync(`npx prisma migrate dev --name ${name} --create-only`);
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    log('✅ Migration generated successfully', 'green');
    log('\n💡 Review the migration file before applying', 'yellow');
    log('   Then run: node migrate-helper.js apply', 'yellow');
    
    return true;
  } catch (error) {
    log('❌ Failed to generate migration', 'red');
    console.error(error.message);
    return false;
  }
}

async function applyMigrations() {
  section('🚀 Apply Migrations');
  
  // Check for pending migrations first
  try {
    const { stdout } = await execAsync('npx prisma migrate status');
    
    if (stdout.includes('Database schema is up to date')) {
      log('✅ No pending migrations to apply', 'green');
      return true;
    }
  } catch (error) {
    // Continue anyway
  }
  
  log('⚠️  This will apply all pending migrations to your database', 'yellow');
  const confirm = await question('\nContinue? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    log('❌ Migration cancelled', 'yellow');
    return false;
  }
  
  try {
    log('\n🔄 Applying migrations...', 'cyan');
    
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    log('✅ Migrations applied successfully', 'green');
    
    // Run generate to update Prisma Client
    log('\n🔄 Updating Prisma Client...', 'cyan');
    await execAsync('npx prisma generate');
    log('✅ Prisma Client updated', 'green');
    
    return true;
  } catch (error) {
    log('❌ Failed to apply migrations', 'red');
    console.error(error.message);
    return false;
  }
}

async function resetDatabase() {
  section('🗑️  Reset Database');
  
  log('⚠️  WARNING: This will DELETE ALL DATA in your database!', 'red');
  log('⚠️  This action CANNOT be undone!', 'red');
  
  const confirm1 = await question('\nType "DELETE ALL DATA" to confirm: ');
  
  if (confirm1 !== 'DELETE ALL DATA') {
    log('❌ Reset cancelled', 'yellow');
    return false;
  }
  
  const confirm2 = await question('\nAre you absolutely sure? (yes/no): ');
  
  if (confirm2.toLowerCase() !== 'yes') {
    log('❌ Reset cancelled', 'yellow');
    return false;
  }
  
  try {
    log('\n🔄 Resetting database...', 'cyan');
    
    const { stdout, stderr } = await execAsync('npx prisma migrate reset --force');
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    log('✅ Database reset complete', 'green');
    log('\n💡 Your database is now empty. Consider running:', 'cyan');
    log('   node seed-database.js', 'cyan');
    
    return true;
  } catch (error) {
    log('❌ Failed to reset database', 'red');
    console.error(error.message);
    return false;
  }
}

async function createBackup() {
  section('💾 Create Database Backup');
  
  log('This command provides backup instructions', 'cyan');
  log('\nFor Supabase:', 'yellow');
  log('  1. Go to your Supabase dashboard', 'yellow');
  log('  2. Navigate to Database → Backups', 'yellow');
  log('  3. Download the latest backup', 'yellow');
  
  log('\nFor PostgreSQL command line:', 'yellow');
  log('  pg_dump -U postgres -h localhost -d staffhub > backup.sql', 'yellow');
  
  log('\n💡 For production, set up automated backups!', 'green');
}

async function initializeDatabase() {
  section('🎯 Initialize Database');
  
  log('This will set up your database from scratch', 'cyan');
  log('Steps:', 'cyan');
  log('  1. Generate Prisma Client', 'cyan');
  log('  2. Create and apply all migrations', 'cyan');
  log('  3. Optionally seed with sample data', 'cyan');
  
  const confirm = await question('\nProceed? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    log('❌ Initialization cancelled', 'yellow');
    return false;
  }
  
  try {
    // Step 1: Generate Prisma Client
    log('\n🔄 Step 1/3: Generating Prisma Client...', 'cyan');
    await execAsync('npx prisma generate');
    log('✅ Prisma Client generated', 'green');
    
    // Step 2: Create and apply migrations
    log('\n🔄 Step 2/3: Applying migrations...', 'cyan');
    try {
      await execAsync('npx prisma migrate dev --name init');
    } catch (error) {
      // If migration exists, just deploy
      await execAsync('npx prisma migrate deploy');
    }
    log('✅ Migrations applied', 'green');
    
    // Step 3: Optional seed
    log('\n🔄 Step 3/3: Seed database?', 'cyan');
    const seed = await question('Load sample data? (yes/no): ');
    
    if (seed.toLowerCase() === 'yes') {
      log('\n🔄 Seeding database...', 'cyan');
      await execAsync('node seed-database.js');
      log('✅ Database seeded', 'green');
    }
    
    log('\n🎉 Database initialization complete!', 'green');
    log('\n💡 Next steps:', 'cyan');
    log('   - Start backend: npm run dev', 'cyan');
    log('   - Test database: node test-database.js', 'cyan');
    log('   - Check health: node db-health-check.js', 'cyan');
    
    return true;
  } catch (error) {
    log('❌ Initialization failed', 'red');
    console.error(error.message);
    return false;
  }
}

async function showHelp() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║       DATABASE MIGRATION HELPER                            ║', 'cyan');
  log('║       StaffHub NextJS                                      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\nUsage: node migrate-helper.js <command>', 'yellow');
  
  log('\nAvailable commands:', 'cyan');
  log('  init        - Initialize database from scratch (recommended for first time)', 'reset');
  log('  check       - Check current migration status', 'reset');
  log('  generate    - Generate a new migration', 'reset');
  log('  apply       - Apply pending migrations', 'reset');
  log('  reset       - Reset database (deletes all data - use with caution!)', 'reset');
  log('  backup      - Show backup instructions', 'reset');
  log('  help        - Show this help message', 'reset');
  
  log('\nExamples:', 'cyan');
  log('  node migrate-helper.js init', 'reset');
  log('  node migrate-helper.js check', 'reset');
  log('  node migrate-helper.js generate', 'reset');
  log('  node migrate-helper.js apply', 'reset');
  
  log('\nRecommended workflow:', 'yellow');
  log('  1. node migrate-helper.js init         (first time setup)', 'reset');
  log('  2. node migrate-helper.js check        (check status)', 'reset');
  log('  3. Make schema changes in schema.prisma', 'reset');
  log('  4. node migrate-helper.js generate     (create migration)', 'reset');
  log('  5. node migrate-helper.js apply        (apply migration)', 'reset');
  
  console.log('');
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    await showHelp();
    process.exit(0);
  }
  
  // Check connection first (except for help and backup)
  if (!['help', 'backup'].includes(command)) {
    const connected = await checkConnection();
    if (!connected) {
      process.exit(1);
    }
  }
  
  let success = false;
  
  switch (command) {
    case 'init':
      success = await initializeDatabase();
      break;
    case 'check':
      success = await checkMigrationStatus();
      break;
    case 'generate':
      success = await generateMigration();
      break;
    case 'apply':
      success = await applyMigrations();
      break;
    case 'reset':
      success = await resetDatabase();
      break;
    case 'backup':
      await createBackup();
      success = true;
      break;
    default:
      log(`❌ Unknown command: ${command}`, 'red');
      log('Run: node migrate-helper.js help', 'yellow');
      break;
  }
  
  await prisma.$disconnect();
  process.exit(success ? 0 : 1);
}

// Run main function
main().catch((error) => {
  log('\n❌ Fatal error:', 'red');
  console.error(error);
  prisma.$disconnect();
  process.exit(1);
});
