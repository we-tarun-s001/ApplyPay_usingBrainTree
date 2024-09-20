import { defineEventHandler, readBody } from 'h3';
import braintree from 'braintree';

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,  // Use environment variables
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const result = await gateway.transaction.sale({
      amount: body.amount,
      paymentMethodNonce: body.nonce,
      options: {
        submitForSettlement: true,
      },
    });

    if (result.success) {
      return { success: true, transactionId: result.transaction.id };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

