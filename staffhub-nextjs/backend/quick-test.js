#!/usr/bin/env node

/**
 * Quick Test Script - Run All Database Tests
 * 
 * Usage: node quick-test.js
 * 
 * Runs all database tests in sequence and provides a summary
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(name, command) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Running: ${name}`, 'cyan');
  log('='.repeat(60), 'cyan');
  
  const start = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(command);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    console.log(stdout);
    if (stderr) console.error(stderr);
    
    log(`✅ ${name} completed in ${duration}s`, 'green');
    return { success: true, duration, name };
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    log(`❌ ${name} failed in ${duration}s`, 'red');
    console.error(error.stdout || error.message);
    return { success: false, duration, name, error: error.message };
  }
}

async function main() {
  log('\n' + '╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║          QUICK DATABASE TEST SUITE                         ║', 'cyan');
  log('║          Running All Tests                                 ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const overallStart = Date.now();
  const results = [];
  
  // Test 1: Health Check
  results.push(await runCommand(
    'Health Check',
    'node db-health-check.js'
  ));
  
  // Test 2: Comprehensive Database Tests
  results.push(await runCommand(
    'Database Tests',
    'node test-database.js'
  ));
  
  // Test 3: AI Organization Builder (standalone)
  results.push(await runCommand(
    'AI Org Builder Test',
    'node test-ai-orgbuilder.js'
  ));
  
  // Test 4: Migration Status
  results.push(await runCommand(
    'Migration Status',
    'node migrate-helper.js check'
  ));
  
  const overallDuration = ((Date.now() - overallStart) / 1000).toFixed(2);
  
  // Summary
  log('\n' + '═'.repeat(60), 'cyan');
  log('OVERALL TEST SUMMARY', 'cyan');
  log('═'.repeat(60), 'cyan');
  console.log('');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${icon} ${result.name}: ${result.duration}s`, color);
  });
  
  console.log('');
  log(`Total Tests: ${results.length}`, 'cyan');
  log(`Passed: ${passed}`, passed > 0 ? 'green' : 'reset');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`Total Duration: ${overallDuration}s`, 'cyan');
  console.log('');
  
  if (failed === 0) {
    log('🎉 ALL TESTS PASSED!', 'green');
    log('Your database is fully operational and optimized.', 'green');
    console.log('');
    log('Next steps:', 'cyan');
    log('  - Start backend: npm run dev', 'reset');
    log('  - Start frontend: cd ../frontend && npm run dev', 'reset');
    log('  - Access: http://localhost:3000', 'reset');
  } else {
    log('⚠️  SOME TESTS FAILED', 'yellow');
    log('Review the error messages above for details.', 'yellow');
    console.log('');
    log('Troubleshooting:', 'cyan');
    log('  - Check DATABASE_URL in .env', 'reset');
    log('  - Run: node migrate-helper.js check', 'reset');
    log('  - See: DATABASE_TESTING_GUIDE.md', 'reset');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  log('\n❌ Fatal error:', 'red');
  console.error(error);
  process.exit(1);
});
