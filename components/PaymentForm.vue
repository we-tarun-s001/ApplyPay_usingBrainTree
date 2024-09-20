<template>
  <div>
    <!-- Error and success messages -->
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">Transaction Successful!</div>

    <!-- Drop-in form -->
    <div id="dropin-container"></div>

    <!-- Payment submission button -->
    <button @click="submitPayment" :disabled="processing">Pay</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import dropin from "braintree-web-drop-in";

const success = ref(false);
const error = ref("");
const processing = ref(false);
let dropinInstance = null;

onMounted(async () => {
  try {
    // Fetch the client token from your server
    const { clientToken } = await $fetch("/api/token");

    // Initialize Braintree drop-in UI
    dropin.create(
      {
        authorization: clientToken,
        container: "#dropin-container", // Corrected container ID
        card: {
          cardholderName: true,
        },
      },
      (err, instance) => {
        if (err) {
          console.error(err);
          error.value = err.message;
          return;
        }
        dropinInstance = instance;
      }
    );
  } catch (err) {
    console.error("Error fetching client token:", err);
    error.value = "Failed to initialize payment form. Please try again.";
  }
});

// Submit payment
const submitPayment = async () => {
  if (!dropinInstance) {
    error.value = "Payment form is not ready.";
    return;
  }

  processing.value = true;
  error.value = "";

  try {
    // Request payment nonce from Braintree
    const { nonce } = await dropinInstance.requestPaymentMethod();

    // Send the payment request to your server
    const response = await $fetch("/api/checkout", {
      method: "POST",
      body: {
        amount: 100, // Replace with dynamic amount if needed
        nonce,
      },
    });

    if (response.success) {
      success.value = true;
    } else {
      error.value = response.message || "Transaction failed.";
    }
  } catch (err) {
    error.value = err.message || "An error occurred during payment.";
  } finally {
    processing.value = false;
  }
};
</script>

<style scoped>
.error {
  color: red;
}
.success {
  color: green;
}
</style>
