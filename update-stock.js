const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const { items } = JSON.parse(event.body);
  // items = [{ product_id: 1, qty: 2 }, ...]

  const errors = [];

  for (const item of items) {
    // Get current stock
    const { data, error } = await supabase
      .from('stock')
      .select('ordered, limit')
      .eq('product_id', item.product_id)
      .single();

    if (error) { errors.push(error.message); continue; }

    const newOrdered = data.ordered + item.qty;

    // Update the count
    const { error: updateError } = await supabase
      .from('stock')
      .update({ ordered: newOrdered })
      .eq('product_id', item.product_id);

    if (updateError) errors.push(updateError.message);
  }

  if (errors.length > 0) {
    return {
      statusCode: 500,
      body: JSON.stringify({ errors })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
