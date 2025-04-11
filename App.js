
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Auth & intro screens
import IntroScreen from './IntroScreen';
import SignInScreen from './SignInScreen';
import SignUpScreen from './SignUpScreen';
import InterestsScreen from './InterestsScreen';
import SavedTopicsScreen from './SavedTopicsScreen';

// Your dashboard (exports MainStackNavigator under the hood)
import DashboardScreen from './DashboardScreen';

// The merged mind‑map screen
import MindMapScreen from './MindMapScreen';

// Detail & saved screens
import TopicDetailScreen from './TopicDetailScreen';
import SavedMindMapsScreen from './SavedMindMapsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Intro"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Interests" component={InterestsScreen} />
        {/* DashboardScreen.js’s default export is your MainStackNavigator */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="MindMap" component={MindMapScreen} />
        <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
        <Stack.Screen name="SavedMindMaps" component={SavedMindMapsScreen} />
        <Stack.Screen name="SavedTopics" component={SavedTopicsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
