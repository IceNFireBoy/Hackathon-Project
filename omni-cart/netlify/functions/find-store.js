// netlify/functions/find-store.js

// Securely load the local mock database
const storesDb = require('./inventory.json');

// Haversine formula to calculate straight-line distance in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

exports.handler = async function (event, context) {
  // 1. CORS Setup
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const payload = JSON.parse(event.body);
    const { userLocation, requiredComponents } = payload;

    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      throw new Error("User geolocation is missing from the payload.");
    }
    if (!requiredComponents || !Array.isArray(requiredComponents) || requiredComponents.length === 0) {
      throw new Error("No components provided for matching.");
    }

    // Extract just the names and normalize to lowercase for matching
    const requiredNames = requiredComponents.map(comp => comp.name.toLowerCase());
    const totalRequired = requiredNames.length;

    let qualifiedStores = [];

    // 2. Filter stores based on the 80% inventory threshold
    storesDb.forEach(store => {
      // Find how many required parts exist in this store's inventory
      const matchCount = requiredNames.filter(part => store.inventory.includes(part)).length;
      const matchPercentage = matchCount / totalRequired;

      if (matchPercentage >= 0.8) {
        // Calculate distance from user to store
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng, 
          store.location.lat, store.location.lng
        );

        qualifiedStores.push({
          ...store,
          matchPercentage: (matchPercentage * 100).toFixed(1) + "%",
          missingParts: requiredNames.filter(part => !store.inventory.includes(part)),
          distanceKm: distance
        });
      }
    });

    // 3. Handle edge case: No stores meet the 80% threshold
    if (qualifiedStores.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "No local stores carry at least 80% of your required parts." })
      };
    }

    // 4. Sort the qualifying stores by distance (closest first)
    qualifiedStores.sort((a, b) => a.distanceKm - b.distanceKm);

    // 5. Return the absolute closest store that passed the threshold
    const optimalStore = qualifiedStores[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "success",
        optimalStore: optimalStore
      }),
    };

  } catch (error) {
    console.error("Store Router Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};