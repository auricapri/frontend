package com.auricapri

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.th3rdwave.safeareacontext.SafeAreaContextPackage
import com.horcrux.svg.SvgPackage
import com.rnfs.RNFSPackage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Ensure react-native-safe-area-context is included
                    add(SafeAreaContextPackage())
                    // Ensure react-native-svg is included
                    add(SvgPackage())
                    // Ensure react-native-fs is included
                    add(RNFSPackage())
                    // Ensure @react-native-async-storage/async-storage is included
                    add(AsyncStoragePackage())
                    // Firebase should be auto-linked by React Native
                    // If not working, it will be handled gracefully in the notification service
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
    }
}

