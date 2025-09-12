// src/utils/shopifyClient.js

import axios from "axios";

export const shopifyRequest = async (shopDomain, accessToken, endpoint) => {
  // Use a recent, stable API version
  const apiVersion = "2024-10";
  const url = `https://${shopDomain}/admin/api/${apiVersion}/${endpoint}`;

  console.log(`🚀 Making Shopify API request to: ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    // Log the detailed error from Shopify
    console.error("❌ Shopify API Error Response:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      console.error("Request Error: No response received.", error.request);
    } else {
      console.error("Axios Error:", error.message);
    }
    // Re-throw the error so the controller's catch block can handle it
    throw error;
  }
};