import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Animated,
  Text,
  useWindowDimensions,
  Easing,
} from 'react-native';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';

import SignInScreen from './SignInScreen'; // Replace with your actual SignInScreen

const IntroScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [animationDone, setAnimationDone] = useState(false);

  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_700Bold,
  });

  const COLORS = {
    background: '#F5DEB1',
    stripe1: '#E06638',
    stripe2: '#E0B347',
    stripe3: '#88B04B',
    stripe4: '#8C6B46',
  };

  // Animations for logo scaling and initial text appearance.
  const logoScale = useRef(new Animated.Value(0.8)).current;
  // Wipe overlay animation
  const wipeAnim = useRef(new Animated.Value(-width)).current;

  // Interpolate overall intro container opacity based on wipeAnim progress.
  const introOpacity = wipeAnim.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  // Interpolate logo opacity: it stays fully visible until halfway then fades out.
  const logoOpacity = wipeAnim.interpolate({
    inputRange: [-width, -width / 2, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  // Interpolate welcome text opacity similarly.
  const welcomeOpacity = wipeAnim.interpolate({
    inputRange: [-width, -width / 2, 0],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.sequence([
      // 1) Animate logo scaling and initial appearance.
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1000),
      // 2) Animate the wipe overlay moving from off-screen left to off-screen right.
      Animated.timing(wipeAnim, {
        toValue: width,
        duration: 2000, // slower wipe animation
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimationDone(true);
      // Optionally, navigate away or trigger further actions here.
      // For example:
      // navigation.replace('SomeOtherScreen');
    });
  }, [width, logoScale, wipeAnim]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* SignInScreen sits statically in the background */}
      <View style={styles.signInWrapper}>
        <SignInScreen navigation={navigation} />
      </View>

      {/* Render the overlay only when the animation is not done */}
      {!animationDone && (
        <>
          {/* Intro content container */}
          <Animated.View
            style={[styles.introBackgroundContainer, { opacity: introOpacity }]}
          >
            <View style={styles.introContent}>
              <Animated.Image
                source={require('./assets/logo2.png')}
                style={[
                  styles.logo,
                  { transform: [{ scale: logoScale }], opacity: logoOpacity },
                ]}
                resizeMode="contain"
              />
              <Animated.Text style={[styles.welcomeText, { opacity: welcomeOpacity }]}>
                Welcome to EduMap
              </Animated.Text>
            </View>
          </Animated.View>

          {/* Wipe overlay with colored stripes */}
          <Animated.View
            style={[styles.wipeOverlay, { transform: [{ translateX: wipeAnim }] }]}
          >
            <View style={styles.wipeRow}>
              <View style={[styles.stripe, { backgroundColor: COLORS.stripe1 }]} />
              <View style={[styles.stripe, { backgroundColor: COLORS.stripe2 }]} />
              <View style={[styles.stripe, { backgroundColor: COLORS.stripe3 }]} />
              <View style={[styles.elongatedStripe, { backgroundColor: COLORS.stripe4 }]} />
            </View>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5DEB1',
  },
  signInWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  introBackgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5DEB1',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  welcomeText: {
    marginTop: 20,
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
  },
  wipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  wipeRow: {
    flex: 1,
    flexDirection: 'row',
  },
  stripe: {
    flex: 1,
  },
  elongatedStripe: {
    flex: 2,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
});
