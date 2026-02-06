import { PGlite } from '@electric-sql/pglite';
import type { Recipe } from '@terrafork/core-types';

// Green Code: In-Browser Database (Zero Server)
// PGLite runs PostgreSQL entirely in the browser via WebAssembly
let dbPromise: Promise<PGlite> | null = null;
const isDev = import.meta.env.DEV;

// Green Code: Single initialization - reused across all operations
export function initDb(): Promise<PGlite> {
    if (dbPromise) return dbPromise;
    
    dbPromise = (async () => {
        const db = await PGlite.create({
            dataDir: 'idb://terrafork-db',
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
                ingredients TEXT NOT NULL,
                instructions TEXT NOT NULL,
                nutrients TEXT,
                host TEXT,
                url TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Green Code: Environment-guarded logging (no I/O waste in production)
        if (isDev) {
            console.log('Green Code: PGLite database initialized (Local-First)');
        }
        
        return db;
    })();
    
    return dbPromise;
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
    const db = await initDb();
    
    await db.query(
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

// Green Code: Explicit column selection (not SELECT *)
export async function getAllRecipes(): Promise<Recipe[]> {
    const db = await initDb();
    
    const result = await db.query<{
        id: string;
        title: string;
        total_time: string | null;
        yields: string | null;
        image: string | null;
        ingredients: string;
        instructions: string;
        host: string | null;
        url: string;
    }>(
        'SELECT id, title, total_time, yields, image, ingredients, instructions, host, url FROM recipes ORDER BY created_at DESC'
    );
    
    return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        total_time: row.total_time || undefined,
        yields: row.yields || undefined,
        image: row.image || undefined,
        ingredients: JSON.parse(row.ingredients),
        instructions: row.instructions,
        host: row.host || undefined,
        url: row.url
    }));
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
    const db = await initDb();
    
    const result = await db.query<{
        id: string;
        title: string;
        total_time: string | null;
        yields: string | null;
        image: string | null;
        ingredients: string;
        instructions: string;
        instructions: string;
        nutrients: string | null;
        host: string | null;
        url: string;
    }>(
        'SELECT id, title, total_time, yields, image, ingredients, instructions, nutrients, host, url FROM recipes WHERE id = $1',
        [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
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
    };
}

export async function deleteRecipe(id: string): Promise<void> {
    const db = await initDb();
    await db.query('DELETE FROM recipes WHERE id = $1', [id]);
}

// Green Code: Export all recipes for QR sync (compressed)
export async function exportAllRecipes(): Promise<Recipe[]> {
    const db = await initDb();
    
    const result = await db.query<{
        id: string;
        title: string;
        total_time: string | null;
        yields: string | null;
        image: string | null;
        ingredients: string;
        instructions: string;
        instructions: string;
        nutrients: string | null;
        host: string | null;
        url: string;
    }>(
        'SELECT id, title, total_time, yields, image, ingredients, instructions, nutrients, host, url FROM recipes ORDER BY created_at DESC'
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
