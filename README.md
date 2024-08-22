# Shop Pay simple implementation Using Ngrok and Javascript

This project is a simple Node.js server that interacts with a Shopify store using GraphQL. It uses `axios` for making HTTP requests and `ngrok` for exposing the local server to the internet.

## Project Structure

- `server.js`: Main server file containing the Express application and endpoints.
- `public/index.htm`: Frontend HTML file for the project.

## Prerequisites

- Node.js installed on your machine
- npm (Node Package Manager)
- A Shopify store with API access
- `ngrok` account and installed on your terminal `npm install -g ngrok`

## Installation

1. Clone the repository:

   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install the required dependencies:
   ```sh
   npm install
   ```

## Configuration

1. Open `server.js` and update the following variables with your actual Shopify store details:
   ```javascript
   const SHOP = "XXXX.myshopify.com"; // Replace with your Shopify store
   const ACCESS_TOKEN = "XXXXXX"; // Replace with your actual access token
   const API_VERSION = "2024-07"; // Update this as needed
   const NGROK_URL = "https://XXX.ngrok-free.app"; // Update with your ngrok URL
   ```

## Usage

1. Start the server:

   ```sh
   node server.js
   ```

2. Use `ngrok` to expose your local server to the internet:

   ```sh
   ngrok http --domain=YOUR_PUBLIC_DOMAIN.ngrok-free.app 3000
   ```

3. Access the frontend by opening your ngrok domain in your browser.

## Endpoints

The server provides several endpoints for interacting with the Shopify store. Here are some examples:

- **Capture Payment**: Endpoint to capture a payment.
- **Update Fulfillment**: Endpoint to update the fulfillment status.
- **Create Refund**: Endpoint to create a refund.

## Code Explanation

- **Dependencies**: The code requires `body-parser`, `path`, `ngrok`, and `axios` modules.
- **Express App**: An Express application is created and configured to run on port 3000.
- **Shopify Configuration**: The Shopify store URL, access token, API version, and ngrok URL are defined as constants.
- **GraphQL Client Function**: The `shopifyGraphQLRequest` function makes a POST request to the Shopify GraphQL API using `axios`. It sends the query and variables in the request body and includes the necessary headers for authentication.

## Example GraphQL Request

Here's an example of how to use the `shopifyGraphQLRequest` function to fetch data from your Shopify store:

```javascript
const query = `
  {
    shop {
      name
      primaryDomain {
        url
        host
      }
    }
  }
`;

shopifyGraphQLRequest(query)
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });
```
