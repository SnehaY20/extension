const path = require("path");

module.exports = {
  mode: "development", // or 'production'
  entry: "./extension/popup.js", // Entry point for your popup script
  output: {
    path: path.resolve(__dirname, "extension"), // Output directory within the extension folder
    filename: "popup.bundle.js", // Bundled output file name
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
};
