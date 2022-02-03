/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  future: {
    webpack5: true, // By default, if you customize webpack config, they switch back to version 4. (backward compatibility?)
  },
  webpack(config) {
    // eslint-disable-next-line no-param-reassign
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // https://stackoverflow.com/a/67478653/470749
    };

    return config;
  },
};
