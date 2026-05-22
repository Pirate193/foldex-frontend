/** @type {import('next').NextConfig} */
const nextConfig = {
  // CRITICAL: Tells Next.js to build static files
  // output: 'export', 
  images:{
    // CRITICAL: Prevents Next.js from crashing on <Image /> tags
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
