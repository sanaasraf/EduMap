import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Alert,
  Pressable,
  Easing,
} from 'react-native';
import AppLoading from 'expo-app-loading';
import { useFonts, Quicksand_400Regular, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebaseconfig';

WebBrowser.maybeCompleteAuthSession();

// Check platform for hover events or mouse events
const isWeb = Platform.OS === 'web';

export default function SignInScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 700;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isPasswordHovered, setIsPasswordHovered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredSocial, setHoveredSocial] = useState('');
  const [activeSocial, setActiveSocial] = useState('');
  const [createHovered, setCreateHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // New state for showing "Signing in" message
  const [signingIn, setSigningIn] = useState(false);

  const [fontsLoaded] = useFonts({ Quicksand_400Regular, Quicksand_700Bold });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  // Create animation refs for fade and flip effect.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current; // Value from 0 (start) to 1
  const imageFadeAnim = useRef(new Animated.Value(1)).current;

  const slideshowImages = [
    require('./assets/slideshowimage1.png'),
    require('./assets/slideshowimage2.png'),
    require('./assets/slideshowimage3.png'),
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Enhanced animation: fade in and flip from 90deg (Y-axis) to 0deg.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Slideshow animation remains unchanged.
  useEffect(() => {
    const intervalId = setInterval(() => {
      Animated.timing(imageFadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
        Animated.timing(imageFadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const signInWithGoogle = async () => {
      if (response?.type === 'success') {
        const { id_token, access_token } = response.authentication;
        const credential = GoogleAuthProvider.credential(id_token, access_token);
        try {
          const userCredential = await signInWithCredential(auth, credential);
          const uid = userCredential.user.uid;
          const userDocRef = doc(db, 'users', uid);
          const userDocSnap = await getDoc(userDocRef);
          let userData = userDocSnap.exists() ? userDocSnap.data() : {};
          navigation.navigate('Dashboard', { userData });
        } catch (error) {
          Alert.alert('Google Sign In Error', error.message);
        }
      }
    };
    signInWithGoogle();
  }, [response]);

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setSignInError('Please enter your email and password.');
      return;
    }
    // Start signing in; show the message.
    setSigningIn(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      let userData = userDocSnap.exists() ? userDocSnap.data() : {};
      setSignInError('');
      setSigningIn(false);
      navigation.navigate('Dashboard', { userData });
    } catch (error) {
      let message = 'Sorry, your email/password is incorrect, try again!';
      if (error.code === 'auth/user-not-found') {
        message = 'No user found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Sorry, your email/password is incorrect, try again!';
      }
      setSignInError(message);
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = () => {
    setActiveSocial('google');
    promptAsync();
  };

  const handleMicrosoftSignIn = () => {
    setActiveSocial('microsoft');
    console.log('Microsoft sign in');
  };

  const handleAppleSignIn = () => {
    setActiveSocial('apple');
    console.log('Apple sign in');
  };

  const handleCreateAccount = () => navigation.navigate('SignUp');

  if (!fontsLoaded) return <AppLoading />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [
                { perspective: 1000 },
                {
                  rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['90deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.rowContainer, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
              <View style={styles.leftColumn}>
                <View style={styles.topLogoContainerFixed}>
                  <Animated.Image
                    source={require('./assets/logo.png')}
                    style={[styles.tinyLogoBigger, { transform: [{ scale: fadeAnim }] }]}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.signInBox}>
                  <Text style={styles.title}>Welcome to EduMap</Text>
                  <View style={styles.emailSignInContainer}>
                    {/* Email Input */}
                    <Pressable
                      onMouseEnter={isWeb ? () => setIsEmailHovered(true) : undefined}
                      onMouseLeave={isWeb ? () => setIsEmailHovered(false) : undefined}
                    >
                      <TextInput
                        style={[
                          styles.input,
                          (isEmailFocused || (isEmailHovered && isWeb)) && styles.inputHovered,
                        ]}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </Pressable>

                    {/* Password Input */}
                    <View style={styles.passwordContainer}>
                      <Pressable
                        onMouseEnter={isWeb ? () => setIsPasswordHovered(true) : undefined}
                        onMouseLeave={isWeb ? () => setIsPasswordHovered(false) : undefined}
                        style={{ width: '100%' }}
                      >
                        <TextInput
                          style={[
                            styles.input,
                            { paddingRight: 50 },
                            (isPasswordFocused || (isPasswordHovered && isWeb)) && styles.inputHovered,
                          ]}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          placeholder="Password"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                        />
                      </Pressable>
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                      </Pressable>
                    </View>

                    {signingIn && (
                      <Text style={styles.signingInText}>Signing you in...</Text>
                    )}

                    {signInError !== '' && <Text style={styles.errorText}>{signInError}</Text>}

                    <Pressable
                      onMouseEnter={isWeb ? () => setIsHovered(true) : undefined}
                      onMouseLeave={isWeb ? () => setIsHovered(false) : undefined}
                      onPress={handleEmailSignIn}
                      style={[styles.emailButton, isHovered && isWeb && styles.emailButtonHovered]}
                    >
                      <Text style={styles.emailButtonText}>Sign In with Email</Text>
                    </Pressable>
                  </View>

                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialButtonsWrapper}>
                    {/* Google */}
                    <Pressable
                      onMouseEnter={isWeb ? () => setHoveredSocial('google') : undefined}
                      onMouseLeave={isWeb ? () => setHoveredSocial('') : undefined}
                      onPress={handleGoogleSignIn}
                      disabled={!request}
                      style={[
                        styles.socialButton,
                        styles.googleButton,
                        (hoveredSocial === 'google' || activeSocial === 'google') && isWeb && styles.googleButtonHovered,
                      ]}
                    >
                      <View style={styles.socialButtonInner}>
                        <Image source={require('./assets/google_logo.webp')} style={[styles.socialIcon, styles.googleLogo]} />
                        <Text style={styles.socialButtonText}>Google</Text>
                      </View>
                    </Pressable>

                    {/* Microsoft */}
                    <Pressable
                      onMouseEnter={isWeb ? () => setHoveredSocial('microsoft') : undefined}
                      onMouseLeave={isWeb ? () => setHoveredSocial('') : undefined}
                      onPress={handleMicrosoftSignIn}
                      style={[
                        styles.socialButton,
                        styles.microsoftButton,
                        (hoveredSocial === 'microsoft' || activeSocial === 'microsoft') && isWeb && styles.microsoftButtonHovered,
                      ]}
                    >
                      <View style={styles.socialButtonInner}>
                        <Image source={require('./assets/microsoft_logo.png')} style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Microsoft</Text>
                      </View>
                    </Pressable>

                    {/* Apple */}
                    <Pressable
                      onMouseEnter={isWeb ? () => setHoveredSocial('apple') : undefined}
                      onMouseLeave={isWeb ? () => setHoveredSocial('') : undefined}
                      onPress={handleAppleSignIn}
                      style={[
                        styles.socialButton,
                        styles.appleButton,
                        (hoveredSocial === 'apple' || activeSocial === 'apple') && isWeb && styles.appleButtonHovered,
                      ]}
                    >
                      <View style={styles.socialButtonInner}>
                        <Image source={require('./assets/apple_logo.png')} style={[styles.socialIcon, styles.appleLogo]} />
                        <Text style={styles.socialButtonTextLight}>Apple</Text>
                      </View>
                    </Pressable>
                  </View>

                  <View style={styles.createAccountContainerAdjusted}>
                    <Text style={styles.noAccountText}>Don't have an account?</Text>
                    <Pressable
                      onMouseEnter={isWeb ? () => setCreateHovered(true) : undefined}
                      onMouseLeave={isWeb ? () => setCreateHovered(false) : undefined}
                      onPress={handleCreateAccount}
                    >
                      <Text style={[styles.createAccountText, createHovered && isWeb && styles.createAccountTextHovered]}>
                        Create one here
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.rightColumn}>
                <View style={styles.slideshowContainer}>
                  <Animated.Image
                    source={slideshowImages[currentSlide]}
                    style={[styles.slideshowImage, { opacity: imageFadeAnim }]}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5deb1' },
  animatedContainer: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  rowContainer: { flex: 1 },
  leftColumn: { flex: 1, paddingVertical: 40, paddingHorizontal: 40, alignItems: 'flex-start' },
  topLogoContainerFixed: { marginBottom: 20, alignSelf: 'flex-start' },
  tinyLogoBigger: { width: 120, height: 120 },
  signInBox: { width: '100%', maxWidth: 420, alignSelf: 'center', marginTop: -20 },
  title: { fontSize: 40, fontFamily: 'Quicksand_700Bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  emailSignInContainer: { marginBottom: 10 },
  input: {
    height: 58,
    borderColor: '#5c4033',
    borderWidth: 2,
    borderRadius: 30,
    paddingHorizontal: 22,
    marginVertical: 10,
    fontFamily: 'Quicksand_400Regular',
    fontSize: 16,
    backgroundColor: '#f0f4ff',
    color: '#000',
  },
  inputHovered: { borderWidth: 3 },
  passwordContainer: { position: 'relative', width: '100%' },
  eyeIcon: { position: 'absolute', right: 20, top: '50%', transform: [{ translateY: -12 }] },
  emailButton: {
    backgroundColor: '#3f322f',
    height: 55,
    borderRadius: 30,
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailButtonHovered: { backgroundColor: '#df8e35' },
  emailButtonText: { fontFamily: 'Quicksand_400Regular', fontSize: 16, color: '#fff' },
  errorText: { color: '#ff3b30', fontFamily: 'Quicksand_400Regular', fontSize: 14, marginTop: 4, textAlign: 'center' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ccc' },
  dividerText: { marginHorizontal: 14, fontFamily: 'Quicksand_400Regular', fontSize: 15, color: '#666' },
  socialButtonsWrapper: { width: '100%', marginBottom: 15 },
  socialButton: {
    height: 55,
    borderRadius: 30,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  socialButtonInner: { flexDirection: 'row', alignItems: 'center' },
  socialIcon: { width: 26, height: 26, marginRight: 12 },
  googleLogo: { width: 30, height: 30 },
  appleLogo: { marginLeft: 2 },
  googleButton: { backgroundColor: '#ffffff', borderColor: '#EA4335', borderWidth: 1 },
  googleButtonHovered: { borderColor: '#EA4335', borderWidth: 2 },
  microsoftButton: { backgroundColor: '#ffffff', borderColor: '#0078D4', borderWidth: 1 },
  microsoftButtonHovered: { borderColor: '#005A9E', borderWidth: 2 },
  appleButton: { backgroundColor: '#ffffff', borderColor: '#000', borderWidth: 1 },
  appleButtonHovered: { borderColor: '#000', borderWidth: 2 },
  socialButtonText: { fontFamily: 'Quicksand_400Regular', fontSize: 16, color: '#333' },
  socialButtonTextLight: { fontFamily: 'Quicksand_400Regular', fontSize: 16, color: '#000' },
  createAccountContainerAdjusted: { flexDirection: 'row', marginTop: 10, justifyContent: 'center' },
  noAccountText: { fontSize: 15, fontFamily: 'Quicksand_400Regular', color: '#333' },
  createAccountText: { fontSize: 15, fontFamily: 'Quicksand_400Regular', color: '#007BFF', marginLeft: 6, textDecorationLine: 'underline' },
  createAccountTextHovered: { color: '#5c4033' },
  rightColumn: { flex: 1, padding: 0 },
  slideshowContainer: { flex: 1 },
  slideshowImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  signingInText: { color: '#333', fontFamily: 'Quicksand_400Regular', fontSize: 16, textAlign: 'center', marginTop: 8 },
});
