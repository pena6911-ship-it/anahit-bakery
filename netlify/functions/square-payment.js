/**
 * square-payment.js — Netlify Serverless Function
 * ANAHIT Bakery · Square Payment Processing
 *
 * This function receives a Square payment token from the browser,
 * charges the card server-side, and returns the result.
 *
 * ──────────────────────────────────────────────
 * REQUIRED NETLIFY ENVIRONMENT VARIABLE:
 *   SQUARE_ACCESS_TOKEN  — from developer.squareup.com → your app → Credentials
 *
 * TO GO LIVE:
 *   1. Change Environment.Sandbox → Environment.Production (line ~28)
 *   2. Update SQUARE_ACCESS_TOKEN in Netlify to your Production access token
 *   3. Swap the Square SDK src in sourdough_preorder.html <head> to:
 *      https://web.squarecdn.com/v1/square.js
 *   4. Update SQUARE_APP_ID and SQUARE_LOCATION_ID in sourdough_preorder.html
 *      to your Production values
 * ──────────────────────────────────────────────
 */

const { Client, Environment } = require('square');

// Square SDK uses BigInt internally. JSON.stringify cannot handle BigInt by
// default, so we patch it here to convert BigInt values to strings safely.
BigInt.prototype.toJSON = function () { return this.toString(); };

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // ← Change to Environment.Production when going live
});

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  const { sourceId, amountCents, ref, customerName, email } = body;

  // Basic validation
  if (!sourceId || !amountCents || !ref) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required payment fields' }),
    };
  }

  if (amountCents < 50) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Order amount is too low to process' }),
    };
  }

  try {
    const response = await client.paymentsApi.createPayment({
      sourceId,
      // idempotencyKey prevents double-charges if the request is retried
      idempotencyKey: ref,
      amountMoney: {
        amount: BigInt(amountCents), // BigInt required by Square SDK
        currency: 'USD',
      },
      note:                `ANAHIT Pre-Order ${ref} — ${customerName || 'Customer'}`,
      buyerEmailAddress:   email || undefined,
      statementDescriptionIdentifier: 'ANAHIT BAKERY',
    });

    const payment = response.result.payment;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success:   true,
        paymentId: payment.id,
        status:    payment.status,
        amount:    payment.amountMoney,
      }),
    };

  } catch (error) {
    // Log the full error to Netlify function logs for debugging
    console.error('Square payment error:', JSON.stringify(error, null, 2));

    // Extract a human-readable message from Square's error format
    const squareMessage =
      error?.errors?.[0]?.detail ||
      error?.errors?.[0]?.code ||
      'Payment could not be processed. Please try again.';

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: squareMessage }),
    };
  }
};
