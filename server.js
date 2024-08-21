const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const ngrok = require("ngrok");
const axios = require("axios"); // You'll need to install this: npm install axios

const app = express();
const port = 3000;

// Shopify store configuration
const SHOP = "XXXX.myshopify.com";
const ACCESS_TOKEN = "XXXXXX"; // Replace with your actual access token
const API_VERSION = "2024-07"; // Update this as needed
const NGROK_URL = "https://XXX.ngrok-free.app"; // Update with your ngrok URL

// GraphQL client function
async function shopifyGraphQLRequest(query, variables = {}) {
  try {
    const response = await axios({
      url: `https://${SHOP}/api/${API_VERSION}/graphql.json`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": ACCESS_TOKEN,
      },
      data: {
        query: query,
        variables: variables,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "GraphQL request failed:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/thank-you", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "thank-you.html"));
});

// Example: Create session endpoint
app.post("/create-session", async (req, res) => {
  console.log("Received create-session request");
  const query = `
    mutation shopPayPaymentRequestSessionCreate($sourceIdentifier: String!, $paymentRequest: ShopPayPaymentRequestInput!) {
      shopPayPaymentRequestSessionCreate(sourceIdentifier: $sourceIdentifier, paymentRequest: $paymentRequest) {
        shopPayPaymentRequestSession {
          token
          sourceIdentifier
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    sourceIdentifier: "demo-order-" + Date.now(),
    paymentRequest: req.body.paymentRequest,
  };

  console.log("Variables:", JSON.stringify(variables, null, 2));

  try {
    const result = await shopifyGraphQLRequest(query, variables);
    console.log("GraphQL response:", JSON.stringify(result, null, 2));
    if (
      result.data &&
      result.data.shopPayPaymentRequestSessionCreate
        .shopPayPaymentRequestSession
    ) {
      res.json(
        result.data.shopPayPaymentRequestSessionCreate
          .shopPayPaymentRequestSession
      );
    } else {
      console.error("Unexpected response structure:", result);
      res.status(500).json({ error: "Unexpected response structure" });
    }
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Example: Submit payment endpoint
app.post("/submit-payment", async (req, res) => {
  console.log("Received submit-payment request");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const query = `
      mutation shopPayPaymentRequestSessionSubmit($token: String!, $paymentRequest: ShopPayPaymentRequestInput!, $idempotencyKey: String!) {
        shopPayPaymentRequestSessionSubmit(token: $token, paymentRequest: $paymentRequest, idempotencyKey: $idempotencyKey) {
          paymentRequestReceipt {
            token
            processingStatusType
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const variables = {
    token: req.body.token,
    paymentRequest: req.body.paymentRequest,
    idempotencyKey: "demo-payment-" + Date.now(),
  };

  console.log("GraphQL variables:", JSON.stringify(variables, null, 2));

  try {
    const result = await shopifyGraphQLRequest(query, variables);
    console.log("Full GraphQL response:", JSON.stringify(result, null, 2));

    if (result.data && result.data.shopPayPaymentRequestSessionSubmit) {
      if (
        result.data.shopPayPaymentRequestSessionSubmit.paymentRequestReceipt
      ) {
        const receipt =
          result.data.shopPayPaymentRequestSessionSubmit.paymentRequestReceipt;
        console.log("Payment request receipt:", receipt);
        res.json({
          success: true,
          processingStatusType: receipt.processingStatusType,
          token: receipt.token,
        });
      } else if (
        result.data.shopPayPaymentRequestSessionSubmit.userErrors.length > 0
      ) {
        console.error(
          "User errors:",
          result.data.shopPayPaymentRequestSessionSubmit.userErrors
        );
        res.status(400).json({
          success: false,
          errors: result.data.shopPayPaymentRequestSessionSubmit.userErrors,
        });
      } else {
        console.error(
          "Unexpected response structure in shopPayPaymentRequestSessionSubmit:",
          result.data.shopPayPaymentRequestSessionSubmit
        );
        res.status(500).json({
          success: false,
          error:
            "Unexpected response structure in shopPayPaymentRequestSessionSubmit",
        });
      }
    } else if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      res.status(500).json({
        success: false,
        error: "GraphQL errors",
        details: result.errors,
      });
    } else {
      console.error("Unexpected response structure:", result);
      res
        .status(500)
        .json({ success: false, error: "Unexpected response structure" });
    }
  } catch (error) {
    console.error("Error submitting payment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit payment",
      details: error.message,
    });
  }
});

app.get("/check-order/:orderId", async (req, res) => {
  const { orderId } = req.params;

  const query = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          displayFinancialStatus
          displayFulfillmentStatus
        }
      }
    `;

  const variables = {
    id: `gid://shopify/Order/${orderId}`,
  };

  try {
    const result = await shopifyGraphQLRequest(query, variables);
    if (result.data && result.data.order) {
      res.json({ success: true, order: result.data.order });
    } else {
      res.status(404).json({ success: false, error: "Order not found" });
    }
  } catch (error) {
    console.error("Error checking order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check order",
      details: error.message,
    });
  }
});

// ... (other endpoints like capture-payment, update-fulfillment, create-refund)

app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Public URL: ${NGROK_URL}`);
});
