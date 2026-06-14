import { supabase } from './services/supabase';

async function run() {
  try {
    const tables = ['customers', 'orders', 'segments', 'segment_members', 'campaigns', 'communications', 'campaign_stats'];
    for (const t of tables) {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`Error on table ${t}:`, error);
      } else {
        console.log(`Table ${t}: ${count} rows`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
run();
