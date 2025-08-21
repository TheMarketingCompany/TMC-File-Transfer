interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    // Simple authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    await runMigrations(env.DB);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function runMigrations(db: D1Database): Promise<void> {
  console.log('Running database migrations...');
  
  // Create metadata table for tracking migrations
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Migration 1: Create new uploads table with improved schema
  const migration1Applied = await checkMigration(db, 'migration_1_improved_uploads');
  if (!migration1Applied) {
    console.log('Applying migration 1: Improved uploads table');
    
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS uploads_v2 (
        file_id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        download_count INTEGER DEFAULT 0,
        max_downloads INTEGER DEFAULT 999999,
        has_password BOOLEAN DEFAULT FALSE,
        password_hash TEXT,
        salt TEXT,
        is_one_time BOOLEAN DEFAULT FALSE,
        upload_timestamp INTEGER NOT NULL,
        last_download DATETIME,
        client_ip TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await markMigrationComplete(db, 'migration_1_improved_uploads');
  }

  // Migration 2: Create rate limiting table
  const migration2Applied = await checkMigration(db, 'migration_2_rate_limits');
  if (!migration2Applied) {
    console.log('Applying migration 2: Rate limiting table');
    
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        client_key TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        action_type TEXT DEFAULT 'api',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await markMigrationComplete(db, 'migration_2_rate_limits');
  }

  // Migration 3: Create indexes for performance
  const migration3Applied = await checkMigration(db, 'migration_3_indexes');
  if (!migration3Applied) {
    console.log('Applying migration 3: Database indexes');
    
    // Indexes for uploads_v2
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_uploads_expires_at ON uploads_v2(expires_at)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_uploads_file_name ON uploads_v2(file_name)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_uploads_upload_timestamp ON uploads_v2(upload_timestamp)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_uploads_cleanup ON uploads_v2(expires_at, is_one_time, download_count, max_downloads)`).run();
    
    // Indexes for rate_limits
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(client_key, timestamp)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp)`).run();
    
    await markMigrationComplete(db, 'migration_3_indexes');
  }

  // Migration 4: Migrate data from old table if it exists
  const migration4Applied = await checkMigration(db, 'migration_4_data_migration');
  if (!migration4Applied) {
    console.log('Applying migration 4: Data migration from old table');
    
    try {
      // Check if old table exists and has data
      const oldData = await db.prepare(`SELECT COUNT(*) as count FROM uploads`).first().catch(() => ({ count: 0 }));
      
      if (oldData && oldData.count > 0) {
        console.log(`Migrating ${oldData.count} records from old table...`);
        
        // Migrate data with best-effort conversion
        await db.prepare(`
          INSERT INTO uploads_v2 (
            file_id, file_name, original_name, file_size, content_type,
            expires_at, download_count, max_downloads, has_password,
            is_one_time, upload_timestamp, client_ip
          )
          SELECT 
            fileId as file_id,
            filename as file_name,
            COALESCE(JSON_EXTRACT(options, '$.originalName'), filename) as original_name,
            COALESCE(JSON_EXTRACT(options, '$.fileSize'), 0) as file_size,
            COALESCE(JSON_EXTRACT(options, '$.contentType'), 'application/octet-stream') as content_type,
            timeout as expires_at,
            downloadCount as download_count,
            CASE 
              WHEN JSON_EXTRACT(options, '$.otd') = 1 THEN 1 
              ELSE 999999 
            END as max_downloads,
            CASE 
              WHEN JSON_EXTRACT(options, '$.password') IS NOT NULL THEN 1 
              ELSE 0 
            END as has_password,
            COALESCE(JSON_EXTRACT(options, '$.otd'), 0) as is_one_time,
            uploadTimestamp as upload_timestamp,
            'migrated' as client_ip
          FROM uploads
          WHERE fileId NOT IN (SELECT file_id FROM uploads_v2)
        `).run();
        
        console.log('Data migration completed');
      }
    } catch (error) {
      console.log('Old table does not exist or migration failed:', error.message);
    }
    
    await markMigrationComplete(db, 'migration_4_data_migration');
  }

  console.log('All migrations completed successfully');
}

async function checkMigration(db: D1Database, migrationName: string): Promise<boolean> {
  const result = await db.prepare(`
    SELECT value FROM metadata WHERE key = ?
  `).bind(`migration:${migrationName}`).first();
  
  return !!result;
}

async function markMigrationComplete(db: D1Database, migrationName: string): Promise<void> {
  await db.prepare(`
    INSERT OR REPLACE INTO metadata (key, value) 
    VALUES (?, ?)
  `).bind(`migration:${migrationName}`, new Date().toISOString()).run();
}