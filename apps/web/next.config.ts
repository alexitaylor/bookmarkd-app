import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	typedRoutes: true,
	reactCompiler: true,
	transpilePackages: ["shiki"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "covers.openlibrary.org",
				pathname: "/b/**",
			},
			{
				protocol: "https",
				hostname: "images.isbndb.com",
				pathname: "/covers/**",
			},
		],
	},
};

export default nextConfig;
