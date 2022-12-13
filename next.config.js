/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  images: {
    remotePatterns:[
      {
        protocol:'https',
        hostname:'firebasestorage.googleapis.com'
      }
    ]
  },
  optimizeFonts: false,
}
