const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: "./extension/popup.js", // Updated entry point to the new vanilla JS file
  },
  output: {
    filename: "[name].bundle.js", // Use [name] to differentiate bundles
    path: path.resolve(__dirname, "extension-build"), // Output directory
    clean: true, // Clean the output directory before building
  },
  resolve: {
    extensions: [".js", ".jsx"], // Resolve these extensions - removed .tsx, .ts
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // Updated test to only include js/jsx
        exclude: /node_modules/,
        use: {
          loader: "babel-loader", // Use Babel for transpiling
          options: {
            presets: ["@babel/preset-react"], // Removed @babel/preset-typescript
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"], // Simplified CSS handling, removed postcss-loader if not used
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource", // Handle images
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./extension/popup.html", // Use your existing popup.html as a template
      filename: "popup.html", // Output filename in the build directory
      chunks: ["popup"], // Add this line to include only the popup chunk
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "extension/manifest.json", to: "." }, // Copy manifest from extension directory
        { from: "extension/lib", to: "lib" }, // Copy PDF.js library files
        { from: "extension/popup.css", to: "." }, // Copy popup.css
        // Removed icons folder copy
        // We will include globals.css via the style-loader in the JS bundle
      ],
    }),
  ],
};
