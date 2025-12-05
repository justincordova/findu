import { execSync } from 'child_process';

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('TEST LIKES SCRIPT - Run all operations in sequence');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  try {
    console.log('Running cleanup...');
    execSync('npm run cleanup:test-likes', { stdio: 'inherit' });

    console.log('\nRunning create:likes...');
    execSync('npm run create:likes', { stdio: 'inherit' });

    console.log('\nRunning create:mutual...');
    execSync('npm run create:mutual', { stdio: 'inherit' });

    console.log('\nRunning check:matches...');
    execSync('npm run check:matches', { stdio: 'inherit' });

    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('DONE');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running test:', error);
    process.exit(1);
  }
}

main();
