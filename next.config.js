/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    REACT_APP_BUCKET_ID: "64848d260bbc1991fc66",
    REACT_APP_PROJECT: "642bf5b7bb1dc99d8f5d",
    REACT_APP_DATABASE_ID: "647bf03bb0c2db9a14b9",
    REACT_APP_COLLECTION_ID: "647bf054359e2775fead",
    REACT_APP_USERCOLLECTION_ID: "648578143143fcd6efca",
    REACT_APP_ENDPOINT: "http://192.168.10.114/v1",
    REACT_APP_USERTHUMBNAIL_BUCKET_ID: "648d59d69211ca025769",
  },
  images: {
    remotePatterns: [
      {
        hostname: "192.168.10.114",
      },
    ],
  },
};

module.exports = nextConfig;
