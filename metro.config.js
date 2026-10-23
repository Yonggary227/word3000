// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 한글을 \uXXXX로 바꾸지 않고 그대로 둔다 (단어 데이터가 대부분 한글이라 파일이 약 2배로 커지는 것을 막음)
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  output: { ...config.transformer.minifierConfig?.output, ascii_only: false },
};

module.exports = config;
