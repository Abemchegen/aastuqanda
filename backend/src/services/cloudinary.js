const cloudinary = require("cloudinary").v2;

function isConfigured() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  return Boolean(
    CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
  );
}

function configure() {
  if (!isConfigured()) {
    return false;
  }
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

function getFolder(sub = "") {
  const base = process.env.CLOUDINARY_UPLOAD_FOLDER || "campusloop";
  return sub ? `${base}/${sub}` : base;
}

async function uploadBuffer(buffer, mimetype, folder) {
  if (!configure()) {
    throw new Error(
      "Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
  const base64 = buffer.toString("base64");
  const dataUri = `data:${
    mimetype || "application/octet-stream"
  };base64,${base64}`;
  const res = await cloudinary.uploader.upload(dataUri, {
    folder: folder || getFolder(),
    overwrite: false,
  });
  return res; // contains secure_url, public_id, etc.
}

module.exports = { uploadBuffer, getFolder, isConfigured };
