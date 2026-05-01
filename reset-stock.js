const { createClient } = require('@supabase/supabase-js');

// This function runs automatically every Friday at midnight ET
// Scheduled via netlify.toml

exports.handler = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const { error } = await supabase
    .from('stock')
    .update({ ordered: 0 })
    .gte('product_id', 1); // resets all products

  if (error) {
    console.error('Reset failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  console.log('Stock reset successfully for new week');
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'Stock reset for new week' })
  };
};
