// PayPal Payment Link — hosted checkout page
// No API keys needed — just redirect users to the link
// Set PAYPAL_PAYMENT_LINK in .env to use your own PayPal payment link

const DEFAULT_URL = 'https://www.paypal.com/ncp/payment/A7G5YBBM3ZJCY';

export function isConfigured() {
  return true;
}

export function createOrder() {
  return {
    id: 'paypal-link-' + Date.now(),
    status: 'CREATED',
    url: process.env.PAYPAL_PAYMENT_LINK || DEFAULT_URL
  };
}
