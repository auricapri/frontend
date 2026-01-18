// Mock for react-native-fs on web
export default {
  DocumentDirectoryPath: '/',
  downloadFile: () => ({
    promise: Promise.resolve({ statusCode: 200 }),
  }),
};

