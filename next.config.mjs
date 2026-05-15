/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // CRITICAL: Tells Next.js to build static files
  // images: {
  //   unoptimized: true, // CRITICAL: Prevents Next.js from crashing on <Image /> tags
  // },
  images:{
    // unoptimized:true,
    remotePatterns:[
      {
        protocol:'https',
        hostname:'videos.foldex.space',
      },
    ]
  }
}

export default nextConfig
