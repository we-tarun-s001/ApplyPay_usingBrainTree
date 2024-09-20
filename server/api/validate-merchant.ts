import { defineEventHandler, readBody } from 'h3';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Use Production in real environments
  merchantId: process.env.BRAINTREE_MERCHANT_ID,  // Secure your credentials
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  try {
    const merchantSession = await gateway.applePay.performValidation({
      validationURL: body.validationUrl,
      displayName: 'Your Merchant Name',
    });

    return { merchantSession };
  } catch (error) {
    console.error("Merchant validation failed:", error);
    throw new Error("Merchant validation failed.");
  }
});
