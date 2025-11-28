import fs from 'fs';
import path from 'path';
import prisma from '../lib/prismaClient';

async function main() {
  console.log('Setting up database triggers...');
  
  const sqlPath = path.join(__dirname, '../db/triggers.sql');
  
  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by delimiter
    const commands = sql.split('-- SPLIT --');
    
    for (const command of commands) {
      if (command.trim()) {
        await prisma.$executeRawUnsafe(command);
      }
    }
    
    console.log('Triggers set up successfully.');
  } catch (error) {
    console.error('Error setting up triggers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
