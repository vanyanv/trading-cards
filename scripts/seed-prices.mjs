import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local
const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rarityPrices = {
  'Common': [0.25, 2.00],
  'Uncommon': [0.50, 5.00],
  'Rare': [5.00, 50.00],
  'Double Rare': [10.00, 80.00],
  'Illustration Rare': [15.00, 120.00],
  'Ultra Rare': [25.00, 200.00],
  'Special Illustration Rare': [50.00, 400.00],
  'Hyper Rare': [100.00, 600.00],
};

const trends = ['stable', 'stable', 'stable', 'stable', 'stable', 'stable', 'up', 'up', 'up', 'down', 'down'];
const conditions = ['NM', 'NM', 'NM', 'NM', 'NM', 'NM', 'NM', 'LP', 'LP'];

async function main() {
  const { data: cards, error } = await supabase.from('cards').select('id, rarity');
  if (error) { console.error('Fetch error:', error); process.exit(1); }

  console.log(`Found ${cards.length} cards, seeding prices...`);

  let updated = 0;
  let failed = 0;

  for (const card of cards) {
    const range = rarityPrices[card.rarity];
    if (!range) { console.log(`Unknown rarity: ${card.rarity}`); continue; }

    const price = parseFloat((range[0] + Math.random() * (range[1] - range[0])).toFixed(2));
    const price_trend = trends[Math.floor(Math.random() * trends.length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const { error: err } = await supabase
      .from('cards')
      .update({ price, price_trend, condition })
      .eq('id', card.id);

    if (err) {
      failed++;
      if (failed === 1) console.error(`First error: ${err.message}`);
      if (failed >= 3) {
        console.error('Too many errors. Columns may not exist yet.');
        console.log('\nYou need to add the columns first. Run this SQL in Supabase Dashboard > SQL Editor:');
        console.log('---');
        console.log("ALTER TABLE cards ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT NULL;");
        console.log("ALTER TABLE cards ADD COLUMN IF NOT EXISTS price_trend VARCHAR(10) DEFAULT NULL;");
        console.log("ALTER TABLE cards ADD COLUMN IF NOT EXISTS condition VARCHAR(10) DEFAULT 'NM';");
        console.log('---');
        console.log('Then re-run this script.');
        process.exit(1);
      }
    } else {
      updated++;
    }
  }

  console.log(`Done! Updated ${updated} cards, ${failed} failed.`);
}

main();
