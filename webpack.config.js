const path = require('path');

module.exports = {
  entry: './server.js', // 你的入口文件
  output: {
    filename: 'index.js', // 打包后的文件名
    path: path.resolve(__dirname, 'dist'), // 输出目录
  },
  target: 'node', // 目标环境为 Node.js
  mode: 'production', // 或 'development' 根据需求选择
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
