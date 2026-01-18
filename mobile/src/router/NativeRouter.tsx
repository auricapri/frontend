/**
 * Native Router - React Navigation
 * Adapts the web router to React Navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View } from './routes';
import { HomePage, HomePageProps } from '../pages/HomePage';
// TODO: Import other pages as they are created
// import { ProductPage } from '../pages/ProductPage';
// import { CollectionPage } from '../pages/CollectionPage';
// etc.

const Stack = createStackNavigator();

interface NativeRouterProps {
  currentView: View;
  // Props for each screen
  homeProps?: HomePageProps; // We can improve this if we have a type for HomeProps
  productProps?: Record<string, unknown>;
  collectionProps?: Record<string, unknown>;
  checkoutProps?: Record<string, unknown>;
  adminProps?: Record<string, unknown>;
  aboutProps?: Record<string, unknown>;
  receiptProps?: Record<string, unknown>;
}

export const NativeRouter: React.FC<NativeRouterProps> = ({
  currentView,
  homeProps,
  productProps: _productProps,
  collectionProps: _collectionProps,
  checkoutProps: _checkoutProps,
  adminProps: _adminProps,
  aboutProps: _aboutProps,
  receiptProps: _receiptProps,
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
        initialRouteName={currentView === 'home' ? 'Home' : 'Home'}
      >
        <Stack.Screen name="Home">
          {_props => homeProps ? <HomePage {...homeProps} /> : null}
        </Stack.Screen>
        {/* TODO: Add other screens */}
        {/* <Stack.Screen name="Product">
          {props => _productProps ? <ProductPage {..._productProps} /> : null}
        </Stack.Screen>
        <Stack.Screen name="Collection">
          {props => _collectionProps ? <CollectionPage {..._collectionProps} /> : null}
        </Stack.Screen>
        etc. */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

