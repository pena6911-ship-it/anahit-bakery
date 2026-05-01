const { createClient } = require('@supabase/supabase-js');

// Runs every Saturday at 4:00 AM UTC = Friday midnight ET
// Resets ordered count to 0 AND reopens orders (sold_out = false) for new week

exports.handler = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const { error } = await supabase
    .from('stock')
    .update({ ordered: 0, sold_out: false })
    .gte('product_id', 1);

  if (error) {
    console.error('Reset failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  console.log('Stock reset and orders reopened for new week');
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'Stock reset and orders reopened for new week' })
  };
};
