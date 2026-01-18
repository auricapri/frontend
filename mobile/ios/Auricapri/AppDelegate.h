#import <UIKit/UIKit.h>

@class RCTBridge;
@protocol RCTBridgeDelegate;

@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, strong) NSString *moduleName;
@property (nonatomic, strong) NSDictionary *initialProps;

@end
