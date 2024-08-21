const { shopifyGraphQLRequest } = require("./server");

async function reconcileOrders() {
  const query = `
    query {
      orders(first: 10, query: "created_at:>=2023-01-01") {
        edges {
          node {
            id
            name
            sourceIdentifier
            email
            billingAddress {
              firstName
              lastName
              address1
              address2
              city
              provinceCode
              countryCodeV2
              phone
            }
            customer {
              firstName
              lastName
              phone
            }
            transactions(first: 25) {
              id
              kind
              authorizationCode
              authorizationExpiresAt
              amountSet {
                shopMoney {
                  amount
                }
              }
              status
              formattedGateway
            }
            fulfillmentOrders(first: 5) {
              edges {
                node {
                  id
                  createdAt
                  fulfillBy
                  status
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await shopifyGraphQLRequest(query);
    const orders = result.data.orders.edges.map((edge) => edge.node);

    for (const order of orders) {
      console.log(`Processing order: ${order.name}`);

      const successfulAuth = order.transactions.find(
        (t) => t.kind === "AUTHORIZATION" && t.status === "SUCCESS"
      );

      if (successfulAuth) {
        console.log(`Successful authorization found for order ${order.name}`);
        // Implement your logic here (e.g., update your system, capture payment if needed)
      } else {
        console.log(
          `No successful authorization found for order ${order.name}`
        );
        // Handle cases where there's no successful authorization
      }

      // Check fulfillment status
      const fulfillmentStatus = order.fulfillmentOrders.edges[0]?.node.status;
      console.log(
        `Fulfillment status for order ${order.name}: ${fulfillmentStatus}`
      );
      // Implement your fulfillment logic based on the status
    }
  } catch (error) {
    console.error("Error in reconciliation job:", error);
  }
}

// Run the reconciliation job every hour
setInterval(reconcileOrders, 60 * 60 * 1000);

// Run immediately on startup
reconcileOrders();

module.exports = { reconcileOrders };
