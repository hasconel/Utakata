const Dotenv = require('dotenv-webpack');

module.exports = {
  plugins: [
    // { systemvars: true } を設定するとシステム環境変数も読み込まれるようになる
    new Dotenv({ systemvars: true }),
  ],
};

