import { supabase } from './services/supabase';

async function run() {
  try {
    // 1. Fetch segments
    const { data: segments, error: fetchError } = await supabase.from('segments').select('*');
    if (fetchError) throw fetchError;

    if (!segments || segments.length === 0) {
      console.log('No segments found to test deletion');
      return;
    }

    // Find a segment to test delete. Let's find one that we can try to delete.
    // Let's create a temporary segment first, then delete it, to see if that works.
    console.log('Creating a temporary segment for testing...');
    const { data: tempSeg, error: createError } = await supabase
      .from('segments')
      .insert({
        name: 'Delete Test Temp Segment',
        description: 'Temporary segment for debugging deletion constraints',
        filter_rules: { rules: [] }
      })
      .select()
      .single();

    if (createError) throw createError;
    console.log('Created temporary segment:', tempSeg);

    // Try to delete the temporary segment
    console.log('Attempting to delete temporary segment...');
    const { error: deleteError } = await supabase
      .from('segments')
      .delete()
      .eq('id', tempSeg.id);

    if (deleteError) {
      console.error('DELETE error for temporary segment:', deleteError);
    } else {
      console.log('Successfully deleted temporary segment!');
    }

    // Now let's find the seeded segment (if any) and see if trying to delete it fails.
    const seededSeg = segments.find(s => s.name === 'Inactive Customers Demo');
    if (seededSeg) {
      console.log(`Attempting to delete seeded segment "${seededSeg.name}" (ID: ${seededSeg.id})...`);
      const { error: deleteSeededError } = await supabase
        .from('segments')
        .delete()
        .eq('id', seededSeg.id);

      if (deleteSeededError) {
        console.error('DELETE error for seeded segment:', deleteSeededError);
      } else {
        console.log('Successfully deleted seeded segment!');
      }
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

run();
