const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

require('dotenv').config();

module.exports = (_env, argv) => ({
  entry: path.resolve(__dirname, 'src/index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/[name].[contenthash:8].js',
    chunkFilename: 'assets/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public/imagebag.jpg'),
          to: 'imagebag.jpg',
        },
        {
          from: path.resolve(__dirname, 'public/images3D'),
          to: 'images3D',
        },
        {
          from: path.resolve(__dirname, 'public/treeModels'),
          to: 'treeModels',
          globOptions: {
            ignore: [
              '**/birch.glb',
              '**/country.glb',
              '**/ho.glb',
              '**/treeg.glb',
              '**/trees.glb',
            ],
          },
        },
      ],
    }),
    new webpack.DefinePlugin({
      __API_BASE_URL__: JSON.stringify(
        (process.env.API_BASE_URL || '').replace(/\/$/, '')
      ),
      // Demo is the safe default. Set DEMO_MODE=false for the real API contour.
      __DEMO_MODE__: JSON.stringify(process.env.DEMO_MODE !== 'false'),
    }),
  ],
  devServer: {
    port: 8099,
    historyApiFallback: true,
    hot: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    ],
  },
  optimization: {
    splitChunks: { chunks: 'all' },
    runtimeChunk: 'single',
  },
  performance: {
    hints: 'warning',
    maxAssetSize: 750000,
    maxEntrypointSize: 750000,
  },
  devtool: argv.mode === 'production' ? 'source-map' : 'eval-source-map',
});
