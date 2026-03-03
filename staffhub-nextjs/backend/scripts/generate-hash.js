// Generate bcrypt hash for password
const bcrypt = require('bcryptjs');

const password = 'sfnk123#';
const hash = bcrypt.hashSync(password, 10);

console.log('\n====================================');
console.log('Password Hash Generator');
console.log('====================================');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('====================================\n');

// Output for SQL script
console.log('Use this in your SQL script:');
console.log(`'${hash}'`);
console.log('');
