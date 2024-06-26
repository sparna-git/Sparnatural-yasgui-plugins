// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProduction = process.env.NODE_ENV == "production";

const stylesHandler = "style-loader";

const config = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "./dev-page"),
    },
    hot: true,
    open: ["/dev-page"],
  },
  devtool: "source-map",
  plugins: [
    new HtmlWebpackPlugin({
      filename: "dev-page/index.html",
      template: __dirname + "/dev-page/index.html",
      inject: "body",
    }),

    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, "css-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [stylesHandler, "css-loader", "sass-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        // /!\ this tells Webpack 5 to inline the image as base64 inside the javascript
        // see https://webpack.js.org/guides/asset-modules/#inlining-assets
        type: "asset/inline",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }

  config.optimization = {
    minimize: true,
  };

  config.output = {
    library: {
      name: "SparnaturalYasguiPlugins",
      type: "umd",
    },
    filename: "sparnatural-yasgui-plugins.js",
  };

  return config;
};
