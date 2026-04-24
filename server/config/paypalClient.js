/**
 * @file paypalClient.js
 * @description Modern PayPal SDK client configuration
 * 
 * @overview
 * Configures PayPal SDK with OAuth 2.0 authentication for sandbox and production.
 * Replaces legacy PayPal API calls with modern SDK approach.
 */

import paypal from '@paypal/checkout-server-sdk';

/**
 * PayPal environment configuration
 */
function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
    }

    if (mode === 'live') {
        return new paypal.core.LiveEnvironment(clientId, clientSecret);
    }

    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

/**
 * Get OAuth2 Access Token
 */
async function getAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const mode = process.env.PAYPAL_MODE || 'sandbox';
    const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
}

export { client, environment, getAccessToken };
