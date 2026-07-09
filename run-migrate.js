const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ACgwHakO0z4u@ep-bitter-violet-a1i5cj9q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(dbUrl);

async function run() {
  const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error("Migrations directory not found at", migrationsDir);
    process.exit(1);
  }

  // Get all .sql files sorted alphabetically
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found migration files: ${files.join(', ')}`);

  for (const file of files) {
    console.log(`\n--- Running migration: ${file} ---`);
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split by statement-breakpoint
    const statements = content.split('--> statement-breakpoint');
    
    for (let i = 0; i < statements.length; i++) {
      const rawStmt = statements[i].trim();
      if (!rawStmt) continue;
      
      // Filter out comments
      const stmt = rawStmt
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
        
      if (!stmt) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      try {
        await sql.query(stmt);
      } catch (err) {
        const errCode = err.code || (err.rawError && err.rawError.code);
        if (errCode === '42P07' || errCode === '42701' || errCode === '42710' || err.message.includes('already exists')) {
          console.warn(`[SKIP] Already exists: ${err.message}`);
        } else {
          console.error(`Error in ${file} statement ${i + 1}:`, err.message);
          console.error("Failed Statement was:", stmt);
          process.exit(1);
        }
      }
    }
    console.log(`Finished migration: ${file}`);
  }

  console.log("\nAll migrations executed successfully!");
}

run().catch(console.error);
