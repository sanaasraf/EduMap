import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Pressable,
  Easing,
} from 'react-native';
import { useFonts, Quicksand_400Regular, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import AppLoading from 'expo-app-loading';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseconfig';

// Check platform for hover events
const isWeb = Platform.OS === 'web';

export default function SignUpScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 700;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [hoveredInput, setHoveredInput] = useState('');

  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_700Bold,
  });

  // Animation refs for fade and flip effect.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current; // Value goes from 0 to 1.
  const imageFadeAnim = useRef(new Animated.Value(1)).current;

  const slideshowImages = [
    require('./assets/slideshowimage1.png'),
    require('./assets/slideshowimage2.png'),
    require('./assets/slideshowimage3.png'),
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Enhanced initial animation: fade in and flip from -90° on Y‑axis to 0°.
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
    }, 2500);
    return () => clearInterval(intervalId);
  }, []);

  const handleSignUp = async () => {
    setErrorMessage('');

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setErrorMessage('Sorry, please fill all the fields and try again!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Sorry, please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Sorry, passwords don't match. Please check and try again!");
      return;
    }

    try {
      // Create the user directly with Firebase:
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      const uid = userCredential.user.uid;

      // Store user data in Firestore
      await setDoc(doc(db, 'users', uid), {
        firstName,
        lastName,
        email: email.trim(),
        createdAt: new Date(),
        profileImage: 'https://example.com/default-profile.png',
      });

      // Navigate to Dashboard on success
      navigation.navigate('Interests');
    } catch (error) {
      // Print the error to console for debugging
      console.log('Error code:', error.code);

      // Switch over known error codes
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrorMessage('Sorry, this email is already associated with an account. Log in with your details!');
          break;
        case 'auth/invalid-email':
          setErrorMessage('This email address appears invalid. Please try again with a valid email.');
          break;
        case 'auth/weak-password':
          setErrorMessage('Your password is too weak. Please try a stronger one!');
          break;
        default:
          // Provide a fallback for unknown errors
          setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleGoToLogin = () => navigation.navigate('SignIn');

  if (!fontsLoaded) return <AppLoading />;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [
                { perspective: 1000 }, // Required for 3D transforms
                {
                  rotateY: flipAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['-90deg', '0deg'],
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
                  <Text style={styles.title}>Create an Account</Text>

                  {['firstName', 'lastName', 'email', 'password', 'confirmPassword'].map((field) => {
                    const valueMap = {
                      firstName,
                      lastName,
                      email,
                      password,
                      confirmPassword,
                    };
                    const setterMap = {
                      firstName: setFirstName,
                      lastName: setLastName,
                      email: setEmail,
                      password: setPassword,
                      confirmPassword: setConfirmPassword,
                    };

                    return (
                      <Pressable
                        key={field}
                        // For iPad, do nothing on hover; for web, track hover
                        onMouseEnter={isWeb ? () => setHoveredInput(field) : undefined}
                        onMouseLeave={isWeb ? () => setHoveredInput('') : undefined}
                      >
                        <TextInput
                          style={[
                            styles.input,
                            hoveredInput === field && isWeb && styles.inputHovered,
                          ]}
                          placeholder={field
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase())}
                          placeholderTextColor="#666"
                          value={valueMap[field]}
                          onChangeText={(text) => setterMap[field](text)}
                          secureTextEntry={field.toLowerCase().includes('password')}
                          autoCapitalize={field.includes('Name') ? 'words' : 'none'}
                          keyboardType={field === 'email' ? 'email-address' : 'default'}
                        />
                      </Pressable>
                    );
                  })}

                  {errorMessage ? (
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  ) : null}

                  <Pressable
                    // For iPad, no hover; for web, change style on hover
                    onMouseEnter={isWeb ? () => setIsHovered(true) : undefined}
                    onMouseLeave={isWeb ? () => setIsHovered(false) : undefined}
                    onPress={handleSignUp}
                    style={[styles.emailButton, isHovered && isWeb && styles.emailButtonHovered]}
                  >
                    <Text style={styles.emailButtonText}>Sign Up</Text>
                  </Pressable>

                  <View style={styles.createAccountContainerAdjusted}>
                    <Text style={styles.noAccountText}>Already have an account?</Text>
                    <Pressable
                      onMouseEnter={isWeb ? () => setLoginHovered(true) : undefined}
                      onMouseLeave={isWeb ? () => setLoginHovered(false) : undefined}
                      onPress={handleGoToLogin}
                    >
                      <Text
                        style={[
                          styles.createAccountText,
                          loginHovered && isWeb && styles.createAccountTextHovered,
                        ]}
                      >
                        Log in
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
  signInBox: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  title: {
    fontSize: 40,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
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
  errorText: {
    color: '#b00020',
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  createAccountContainerAdjusted: { flexDirection: 'row', marginTop: 30, justifyContent: 'center' },
  noAccountText: { fontSize: 15, fontFamily: 'Quicksand_400Regular', color: '#333' },
  createAccountText: {
    fontSize: 15,
    fontFamily: 'Quicksand_400Regular',
    color: '#007BFF',
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  createAccountTextHovered: { color: '#5c4033' },
  rightColumn: { flex: 1, padding: 0 },
  slideshowContainer: { flex: 1 },
  slideshowImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});
