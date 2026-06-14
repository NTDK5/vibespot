const appJson = require('./app.json');

/** @type {import('@expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...appJson.expo,
  ...config,
  plugins: [
    ...(appJson.expo.plugins || []),
    './plugins/withGoogleAuthScheme.js',
  ],
});
