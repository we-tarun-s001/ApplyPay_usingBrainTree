<template>
  <div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">Transaction Successful!</div>
    <button
      v-if="applePaySupported"
      id="apple-pay-button"
      @click="startApplePay"
    >
      Pay with Apple Pay
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import braintree from "braintree-web";

const error = ref("");
const success = ref(false);
const applePaySupported = ref(false);

let applePayInstance = null;

onMounted(async () => {
  try {
    const { clientToken } = await $fetch("/api/token");

    const clientInstance = await braintree.client.create({
      authorization: clientToken,
    });

    applePayInstance = await braintree.applePay.create({
      client: clientInstance,
    });

    // Check if Apple Pay is available on the user's device
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      applePaySupported.value = true;
    } else {
      error.value = "Apple Pay is not available on this device.";
    }
  } catch (err) {
    error.value = "Error setting up Apple Pay.";
    console.error(err);
  }
});

const startApplePay = async () => {
  if (!applePayInstance) {
    error.value = "Apple Pay instance is not initialized.";
    return;
  }

  const paymentRequest = applePayInstance.createPaymentRequest({
    total: {
      label: "Your Merchant Name",
      amount: "100.00", // Replace with dynamic amount
    },
    requiredBillingContactFields: ["postalAddress"],
  });

  const session = new ApplePaySession(3, paymentRequest);

  session.onvalidatemerchant = async (event) => {
    try {
      const { merchantSession } = await $fetch("/api/validate-merchant", {
        method: "POST",
        body: {
          validationUrl: event.validationURL,
        },
      });
      session.completeMerchantValidation(merchantSession);
    } catch (err) {
      session.abort();
      error.value = "Merchant validation failed.";
    }
  };

  session.onpaymentauthorized = async (event) => {
    try {
      const payload = await applePayInstance.tokenize({
        token: event.payment.token,
      });

      const response = await $fetch("/api/checkout", {
        method: "POST",
        body: {
          amount: 100, // Replace with dynamic amount
          nonce: payload.nonce,
        },
      });

      if (response.success) {
        success.value = true;
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
      } else {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        error.value = response.message;
      }
    } catch (err) {
      session.completePayment(ApplePaySession.STATUS_FAILURE);
      error.value = "Payment authorization failed.";
    }
  };

  session.begin();
};
</script>

<style scoped>
#error {
  color: red;
}
.success {
  color: green;
}
#apple-pay-button {
  background-color: black;
  color: white;
  font-size: 16px;
  padding: 10px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}
#apple-pay-button:hover {
  background-color: #333;
}
</style>
