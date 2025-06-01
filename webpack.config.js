const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: "./src/popup.tsx",
    background: "./extension/background.ts", // Added background script entry
  }, // Updated entry point to include background script
  output: {
    filename: "[name].bundle.js", // Use [name] to differentiate bundles
    path: path.resolve(__dirname, "extension-build"), // Output directory
    clean: true, // Clean the output directory before building
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"], // Resolve these extensions
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader", // Use Babel for transpiling
          options: {
            presets: ["@babel/preset-react", "@babel/preset-typescript"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"], // Handle CSS
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
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "extension/manifest.json", to: "." }, // Copy manifest from extension directory
        // Removed icons folder copy
        // We will include globals.css via the style-loader in the JS bundle
      ],
    }),
  ],
};
