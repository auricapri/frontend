// Mock for @react-native-firebase/messaging on web
const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

const mockMessaging = () => ({
  requestPermission: async () => AuthorizationStatus.AUTHORIZED,
  getToken: async () => 'web-mock-token',
  onMessage: () => () => {},
  onNotificationOpenedApp: () => {},
  getInitialNotification: async () => null,
  deleteToken: async () => {},
  AuthorizationStatus,
});

export default mockMessaging;

