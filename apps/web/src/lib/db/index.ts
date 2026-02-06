import { PGlite } from '@electric-sql/pglite';
import type { Recipe } from '@forkzero/core-types';

// Green Code: In-Browser Database (Zero Server)
// PGLite runs PostgreSQL entirely in the browser via WebAssembly
let db: PGlite | null = null;

export async function initDb(): Promise<PGlite> {
    if (db) return db;
    
    // Initialize PGLite with IndexedDB persistence
    db = await PGlite.create({
        dataDir: 'idb://forkzero-db',
        relaxedDurability: true // Green: Reduce disk writes for better performance
    });
    
    // Create recipes table if not exists
    await db.exec(`
        CREATE TABLE IF NOT EXISTS recipes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            total_time TEXT,
            yields TEXT,
            image TEXT,
            ingredients TEXT NOT NULL, -- Stored as JSON array
            instructions TEXT NOT NULL,
            nutrients TEXT, -- Stored as JSON object
            host TEXT,
            url TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    console.log('Green Code: PGLite database initialized (Local-First)');
    return db;
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
    const database = await initDb();
    
    await database.query(
        `INSERT INTO recipes (id, title, total_time, yields, image, ingredients, instructions, nutrients, host, url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (url) DO UPDATE SET
            title = EXCLUDED.title,
            total_time = EXCLUDED.total_time,
            yields = EXCLUDED.yields,
            image = EXCLUDED.image,
            ingredients = EXCLUDED.ingredients,
            instructions = EXCLUDED.instructions,
            nutrients = EXCLUDED.nutrients,
            host = EXCLUDED.host`,
        [
            recipe.id,
            recipe.title,
            recipe.total_time,
            recipe.yields,
            recipe.image,
            JSON.stringify(recipe.ingredients),
            recipe.instructions,
            recipe.nutrients ? JSON.stringify(recipe.nutrients) : null,
            recipe.host,
            recipe.url
        ]
    );
}

export async function getAllRecipes(): Promise<Recipe[]> {
    const database = await initDb();
    
    const result = await database.query<{
        id: string;
        title: string;
        total_time: string | null;
        yields: string | null;
        image: string | null;
        ingredients: string;
        instructions: string;
        nutrients: string | null;
        host: string | null;
        url: string;
    }>(
        'SELECT * FROM recipes ORDER BY created_at DESC'
    );
    
    return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        total_time: row.total_time || undefined,
        yields: row.yields || undefined,
        image: row.image || undefined,
        ingredients: JSON.parse(row.ingredients),
        instructions: row.instructions,
        nutrients: row.nutrients ? JSON.parse(row.nutrients) : undefined,
        host: row.host || undefined,
        url: row.url
    }));
}

export async function deleteRecipe(id: string): Promise<void> {
    const database = await initDb();
    await database.query('DELETE FROM recipes WHERE id = $1', [id]);
}