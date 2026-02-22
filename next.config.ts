import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.REPO_NAME || '';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: isGithubPages && repoName ? `/${repoName}` : '',
  assetPrefix: isGithubPages && repoName ? `/${repoName}/` : '',
};

export default nextConfig;
