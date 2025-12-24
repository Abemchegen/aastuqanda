require("dotenv").config();
const { createApp } = require("./app");
const { isConfigured: cloudinaryConfigured } = require("./services/cloudinary");

function start() {
  try {
    const app = createApp();
    const port = process.env.PORT || 4000;

    app.listen(port, () => {
      console.log(`API server listening on http://localhost:${port}/api`);
      if (!cloudinaryConfigured()) {
        console.warn(
          "[warn] Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
        );
      }
    });
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

start();
