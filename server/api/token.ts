import { defineEventHandler } from 'h3';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,  // Secure your credentials
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export default defineEventHandler(async () => {
  const response = await gateway.clientToken.generate({});
  return { clientToken: response.clientToken };
});
