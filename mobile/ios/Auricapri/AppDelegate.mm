#import "AppDelegate.h"

// Import React Native headers - using the same pattern as the test file
// The headers are available through the React-Core framework
#import <React/RCTRootView.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"Auricapri";
  self.initialProps = @{};

  // Create bridge
  self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  
  // Create root view
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge
                                                   moduleName:self.moduleName
                                            initialProperties:self.initialProps];
  rootView.backgroundColor = [UIColor systemBackgroundColor];
  
  // Create root view controller
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  
  // Create window
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  // In Debug, always use local bundle first to ensure app starts reliably
  // Metro bundler can be used for live reloading, but we need the app to start first
  NSURL *localBundleURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  
  if (localBundleURL && [[NSFileManager defaultManager] fileExistsAtPath:[localBundleURL path]]) {
    // Use local bundle - it's always available and ensures the app starts
    return localBundleURL;
  }
  
  // Fallback to Metro if local bundle is not available (shouldn't happen in normal builds)
  NSURL *metroURL = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
  return metroURL;
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
