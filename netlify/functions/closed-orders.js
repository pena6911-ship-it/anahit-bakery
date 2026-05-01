const { createClient } = require('@supabase/supabase-js');

// Runs every Thursday at 8:30PM ET = Friday 00:30 UTC
// Flips all products to soldOut = true in a new sold_out column
// The website checks this flag on page load

exports.handler = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const { error } = await supabase
    .from('stock')
    .update({ sold_out: true })
    .gte('product_id', 1);

  if (error) {
    console.error('Close orders failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  console.log('All orders closed for the week — Thursday 8:30PM ET');
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'All products marked sold out' })
  };
};
