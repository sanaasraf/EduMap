// DashboardScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import AppLoading from 'expo-app-loading';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Firebase imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from './firebaseconfig'; // Ensure this path/filename is correct


WebBrowser.maybeCompleteAuthSession();

// ------------------------
// DashboardMainScreen: File Uploader Tab
// ------------------------
const DashboardMainScreen = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);  // Array of file info
  const [uploadURLs, setUploadURLs] = useState([]);          // Array of download URLs
  const [uploading, setUploading] = useState(false);

  // Helper function for mobile: Convert file URI to Blob using XMLHttpRequest
  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new Error('uriToBlob failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  const pickDocuments = async () => {
    try {
      console.log("Picker button pressed");
      const options = {
        multiple: true,
        type: [
          "image/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      };

      const result = await DocumentPicker.getDocumentAsync(options);
      console.log("Picker result:", result);

      if (result.canceled) {
        console.log("User canceled the picker.");
        return;
      }

      let files = [];
      if (Platform.OS === 'web') {
        if (result.output && result.output.length > 0) {
          files = Array.from(result.output);
        }
      } else {
        if (result.assets && result.assets.length > 0) {
          files = result.assets;
        } else if (result.uri) {
          files = [result];
        }
      }

      console.log("Total files selected:", files.length);
      if (files.length > 5) {
        Alert.alert(
          "File Limit Exceeded",
          "You have selected more than 5 files. Only the first 5 will be processed.",
          [{ text: "OK" }]
        );
      }

      files = files.slice(0, 5);
      console.log("Files to be uploaded:", files);
      setUploading(true);
      setSelectedFiles(files);

      const downloadURLs = [];
      for (const file of files) {
        let fileName = file.name || result.name; // Use file.name if available
        let fileUri = file.uri;
        if (Platform.OS === 'web') {
          console.log("Web file object:", file);
          const storageRef = ref(storage, `uploads/${fileName}`);
          console.log("Uploading file to: uploads/" + fileName);
          const snapshot = await uploadBytes(storageRef, file);
          console.log("Web upload success:", snapshot);
          const url = await getDownloadURL(storageRef);
          console.log("Web download URL:", url);
          downloadURLs.push(url);
        } else {
          if (!fileUri && file.output && file.output.length > 0) {
            fileUri = file.output[0].uri;
          }
          if (!fileUri && file.assets && file.assets.length > 0) {
            fileUri = file.assets[0].uri;
          }
          if (fileUri) {
            console.log("Mobile file URI:", fileUri);
            const fileBlob = await uriToBlob(fileUri);
            const storageRef = ref(storage, `uploads/${fileName}`);
            console.log("Uploading file to: uploads/" + fileName);
            const snapshot = await uploadBytes(storageRef, fileBlob);
            console.log("Mobile upload success:", snapshot);
            const url = await getDownloadURL(storageRef);
            console.log("Mobile download URL:", url);
            downloadURLs.push(url);
          } else {
            console.error("No URI found for file:", file);
          }
        }
      }
      setUploadURLs(downloadURLs);
      setUploading(false);
    } catch (error) {
      console.error("DocumentPicker Error:", error);
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome to Your Dashboard</Text>
        </View>
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocuments}>
            <Text style={styles.uploadButtonText}>Choose Files (up to 5)</Text>
          </TouchableOpacity>
          {selectedFiles.length > 0 && (
            <View style={styles.fileList}>
              {selectedFiles.map((file, index) => (
                <Text key={index} style={styles.fileName}>
                  {file.name || `File ${index + 1}`}
                </Text>
              ))}
            </View>
          )}
          {uploading && <Text style={styles.fileName}>Uploading...</Text>}
          {uploadURLs.length > 0 && (
            <View style={styles.fileList}>
              {uploadURLs.map((url, index) => (
                <Text key={index} style={styles.fileName}>
                  Download URL {index + 1}: {url}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ------------------------
// ProfileScreen: Profile Tab with Image Management
// ------------------------
const ProfileScreen = () => {
  // Use a default admin image from assets (adminpic.png)
  const [profileImage, setProfileImage] = useState(require('./assets/adminpic.png'));
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });
  if (!fontsLoaded) {
    return <AppLoading />;
  }

  // Function to pick an image from the library (works on all platforms)
  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permissions.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setProfileImage({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Error picking image.');
    }
  };

  // Function to take a photo (only for mobile platforms)
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setProfileImage({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Error taking photo.');
    }
  };

  // Function to remove custom image and revert to default
  const removeImage = () => {
    setProfileImage(require('./assets/adminpic.png'));
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image source={profileImage} style={styles.profileImage} />
        </View>
        <Text style={styles.profileName}>Admin User</Text>
        <Text style={styles.profileEmail}>admin@myapp.com</Text>
        <Text style={styles.profileRole}>Role: Administrator</Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={pickImageFromLibrary}>
            <Text style={styles.buttonText}>
              {profileImage === require('./assets/adminpic.png') ? 'Upload Image' : 'Change Image'}
            </Text>
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.button} onPress={takePhoto}>
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          )}
          {profileImage !== require('./assets/adminpic.png') && (
            <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
              <Text style={styles.removeButtonText}>Remove Image</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoHeading}>About Admin</Text>
          <Text style={styles.infoText}>
            This is the admin profile, with full access to manage the app’s content and settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ------------------------
// RecommendedScreen: Placeholder Tab
// ------------------------
const RecommendedScreen = () => (
  <SafeAreaView style={styles.mainContainer}>
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Recommended</Text>
      <Text style={styles.subtitle}>Recommended Content</Text>
    </View>
  </SafeAreaView>
);

// ------------------------
// Bottom Tab Navigator (DashboardScreen)
// ------------------------
const TabNavigator = createBottomTabNavigator();

const DashboardScreen = () => {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });
  if (!fontsLoaded) {
    return <AppLoading />;
  }
  return (
    <TabNavigator.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontFamily: 'Montserrat_400Regular', fontSize: 12 },
        tabBarStyle: { backgroundColor: '#f5f5dc' },
      }}
    >
      <TabNavigator.Screen name="Dashboard" component={DashboardMainScreen} />
      <TabNavigator.Screen name="Profile" component={ProfileScreen} />
      <TabNavigator.Screen name="Recommended" component={RecommendedScreen} />
    </TabNavigator.Navigator>
  );
};

export default DashboardScreen;

// ------------------------
// Styles
// ------------------------
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // DashboardMainScreen styles
  welcomeContainer: {
    marginVertical: 50,
  },
  welcomeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
  },
  uploadContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  uploadButtonText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#fff',
  },
  fileList: {
    marginTop: 10,
    alignItems: 'center',
  },
  fileName: {
    marginTop: 5,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  // Sign In & Tab common styles
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#333',
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#DB4437',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  signOutButtonText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#fff',
  },
  // SignInScreen specific styles (for email sign in)
  animatedContainer: { flex: 1 },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: { width: 380, height: 400 },
  signInContainer: { maxWidth: 350, width: '100%', alignItems: 'center' },
  emailSignInContainer: { width: '100%', alignItems: 'center', marginBottom: 15 },
  input: {
    width: '100%',
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 15,
    marginVertical: 6,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  emailButton: {
    backgroundColor: '#473c38',
    width: '100%',
    height: 45,
    borderRadius: 22,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emailButtonText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#fff',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#666',
  },
  socialButtonsWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  socialButtonSmall: {
    width: '100%',
    height: 35,
    borderRadius: 18,
    marginVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButton: { backgroundColor: '#db4437' },
  appleButton: { backgroundColor: '#000000' },
  microsoftButton: { backgroundColor: '#0078D4' },
  socialButtonText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#fff',
  },
  createAccountContainer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  noAccountText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#333',
  },
  createAccountText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#007BFF',
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
  // ProfileScreen styles
  imageContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#473c38',
    resizeMode: 'cover',
  },
  profileName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#333',
    marginTop: 10,
  },
  profileEmail: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileRole: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#473c38',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  buttonText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#DB4437',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  removeButtonText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#fff',
  },
  infoContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  infoHeading: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});