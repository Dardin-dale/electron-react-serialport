"use strict";
require('dotenv').config()
const builder = require('electron-builder')
const Platform = builder.Platform
const packageJson = require('../../package.json')

const accountId = process.env.KEYGEN_ACCOUNT_ID;
const productId = process.env.KEYGEN_PRODUCT_ID;
const channel = process.env.CHANNEL;
const publish = process.env.PUBLISH;

let options = {
  appId: packageJson.appId,
  artifactName: `${packageJson.name}-setup-${packageJson.version}.exe`,
  productName: packageJson.productName,
  directories: {
    output: 'release-builds',
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: [
          "x64"
        ]
      },
    ],
    icon: "public/assets/icon_256.ico",
  },
  publish: {
    provider: "keygen",
    account: accountId,
    product: productId,
    channel: channel,
  },
  nsis: {
    createDesktopShortcut: 'always',
  },
}

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: options,
  publish: publish,
}).then((res) => {
  console.log(res)
}).catch((e) => {
  console.error(e)
})



