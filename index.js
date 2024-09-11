const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const app = express();
const port = 4444;

const ACCESS_KEY = process.env.API_KEY;
let images = [];

async function getUnsplashImages() {
  let fetchedImages = [];
  while (fetchedImages.length < 100) {
    try {
      const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${ACCESS_KEY}&count=30`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format");
      }
      const imageUrls = data.map((photo) => `${photo.urls.raw}&w=350`);
      fetchedImages = [...fetchedImages, ...imageUrls];
    } catch (error) {
      console.error("Error fetching images:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  fetchedImages = fetchedImages.slice(0, 100); // Ensure exactly 100 images
  console.log(`Fetched ${fetchedImages.length} images from Unsplash`);
  images = fetchedImages;
}

getUnsplashImages();

let requestId = 0;

// Enable CORS for all endpoints
app.use(cors());

app.get("/images", (req, res) => {
  // Get page number and page size from query parameters, default to 1 and 10
  let page = parseInt(req.query.page) || 1;
  let pageSize = parseInt(req.query.pageSize) || 10;

  // Calculate start and end indices
  let startIndex = (page - 1) * pageSize;
  let endIndex = startIndex + pageSize;

  // Create a paginated list of images
  let paginatedImages = images.slice(startIndex, endIndex);

  // If the end index is greater than the length of the list, wrap around
  if (paginatedImages.length < pageSize) {
    paginatedImages = paginatedImages.concat(images.slice(0, pageSize - paginatedImages.length));
  }

  // Increment requestId
  requestId++;

  // Log for debugging
  console.log(
    `Request ID: ${requestId}, Page: ${page}, PageSize: ${pageSize}, Images returned: ${paginatedImages.length}`
  );

  // Send response
  res.json({
    requestId: requestId,
    page: page,
    pageSize: pageSize,
    images: paginatedImages,
  });
});

app.listen(port, () => {
  console.log(`Image API listening at http://localhost:${port}`);
});
