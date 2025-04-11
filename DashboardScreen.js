// DashboardScreen.js

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  StyleSheet,
  Image,
  imageOptionsModalStyles,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  Animated,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AppLoading from 'expo-app-loading';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_700Bold
} from '@expo-google-fonts/quicksand';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform as RNPlatform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, {
  Ellipse,
  Line,
  Text as SvgText,
  ForeignObject
} from 'react-native-svg';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  doc, getDoc, setDoc, deleteDoc, updateDoc, collection, addDoc,
  serverTimestamp, query, where, onSnapshot, orderBy, getDocs, limit // Added getDocs, limit
} from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

import { storage, db, auth } from './firebaseconfig';
import * as WebBrowser from 'expo-web-browser';

// Import your screens
import TopicDetailScreen from './TopicDetailScreen';
import MindMapScreen from './MindMapScreen';

// Import the logo and other assets explicitly
import logo from './assets/logo.png';
import dashboardIcon from './assets/dashboard-icon.png';
import background from './assets/bgimage1.png';
import adminpic from './assets/adminpic.png';
import bgimage22 from './assets/bgimage22.png';
import bgimage3 from './assets/bgimage3.png';
import bgimage5 from './assets/bgimage5.png';

WebBrowser.maybeCompleteAuthSession();

/* ---------------------------------------------------------------------
   Style Definitions
--------------------------------------------------------------------- */
const dashboardStyles = StyleSheet.create({
  // Background image
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8, // Adjust for desired translucency
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  // Bigger logo, top-left
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  logo: {
    width: 100,  // Increased from 80
    height: 100, // Increased from 80
    resizeMode: 'contain',
  },
  // Larger card with centered items
  card: {
    width: '90%',
    maxWidth: 800,   // Larger container
    minHeight: 650,  // Taller container
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    padding: 30,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    // Android Shadow
    elevation: 6,
    overflow: 'hidden',
    // Center content inside the card
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heading: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 24,
    marginTop: -5,  // Slight upward shift
    marginBottom: 25, 
    textAlign: 'center',
    color: '#473c38',
  },
  dragArea: {
    width: '90%',
    height: 200,  // Increased height for a bigger area
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#272e3f',
    backgroundColor: 'rgba(252, 236, 204, 0.9)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    // Center both text and icon
    alignItems: 'center',
    justifyContent: 'center',

  },
  dragAreaText: {
    fontFamily: 'Quicksand_400Regular',
    color: '#333',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  fileListContainer: {
    width: '90%',
    // More opaque color
    backgroundColor: 'rgba(252, 236, 204, 0.9)',
    borderRadius: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: '#272e3f',
    marginBottom: 30,  // More space below
    maxHeight: 130,
    overflowY: 'auto',
  },
  fileCount: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fileName: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontFamily: 'Quicksand_400Regular',
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 45,
    backgroundColor: '#473c38',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonHover: {
    backgroundColor: 'orange',
  },
  buttonText: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  noFilesText: {
    fontFamily: 'Quicksand_400Regular',
    color: 'red',
    marginTop: 10,
    textAlign: 'center',

  },
  // Additional style for AppBar on native (for linear gradient)
  appBarGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  appBarTitle: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
});



// Styles for RecommendedScreen (Includes background/logo styles)
const recommendedStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5dc' 
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
    resizeMode: 'cover',
  },

  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },

  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50, // Match Dashboard/Profile
  },

  cardContainer: {
    width: '90%',
    maxWidth: 800,
    minHeight: 650,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  heading: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 22,
    marginBottom: 15,
    color: '#473c38',
    textAlign: 'center',
    width: '100%',
  },

  contentArea: {
    flex: 1,
    width: '100%',
  },

  listContainer: {
    paddingBottom: 10,
    paddingHorizontal: 5,
  },

  recCard: {
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: 'orange',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    width: '100%',
  },

  recCardText: {
    fontSize: 16,
    color: '#473c38',
    fontFamily: 'Quicksand_500Medium',
    textAlign: 'center',
  },

  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  errorText: {
    color: 'red',
    textAlign: 'center',
    fontFamily: 'Quicksand_400Regular',
  },

  noRecsText: {
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Quicksand_400Regular',
  },
});


const profilestyles = StyleSheet.create({
  // --- Containers ---
  mainContainer: {
    flex: 1, // Ensure main container takes full screen height
    backgroundColor: '#f5f5f5', // Fallback background color
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5deb1', // Match Saved screen background during load
  },
  scrollContainer: {
    // flexGrow: 1, // Allows container to grow naturally based on content
    alignItems: 'center', // Center the profile card horizontally
    paddingTop: 80, // Space below logo/header area
    paddingBottom: 40, // Space at the very bottom of the scrollable content
    paddingHorizontal: Platform.OS === 'web' ? '15%' : 20, // Responsive horizontal padding
  },
  profileCard: {
    width: '100%', // Card takes full width available in scrollContainer
    maxWidth: 600, // Max width for the card on larger screens
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: Platform.OS === 'web' ? 30 : 20, // Responsive padding inside card
    paddingBottom: 30, // Ensure enough padding at the bottom of the card
    alignItems: 'center', // Center items like image, name, email within the card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 30, // Space below card if content scrolls
  },
  buttonsContainer: {
    width: '100%', // Button container takes full width of card
    marginTop: 25, // Space above the first button
    alignItems: 'center', // Center buttons horizontally within this container
  },
  // --- Background & Logo ---
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.6, // Make background slightly transparent
  },
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 40, // Adjust top position based on platform status bar
    left: 20,
    zIndex: 10, // Ensure logo is above background and card
  },
  logo:           { width:100, height:100, resizeMode:'contain' }, 
  // --- Profile Image ---
  imageContainer: {
    marginBottom: 15,
    position: 'relative', // Needed for absolute positioning of the edit overlay
  },
   profileImageWrapper: { // Wrapper for pressable effect and border radius
      borderRadius: 75, // Half of width/height
   },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75, // Make it circular
    borderWidth: 4,
    borderColor: '#e2ddbc', // A soft border color
    backgroundColor: '#eee', // Placeholder bg color while image loads
  },
  profileImageHover: { // Web-specific hover style
    borderColor: '#F9CB43', // Change border color on hover
    opacity: 0.9,
  },
  editIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', // Dark overlay
    borderRadius: 75, // Match image border radius
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0, // Hidden by default, shown on hover/press
    pointerEvents: 'none', // Make sure it doesn't block presses on the image
  },
  // --- Text Elements ---
  profileName: {
    fontSize: Platform.OS === 'web' ? 26 : 22,
    // fontFamily: 'Quicksand_700Bold', // Use bold font if loaded
    fontWeight: 'bold', // Fallback if font fails
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    // fontFamily: 'Quicksand_400Regular', // Use regular font if loaded
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  // --- Bio Section ---
  bioContainer: {
    width: '100%', // Bio container takes full width of card
    backgroundColor: '#ebf3fc', // Light background for bio section
    borderRadius: 10,
    padding: 15,
    marginTop: 20, // Space above bio section
    borderWidth: 1,
    alignItems: 'center',
    borderColor: '#eee',
    position: 'relative', // For positioning edit icons
    transition: 'background-color 0.2s ease', // Smooth transition for hover on web
  },
  bioContainerHover: { // Web-specific hover style
    backgroundColor: 'light pink',
    borderColor: '#ddd',
  },
  bioContainerEditing: {
      borderColor: '#007AFF', // Highlight border when editing
      backgroundColor: '#fff',
  },
  bioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10, // Space between title and text/input
  },
  bioTitle: {
    fontSize: 16,
    // fontFamily: 'Quicksand_700Bold', // Use bold font if loaded
    alignItems: 'center',
    fontWeight: 'bold',
  
    color: '#444',
  },
  bioText: {
    fontSize: 14,
    // fontFamily: 'Quicksand_400Regular', // Use regular font if loaded
    color: '#555',
    alignItems: 'center',
    lineHeight: 20, // Improve readability
  },
  editBioIcon: {
     padding: 5, // Increase touchable area for the edit icon
  },
  bioTextInput: {
    fontSize: 14,
    // fontFamily: 'Quicksand_400Regular', // Use regular font if loaded
    color: '#333',
    lineHeight: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    minHeight: 80, // Start with a decent height for multiline input
    textAlignVertical: 'top', // Align text to top in multiline input
    backgroundColor: '#fff', // White background for input field
    marginBottom: 10, // Space below input before save/cancel buttons
  },
  bioEditActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end', // Align save/cancel to the right
      alignItems: 'center',
  },
  // --- Action Buttons ---
  // Style for the TouchableOpacity wrapper (layout)
  actionButtonTouchable: {
    width: '90%', // Make touch area slightly narrower than card
    maxWidth: 350, // Max width for buttons on wide screens
    marginVertical: 8, // Vertical space between buttons
    // Removed visual styles like padding, borderRadius, backgroundColor, shadow
  },
  // Style for the inner View (visual appearance)
  actionButtonView: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25, // More rounded buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    transition: 'background-color 0.2s ease', // For web hover effect
  },
  actionButtonText: {
    color: '#fff', // White text for buttons
    fontSize: 15,
    // fontFamily: 'Quicksand_500Medium', // Use medium font if loaded
    fontWeight: '500', // Medium weight fallback
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 10, // Space between icon and text
  },
  // Specific background colors applied to the inner View
  viewMapsButtonView: {
    backgroundColor: 'orange', // Using basic color name for testing
  },
  viewMapsButtonHover: { // Applied to inner View on hover
    backgroundColor: 'orange', // Darker yellow on hover (web)
  },
  viewTopicsButtonView: {
    backgroundColor: 'green', // Using basic color name for testing
  },
  viewTopicsButtonHover: { // Applied to inner View on hover
    backgroundColor: '#388E3C', // Darker green on hover (web)
  },
  signOutButtonView: {
    backgroundColor: 'red', // Using basic color name for testing
  },
  signOutButtonHover: { // Applied to inner View on hover
    backgroundColor: 'red', // Darker greyish blue on hover (web)
  },
  // Opacity applied to the TouchableOpacity when disabled
  buttonDisabled: {
    opacity: 0.6,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent dark background
  },
  modalBox: {
    width: Platform.OS === 'web' ? '30%' : '85%', // Responsive modal width
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingTop: 25,
    paddingBottom: 15, // Less padding at bottom
    paddingHorizontal: 20, // Horizontal padding inside modal
    alignItems: 'center', // Center buttons inside modal box
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    // fontFamily: 'Quicksand_700Bold', // Use bold font if loaded
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25, // Space below title
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF', // Standard blue for default action
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8, // Space between modal buttons
    width: '100%', // Make buttons full width of modal box
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    // fontFamily: 'Quicksand_500Medium', // Use medium font if loaded
    fontWeight: '500',
    textAlign: 'center',
    marginLeft: 10, // Space between icon and text in modal buttons
  },
  modalButtonIcon: {
    marginRight: 0, // Reset margin as text has marginLeft now
  },
  removeButton: { // Specific style for the remove button in modal
    backgroundColor: '#DC3545', // Red color for remove/delete action
  },
  cancelButton: { // Specific style for the cancel button in modal
    backgroundColor: '#f0f0f0', // Light grey background
    marginTop: 15, // Add extra space above cancel button
  },
  cancelButtonText: { // Specific text style for cancel button
    color: '#666', // Dark grey text
  },
});
  // Saved Mind Maps Screen styles
  const savedStyles = StyleSheet.create({
    container: { 
      flex: 1, 
      padding: 20, 
      backgroundColor: '#f5deb1' 
    },
    item: {
      backgroundColor: '#fff',
      padding: 15,
      marginVertical: 8,
      borderRadius: 8,
      elevation: 2
    },
    topRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    buttonRow: { 
      flexDirection: 'row' 
    },
    title: { 
      fontSize: 16, 
      fontWeight: 'bold', 
      color: '#222' 
    },
    date: { 
      fontSize: 12, 
      color: '#666', 
      marginTop: 4 
    },
    actionButton: { 
      backgroundColor: '#473c38', 
      paddingVertical: 6, 
      paddingHorizontal: 12, 
      borderRadius: 5 
    },
    actionText: { 
      color: '#fff', 
      fontSize: 12 
    },
    openButton: { 
      marginTop: 10, 
      alignSelf: 'flex-start' 
    },
    openButtonText: { 
      color: 'blue', 
      textDecorationLine: 'underline', 
      fontSize: 14 
    },
    modalOverlay: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#000000aa' 
    },
    modalBox: { 
      backgroundColor: 'white', 
      padding: 20, 
      borderRadius: 10, 
      width: '80%' 
    },
    modalTitle: { 
      fontSize: 18, 
      fontWeight: 'bold', 
      marginBottom: 10 
    },
    modalMessage: { 
      fontSize: 16, 
      marginBottom: 20, 
      color: '#333' 
    },
    input: { 
      borderWidth: 1, 
      borderColor: '#ccc', 
      borderRadius: 5, 
      padding: 10, 
      marginBottom: 10 
    },
    modalButtons: { 
      flexDirection: 'row', 
      justifyContent: 'flex-end' 
    },
    modalAction: { 
      color: '#007BFF', 
      fontSize: 16 
    }
  });

const mindMapStyles = StyleSheet.create({
  mapContainer: { 
    width: '100%', 
    height: '100%' 
  }
});

/* ---------------------------------------------------------------------
   AppBar Component
--------------------------------------------------------------------- */
const AppBar = () => {
  if (Platform.OS === 'web') {
    // Web fallback: a normal View with CSS-based gradient
    return (
      <View style={dashboardStyles.appBar}>
        <Text style={dashboardStyles.appBarTitle}>EduMap</Text>
      </View>
    );
  } else {
    // Native platforms: expo-linear-gradient
    return (
      <LinearGradient
        colors={['#8B4513']}  // Brownish gradient colors
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={dashboardStyles.appBarGradient}
      >
        <Text style={dashboardStyles.appBarTitle}>EduMap</Text>
      </LinearGradient>
    );
  }
};


const uriToBlob = (uri) => { // Defining an asynchronous function for converting a URI into a Blob.
  return new Promise((resolve, reject) => { // Returning a new promise for handling the asynchronous conversion.
    const xhr = new XMLHttpRequest(); // Creating a new XMLHttpRequest instance for fetching the resource.
    xhr.onload = () => resolve(xhr.response); // Setting the onload handler for resolving the promise with the fetched Blob.
    xhr.onerror = () => reject(new Error('uriToBlob failed')); // Setting the onerror handler for rejecting the promise if an error occurs.
    xhr.responseType = 'blob'; // Setting the response type to 'blob' for receiving binary data.
    xhr.open('GET', uri, true); // Opening a GET request to the provided URI.
    xhr.send(null); // Sending the request to fetch the resource.
  });
};

const readWebFileAsBase64 = async (file) => { // Defining an asynchronous function for reading a web file as Base64.
  return new Promise((resolve, reject) => { // Returning a new promise for handling file reading.
    const reader = new FileReader(); // Creating a new FileReader instance for reading the file.
    reader.onloadend = () => resolve(reader.result); // Setting the onloadend handler for resolving the promise with the Base64 result.
    reader.onerror = (error) => reject(error); // Setting the onerror handler for rejecting the promise if an error occurs during reading.
    reader.readAsDataURL(file); // Initiating reading of the file as a Data URL (Base64 encoded).
  });
};

const readFileAsBase64 = async (input) => { // Defining an asynchronous function for reading a file as Base64.
  if (typeof input === 'string') { // Checking if the input is a string (URI).
    return FileSystem.readAsStringAsync(input, { encoding: FileSystem.EncodingType.Base64 }) // Reading file content as a Base64 string using FileSystem.
      .then((base64) => `data:application/pdf;base64,${base64}`); // Prepending the Base64 result with the MIME type prefix.
  } else {
    return readWebFileAsBase64(input); // Falling back to reading the file as a web file if input is not a string.
  }
};


const generateMindMapData = async (nonPdfUrls, pdfFileMessages, fileDetails) => { // Asynchronous function for generating mind map data from file inputs.
  try {
    // Creating a string that lists all files with their index and details.
    const fileListString = fileDetails
      .map((detail, index) => `File ${index + 1}: ${detail}`) // Mapping each file detail into a formatted string with its number.
      .join("\n"); // Joining the formatted strings with newline characters for proper formatting.

    // Building a prompt that is instructing the AI on how to process the files.
    let prompt = `You are provided with ${fileDetails.length} files:
${fileListString}

Each file contains educational material on a distinct subject.
For each file, analyze its content and generate exactly one JSON object with the following format:
{
  "subject": "Derived Subject Name",
  "mainTopics": [
    {
      "title": "Derived Main Topic 1",
      "subtopics": [
        { "title": "Derived Subtopic 1" },
        { "title": "Derived Subtopic 2" }
      ]
    }
  ]
}
Output only the JSON array of these objects without any additional text or commentary.`; // Explaining the expected JSON format without additional commentary.

    // Combining any PDF file messages with the prompt into a single content array.
    const contentArray = [
      ...pdfFileMessages,  // Spreading in all provided PDF-related messages.
      { type: "text", text: prompt }  // Appending the prompt as an additional text message.
    ];

    // Creating the message object formatted for the OpenAI Chat API.
    const messages = [
      { role: "user", content: contentArray } // Packaging the content array under the "user" role.
    ];

    // Making an API call to OpenAI's chat completions endpoint.
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', // Using the POST method for sending the request.
      headers: {
        'Content-Type': 'application/json', // Declaring that the content type is JSON.
        //API CALL
        'Authorization': `Bearer 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` // Using the provided API token (noting that hardcoding tokens is not recommended in production code).
      },
      body: JSON.stringify({
        model: 'gpt-4o',         // Specifying the model that is to be used.
        messages: messages,      // Including the messages array that was prepared.
        max_tokens: 3000,        // Setting an upper limit on the response token count.
        temperature: 0           // Setting temperature to 0 for deterministic responses.
      })
    });

    // Parsing the JSON response from the API.
    const data = await response.json(); // Converting the API response into a JavaScript object.
    console.log("API response:", data); // Logging the full API response for debugging purposes.

    // Validating that there are choices in the API response.
    if (!data.choices || data.choices.length === 0) {
      throw new Error("API response does not include any choices: " + JSON.stringify(data));
    }

    // Extracting the raw response text from the first choice.
    let responseText = data.choices[0].message?.content;
    console.log("Raw response text:", responseText); // Logging the raw response text for debugging.

    // Attempting to extract JSON from a markdown code block if one is present.
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      responseText = jsonMatch[1]; // Removing the markdown formatting to isolate the JSON.
    } else {
      // Finding the first occurrence of "{" and trimming the string from that point.
      const firstBrace = responseText.indexOf('{');
      if (firstBrace !== -1) {
        responseText = responseText.substring(firstBrace);
      }
    }

    // Parsing the cleaned response text as JSON.
    const mindMapDataArray = JSON.parse(responseText);
    console.log("Parsed mind map data:", mindMapDataArray); // Logging the parsed JSON object for verification.
    return mindMapDataArray; // Returning the generated mind map data array.
  } catch (error) {
    console.error('Error generating mind map data:', error); // Logging any errors that are occurring during the process.
    return null; // Returning null in case an error is encountered.
  }
};

/* ---------------------------------------------------------------------
   Mind Map Rendering Functions
--------------------------------------------------------------------- */
const VIRTUAL_WIDTH = 1350;
const VIRTUAL_HEIGHT = 1350;

function computeEllipse(title, baseRx, baseRy, wideFactor, tallFactor, maxRx, maxRy) {
  title = typeof title === 'string' ? title : '';
  const textLength = title.length;
  let rx = baseRx + textLength * wideFactor;
  let ry = baseRy + textLength * tallFactor;
  if (rx > maxRx) rx = maxRx;
  if (ry > maxRy) ry = maxRy;
  const minDim = Math.min(rx, ry);
  let fontSize = minDim * 0.6;
  if (fontSize < 8) fontSize = 8;
  if (fontSize > 24) fontSize = 24;
  let text = title;
  if (textLength > 50) {
    text = text.substring(0, 47) + '...';
  }
  return { text, rx, ry, fontSize };
}

function layoutMindMap(data, width, height) {
  const center = { x: width / 2, y: height / 2 };
  const nodes = [];
  const edges = [];

  const subjectProps = computeEllipse(data.subject, 90, 45, 1.8, 0.7, 180, 90);
  const subjectId = 'subject';
  nodes.push({
    id: subjectId,
    type: 'subject',
    title: subjectProps.text,
    originalTitle: data.subject,
    x: center.x,
    y: center.y,
    rx: subjectProps.rx,
    ry: subjectProps.ry,
    fontSize: subjectProps.fontSize,
  });

  const minDim = Math.min(width, height);
  const mainRingRadius = subjectProps.rx + minDim * 0.2;

  const mainBaseRx = 70, mainBaseRy = 35, mainWideFactor = 1.5, mainTallFactor = 0.6, mainMaxRx = 150, mainMaxRy = 75;
  const mainTopics = data.mainTopics || [];
  const mainCount = mainTopics.length;
  const mainEffectiveCount = Math.max(mainCount, 3);
  const mainAngleStep = (2 * Math.PI) / mainEffectiveCount;
  const mainAngleOffset = -Math.PI / 2;

  mainTopics.forEach((topic, i) => {
    const angle = mainAngleOffset + i * mainAngleStep;
    const mx = center.x + mainRingRadius * Math.cos(angle);
    const my = center.y + mainRingRadius * Math.sin(angle);
    const mainProps = computeEllipse(topic.title, mainBaseRx, mainBaseRy, mainWideFactor, mainTallFactor, mainMaxRx, mainMaxRy);
    const mainId = `main-${i}`;
    nodes.push({
      id: mainId,
      type: 'main',
      title: mainProps.text,
      originalTitle: topic.title,
      x: mx,
      y: my,
      rx: mainProps.rx,
      ry: mainProps.ry,
      fontSize: mainProps.fontSize,
    });
    edges.push({ from: subjectId, to: mainId });

    const subTopics = topic.subtopics || [];
    const subCount = subTopics.length;
    const subEffectiveCount = Math.max(subCount, 3);
    const subAngleStep = (2 * Math.PI) / subEffectiveCount;
    const subAngleOffset = -Math.PI / 2;
    const subRingRadius = mainProps.rx + 80;
    const subBaseRx = 60, subBaseRy = 30, subWideFactor = 1.2, subTallFactor = 0.5, subMaxRx = 120, subMaxRy = 60;

    subTopics.forEach((sub, j) => {
      const subAngle = subAngleOffset + j * subAngleStep;
      const sx = mx + subRingRadius * Math.cos(subAngle);
      const sy = my + subRingRadius * Math.sin(subAngle);
      const subProps = computeEllipse(sub.title, subBaseRx, subBaseRy, subWideFactor, subTallFactor, subMaxRx, subMaxRy);
      const subId = `sub-${i}-${j}`;
      nodes.push({
        id: subId,
        type: 'sub',
        title: subProps.text,
        originalTitle: sub.title,
        x: sx,
        y: sy,
        rx: subProps.rx,
        ry: subProps.ry,
        fontSize: subProps.fontSize,
      });
      edges.push({ from: mainId, to: subId });
    });
  });

  return { nodes, edges };
}

const SingleMindMap = ({ data, width, height, navigation }) => {
  const { nodes, edges } = layoutMindMap(data, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  return (
    <View style={mindMapStyles.mapContainer}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIRTUAL_WIDTH} ${VIRTUAL_HEIGHT}`}>
        {edges.map((edge, i) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          return (
            <Line
              key={`edge-${i}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="gray"
              strokeWidth={4}
            />
          );
        })}
        {nodes.map((n, i) => {
          let fillColor = '#007BFF';
          if (n.type === 'subject') fillColor = '#FF4444';
          else if (n.type === 'main') fillColor = '#473c38';
          return (
            <React.Fragment key={`node-${i}`}>
              <Ellipse cx={n.x} cy={n.y} rx={n.rx} ry={n.ry} fill={fillColor} />
              <SvgText
                x={n.x}
                y={n.y + n.fontSize / 3}
                fontSize={n.fontSize}
                fill="white"
                textAnchor="middle"
              >
                {n.title}
              </SvgText>
              {n.type === 'sub' && (
                <ForeignObject
                  x={n.x - n.rx}
                  y={n.y - n.ry}
                  width={n.rx * 2}
                  height={n.ry * 2}
                >
                  <Pressable
                    onPress={() =>
                      navigation.navigate('TopicDetail', { topic: n.originalTitle })
                    }
                    style={({ hovered }) => [
                      {
                        width: '100%',
                        height: '80%',
                        borderRadius: n.rx,
                        backgroundColor: hovered ? 'rgba(0,0,0,0.1)' : 'transparent'
                      }
                    ]}
                  />
                </ForeignObject>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

/* ---------------------------------------------------------------------
   Dashboard Tab (File Upload, Mind Map Generation, & App Bar)
--------------------------------------------------------------------- */
const DashboardTab = () => {
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({ Quicksand_400Regular, Quicksand_700Bold });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [displayNoFilesMessage, setDisplayNoFilesMessage] = useState(false);
  const [isHoveringDragArea, setIsHoveringDragArea] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);

  // Animated logo effect
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleLogoPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!fontsLoaded) return <AppLoading />;

  const addDocument = async () => {
    try {
      // allow PDFs, Word docs, and images
      const options = {
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*'
        ],
        ...(RNPlatform.OS === 'web' && { multiple: true }),
      };

      const result = await DocumentPicker.getDocumentAsync(options);
      if (result.canceled) return;

      // if user picks multiple files on web
      if (RNPlatform.OS === 'web') {
        const files = result.output;
        // enforce 5-file limit
        if (selectedFiles.length + files.length > 5) {
          setUploadError('Upload limit exceeded. Please try again.');
        } else {
          setUploadError('');
          setSelectedFiles(prev => [...prev, ...files]);
        }
      } 
      else {
        // On iOS/Android:
        if (selectedFiles.length >= 5) {
          setUploadError('Upload limit exceeded. Please try again.');
          return;
        }
        setUploadError('');
        setSelectedFiles(prev => [...prev, result]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'File selection failed.');
    }
  };

  // Called only on web for drag events
  const handleDragOver = (e) => {
    if (RNPlatform.OS === 'web') {
      e.preventDefault();
      setIsHoveringDragArea(true);
    }
  };
  const handleDragLeave = (e) => {
    if (RNPlatform.OS === 'web') {
      e.preventDefault();
      setIsHoveringDragArea(false);
    }
  };
  const handleDrop = async (e) => {
    if (RNPlatform.OS === 'web') {
      e.preventDefault();
      setIsHoveringDragArea(false);
      const droppedFiles = e.dataTransfer.files;
      if (!droppedFiles.length) return;
      setDisplayNoFilesMessage(false);
      const newFiles = Array.from(droppedFiles);
      if (selectedFiles.length + newFiles.length > 5) {
        setUploadError('Upload limit exceeded. Please try again.');
      } else {
        setUploadError('');
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  const processFiles = async () => { // Defining an asynchronous function for processing selected files.
    if (selectedFiles.length === 0) { // Checking if no files are selected.
      setDisplayNoFilesMessage(true); // Setting display of no files message to true.
      return; // Returning early as there are no files to process.
    }
    setDisplayNoFilesMessage(false); // Setting display of no files message to false.
    setUploading(true); // Setting uploading state to true.

    const pdfFileMessages = []; // Initializing an array for holding PDF file messages.
    const nonPdfUrls = []; // Initializing an array for holding non-PDF file URLs.
    const fileDetails = []; // Initializing an array for storing file details.

    for (const file of selectedFiles) { // Iterating over each selected file.
      let fileName = file.name || 'uploadedFile'; // Determining the file name or defaulting to 'uploadedFile'.
      let fileUri = file.uri; // Storing the file URI.

      if (fileName.toLowerCase().endsWith('.pdf')) { // Checking if the file is a PDF.
        let base64Data; // Declaring a variable for holding Base64 data.
        if (RNPlatform.OS === 'web') { // Checking if the platform is web.
          base64Data = await readFileAsBase64(file); // Awaiting reading the file as Base64 for web.
          fileUri = base64Data; // Reassigning fileUri to the Base64 data.
        } else {
          base64Data = await readFileAsBase64(fileUri); // Awaiting reading the file as Base64 for non-web platforms.
        }

        pdfFileMessages.push({ // Pushing an object representing the PDF file message into the array.
          type: 'file',
          file: { filename: fileName, file_data: base64Data }
        });
        fileDetails.push(`PDF file (${fileName})`); // Pushing file details for the PDF file.
      } 
      else { // Handling non-PDF files.
        let downloadUrl = ''; // Initializing a variable for holding the download URL.
        if (RNPlatform.OS === 'web') { // Checking if the platform is web.
          const storageRef = ref(storage, `uploads/${fileName}`); // Creating a storage reference for uploading.
          await uploadBytes(storageRef, file); // Awaiting uploading the file bytes for web.
          downloadUrl = await getDownloadURL(storageRef); // Awaiting retrieving the download URL.
        } else {
          const fileBlob = await uriToBlob(fileUri); // Awaiting converting the URI to a Blob for non-web platforms.
          const storageRef = ref(storage, `uploads/${fileName}`); // Creating a storage reference for uploading.
          await uploadBytes(storageRef, fileBlob); // Awaiting uploading the Blob.
          downloadUrl = await getDownloadURL(storageRef); // Awaiting retrieving the download URL.
        }
        nonPdfUrls.push(downloadUrl); // Pushing the download URL into the non-PDF URLs array.
        fileDetails.push(downloadUrl); // Pushing the download URL into file details.
      }
    }

    // Calling the GPT API for generating mind map data.
    const mindMapData = await generateMindMapData(nonPdfUrls, pdfFileMessages, fileDetails);
    setUploading(false); // Setting uploading state to false.

    if (mindMapData) { // Checking if mind map data has been successfully generated.
      navigation.navigate('MindMap', { // Navigating to the MindMap screen with the generated data.
        mindMapData,
        onBack: () => setSelectedFiles([]), // Setting the onBack callback to reset selected files.
        uploadedFiles: selectedFiles,
      });
    } else {
      Alert.alert('Error', 'Could not generate mind map data.'); // Showing an error alert if generation has failed.
    }
};

  // For web, we use <div> drag zone. For iOS, we use <TouchableOpacity> fallback
  const isWeb = RNPlatform.OS === 'web';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Image source={background} style={dashboardStyles.backgroundImage} />
      <ScrollView contentContainerStyle={dashboardStyles.scrollContent}>
        <View style={dashboardStyles.logoContainer}>
          <TouchableOpacity
            onPress={handleLogoPress}
            onMouseEnter={
              isWeb
                ? () => {
                    Animated.timing(scaleAnim, {
                      toValue: 1.1,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                  }
                : undefined
            }
            onMouseLeave={
              isWeb
                ? () => {
                    Animated.timing(scaleAnim, {
                      toValue: 1,
                      duration: 200,
                      useNativeDriver: true,
                    }).start();
                  }
                : undefined
            }
            activeOpacity={0.8}
          >
            <Animated.Image
              source={logo}
              style={[dashboardStyles.logo, { transform: [{ scale: scaleAnim }] }]}
            />
          </TouchableOpacity>
        </View>

        <View style={dashboardStyles.card}>
          <Text style={dashboardStyles.heading}>
            Upload your study material here (Up to 5 files)
          </Text>

          {/* Conditionally render a <div> for drag-and-drop on web,
              or a TouchableOpacity for iPad fallback. */}
          {isWeb ? (
            // WEB DRAG-AND-DROP
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMouseEnter={() => setIsHoveringDragArea(true)}
              onMouseLeave={() => setIsHoveringDragArea(false)}
              onClick={addDocument}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '90%',
                height: 300,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#272e3f',
                backgroundColor: 'rgba(252, 236, 204, 0.9)',
                borderRadius: 10,
                padding: 20,
                marginBottom: 30,
                outline: isHoveringDragArea ? '2px dashed #1f2532' : 'none',
                cursor: 'pointer',
                boxShadow: isHoveringDragArea ? '0 0 8px rgba(39,46,63,0.4)' : 'none',
                transform: isHoveringDragArea ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <Image
                source={dashboardIcon}
                style={{ width: 60, height: 60, marginBottom: 15 }}
              />
              <Text style={dashboardStyles.dragAreaText}>
                Drag file to upload
              </Text>
              <Text style={dashboardStyles.dragAreaText}>
                (Or click to browse)
              </Text>
            </div>
          ) : (
            // iOS/Android fallback
            <TouchableOpacity
              style={{
                width: '90%',
                height: 200,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#272e3f',
                backgroundColor: 'rgba(252, 236, 204, 0.9)',
                borderRadius: 10,
                padding: 20,
                marginBottom: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={addDocument}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 40 }}>☁</Text>
              <Text style={dashboardStyles.dragAreaText}>Tap to select files</Text>
            </TouchableOpacity>
          )}

          <View style={dashboardStyles.fileListContainer}>
            {selectedFiles.length > 0 ? (
              <Text style={dashboardStyles.fileCount}>
                {selectedFiles.length} file(s) selected.
              </Text>
            ) : (
              displayNoFilesMessage && (
                <Text style={dashboardStyles.noFilesText}>
                  Sorry, please upload your files
                </Text>
              )
            )}
            <FlatList
              data={selectedFiles}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={dashboardStyles.fileItem}>
                  <Text style={dashboardStyles.fileName}>
                    {item.name || 'uploadedFile'}
                  </Text>
                  <TouchableOpacity
                    style={dashboardStyles.deleteButton}
                    onPress={() => {
                      const newFiles = [...selectedFiles];
                      newFiles.splice(index, 1);
                      setSelectedFiles(newFiles);
                    }}
                  >
                    <Text style={dashboardStyles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {uploadError ? (
              <Text style={dashboardStyles.errorText}>{uploadError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              dashboardStyles.button,
              isHoveringButton ? dashboardStyles.buttonHover : null,
            ]}
            onPress={processFiles}
            disabled={uploading}
            onMouseEnter={
              isWeb
                ? () => setIsHoveringButton(true)
                : undefined
            }
            onMouseLeave={
              isWeb
                ? () => setIsHoveringButton(false)
                : undefined
            }
          >
            <Text style={dashboardStyles.buttonText}>
              {uploading ? 'Processing...' : 'Create Mind Map'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
/* ---------------------------------------------------------------------
   Profile Screen
--------------------------------------------------------------------- */
const ProfileScreen = ({ navigation }) => {
  // --- State Variables ---
  const [profileImage, setProfileImage] = useState(adminpic); // Default to adminpic asset
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [bio, setBio] = useState(
    'Hey! Its Sana, creator of EduMap! Are you ready to start your learning journey! You can customize this space here with whatever you like. I hope you love this app as much as I enjoyed making it for you! Happy learning! '
  );
  const [tempBio, setTempBio] = useState(bio);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isImageOptionsModalVisible, setIsImageOptionsModalVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // --- Hover States (Primarily for Web) ---
  const [pfpHovered, setPfpHovered] = useState(false);
  const [bioHovered, setBioHovered] = useState(false);
  const [viewSavedHovered, setViewSavedHovered] = useState(false);
  const [viewTopicsHovered, setViewTopicsHovered] = useState(false);
  const [signOutHovered, setSignOutHovered] = useState(false);

  // --- Font Loading ---
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_700Bold,
    Quicksand_500Medium: Quicksand_400Regular, // Using Regular as Medium if 500 isn't loaded separately
  });

  // --- Animations ---
  const scaleAnim = useRef(new Animated.Value(1)).current; // For logo animation

  // --- Firebase Instances ---
  // We are now using auth, db, storage imported from firebaseConfig (see imports above)

  // --- Effects ---
  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Ensure auth object is available before accessing currentUser
        if (!auth) {
            console.error("Firebase auth instance is not available.");
            Alert.alert('Error', 'Authentication service not loaded.');
            return;
        }
        const uid = auth.currentUser?.uid;
        if (!uid) {
          console.log('No user logged in.');
          // Optionally navigate to SignIn screen if no user
          // navigation.navigate('SignIn');
          return;
        }

        // Ensure db object is available
        if (!db) {
            console.error("Firebase firestore instance is not available.");
            Alert.alert('Error', 'Database service not loaded.');
            return;
        }
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Use stored profile image if available and not empty, otherwise use default
          if (data.profileImage && data.profileImage.trim() !== '') {
            setProfileImage({ uri: data.profileImage });
          } else {
            setProfileImage(adminpic); // Use the imported default asset
          }
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setUserEmail(data.email || '');
          // Set bio from Firestore if available
          if (data.bio) {
            setBio(data.bio);
            setTempBio(data.bio);
          } else {
             // Keep default bio if none in Firestore
             setTempBio(bio);
          }
        } else {
          console.log('No profile document found for user:', uid);
          // Handle case for new user or missing document (e.g., set defaults)
          setProfileImage(adminpic); // Use default asset
          setTempBio(bio); // Use default bio
          // You might want to fetch email/name from auth.currentUser here if needed
          setUserEmail(auth.currentUser?.email || '');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        Alert.alert('Error', 'Could not load profile data.');
      }
    };
    fetchProfileData();
  }, [auth, db]); // Rerun if auth or db instance changes (though unlikely)

  // --- Helper Functions ---
  // Convert URI to Blob for uploading
  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = (e) => {
        console.error("uriToBlob failed:", e);
        reject(new Error('uriToBlob failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  };

  // Upload image to Firebase Storage and update Firestore
  const uploadAndSaveImage = async (localUri) => {
    if (!localUri) return;
    // Ensure auth, storage, and db are available
    if (!auth || !storage || !db) {
        Alert.alert('Error', 'Firebase services not properly loaded.');
        return;
    }

    try {
      const blob = await uriToBlob(localUri);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Error', 'You must be logged in to upload images.');
        return;
      }
      const storageRef = ref(storage, `profilePics/${uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      // Update Firestore
      await setDoc(doc(db, 'users', uid), { profileImage: downloadUrl }, { merge: true });

      // Update local state
      setProfileImage({ uri: downloadUrl });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Error', 'Failed to upload profile image. Please try again.');
    } finally {
        // Close blob connection (optional but good practice)
        // blob.close(); // Not available on all platforms/RN versions
    }
  };

  // Save edited bio to Firestore
  const saveBio = async () => {
    // Ensure auth and db are available
    if (!auth || !db) {
        Alert.alert('Error', 'Firebase services not properly loaded.');
        return;
    }
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Error', 'You must be logged in to update your bio.');
        return;
      }
      await updateDoc(doc(db, 'users', uid), { bio: tempBio });
      setBio(tempBio); // Update displayed bio
      setIsEditingBio(false); // Exit editing mode
      Alert.alert('Success', 'Bio updated!');
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', 'Failed to update bio.');
    }
  };

  // --- Image Picker Functions ---
  // Pick image from device library
  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permissions in your device settings.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Allows user to crop/edit
        // aspect: [1, 1], // Optional: Enforce square aspect ratio
        quality: 0.8, // Compress image slightly
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAndSaveImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'Could not open image library.');
    }
  };

  // Take photo using device camera (if available)
  const takePhoto = async () => {
     if (Platform.OS === 'web') {
        Alert.alert("Not Supported", "Taking photos is not supported on the web.");
        return;
     }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions in your device settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        // aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAndSaveImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  // Remove profile image (set to empty string in Firestore, revert state to default)
  const removeImage = async () => {
    // Ensure auth and db are available
    if (!auth || !db) {
        Alert.alert('Error', 'Firebase services not properly loaded.');
        return;
    }
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return; // Should not happen if user is on this screen

      // Update Firestore to remove the image URL
      await updateDoc(doc(db, 'users', uid), { profileImage: '' });

      // Update local state to show the default image
      setProfileImage(adminpic);
      Alert.alert('Success', 'Profile picture removed.');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('Error', 'Failed to remove profile picture.');
    }
  };

  // --- Action Handlers ---
  // Handler for opening image picker (called from modal)
  const handleChangeImage = () => {
    setIsImageOptionsModalVisible(false); // Close modal first
    // Optionally, present another choice: Library or Camera
    Alert.alert(
        "Choose Source",
        "Select picture from:",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Library", onPress: pickImageFromLibrary },
            // Only show Camera option if not on web
            ...(Platform.OS !== 'web' ? [{ text: "Camera", onPress: takePhoto }] : [])
        ]
    );
    // Or directly call one:
    // pickImageFromLibrary();
  };

  // Handler for removing image (called from modal)
  const handleRemoveImage = () => {
    setIsImageOptionsModalVisible(false); // Close modal first
    removeImage();
  };

  const handleSignOut = async () => {

    if (!auth) {
        Alert.alert('Error', 'Authentication service not loaded.');
        return;
    }
    setIsSigningOut(true); // Show loading indicator
    try {
      await signOut(auth); 
      console.log('User signed out successfully');

    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false); // Hide loading indicator
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={profilestyles.loadingContainer}>
        <ActivityIndicator size="large" color="#473c38" />
        <Text>Loading Profile...</Text>
      </View>
    );
  }

  const isDefaultImage = profileImage === adminpic;

  return (
    <View style={profilestyles.mainContainer}>
      {/* Background Image */}
      <Image source={bgimage22} style={profilestyles.backgroundImage} resizeMode="cover" />

      {/* Logo in top-left */}
      <View style={profilestyles.logoContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard')} // Navigate to Dashboard screen
          activeOpacity={0.8}
        >
          <Animated.Image
            source={logo}
            style={[profilestyles.logo, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView contentContainerStyle={profilestyles.scrollContainer}>
        {/* Profile Card */}
        {/* The main card holding profile info and buttons */}
        <View style={profilestyles.profileCard}>
          {/* Profile Picture Section */}
          <View style={profilestyles.imageContainer}>
            <Pressable
              onPress={() => setIsImageOptionsModalVisible(true)} // Open modal on press
              onHoverIn={() => { if (Platform.OS === 'web') setPfpHovered(true); }}
              onHoverOut={() => { if (Platform.OS === 'web') setPfpHovered(false); }}
              style={({ pressed }) => [
                 profilestyles.profileImageWrapper,
                 pressed && { opacity: 0.8 } // Dim image slightly on press
              ]}
            >
              <Image
                source={profileImage}
                style={[
                  profilestyles.profileImage,
                  pfpHovered && Platform.OS === 'web' && profilestyles.profileImageHover, // Web hover effect
                ]}
              />
              {/* Edit Icon Overlay (visible on hover for web, always slightly visible otherwise) */}
              <View style={[
                  profilestyles.editIconOverlay,
                  (pfpHovered || Platform.OS !== 'web') && { opacity: pfpHovered ? 1 : 0.5 } // Adjust opacity
              ]}>
                <Icon name="edit-2" size={ Platform.OS === 'web' ? 30 : 24} color="#fff" />
              </View>
            </Pressable>
          </View>

          {/* User Name and Email */}
          <Text style={profilestyles.profileName}>
            {firstName} {lastName}
          </Text>
          <Text style={profilestyles.profileEmail}>{userEmail}</Text>

          {/* Bio Section */}
          {/* Container for the user's biography */}
          <Pressable
            onPress={() => !isEditingBio && setIsEditingBio(true)} // Allow editing on press if not already editing
            onHoverIn={() => { if (Platform.OS === 'web') setBioHovered(true); }}
            onHoverOut={() => { if (Platform.OS === 'web') setBioHovered(false); }}
            style={[
              profilestyles.bioContainer,
              bioHovered && Platform.OS === 'web' && profilestyles.bioContainerHover, // Web hover effect
              isEditingBio && profilestyles.bioContainerEditing // Style changes when editing
            ]}
          >
            <View style={profilestyles.bioHeader}>
                <Text style={profilestyles.bioTitle}>About Me</Text>
                {!isEditingBio && (
                    // Edit icon shown when NOT editing
                    <TouchableOpacity onPress={() => setIsEditingBio(true)} hitSlop={15} style={profilestyles.editBioIcon}>
                         <Icon name="edit-3" size={18} color="#555" />
                    </TouchableOpacity>
                )}
            </View>

            {isEditingBio ? (
              // Show TextInput when editing bio
              <>
                <TextInput
                  style={profilestyles.bioTextInput}
                  multiline
                  maxLength={300}
                  value={tempBio}
                  onChangeText={setTempBio}
                  autoFocus // Focus the input when editing starts
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#999"
                />
                <View style={profilestyles.bioEditActions}>
                    {/* Cancel editing bio */}
                    <TouchableOpacity onPress={() => { setIsEditingBio(false); setTempBio(bio); }} hitSlop={15}>
                         <Icon name="x-circle" size={24} color="#DC3545" />
                    </TouchableOpacity>
                     {/* Save edited bio */}
                    <TouchableOpacity onPress={saveBio} hitSlop={15} style={{marginLeft: 15}}>
                         <Icon name="check-circle" size={24} color="#28A745" />
                    </TouchableOpacity>
                </View>
              </>
            ) : (
              // Display bio text when not editing
              <Text style={profilestyles.bioText}>{bio || 'No bio set yet.'}</Text>
            )}
          </Pressable>
          {/* End of Bio Section */}

          {/* Action Buttons Container */}
          {/* This container holds all the main action buttons */}
          <View style={profilestyles.buttonsContainer}>

            {/* View Saved Mind Maps Button */}
            <TouchableOpacity
              style={[
                  profilestyles.actionButtonTouchable, // Style for touchable area layout
                  ({ pressed }) => ({ opacity: pressed ? 0.7 : 1.0 }) // Apply opacity on press
              ]}
              onPress={() => navigation.navigate('SavedMindMaps')}
              onHoverIn={() => { if (Platform.OS === 'web') setViewSavedHovered(true); }}
              onHoverOut={() => { if (Platform.OS === 'web') setViewSavedHovered(false); }}
              activeOpacity={1.0} // Let manual opacity handle the feedback
            >
              {/* Inner View handles the visual appearance */}
              <View style={[
                  profilestyles.actionButtonView,
                  profilestyles.viewMapsButtonView, // Applies background color
                  viewSavedHovered && Platform.OS === 'web' && profilestyles.viewMapsButtonHover,
              ]}>
                <Icon name="map" size={16} color="#fff" style={profilestyles.buttonIcon} />
                <Text style={profilestyles.actionButtonText}>View Saved Mind Maps</Text>
              </View>
            </TouchableOpacity>

            {/* View Saved Topics Button */}
            <TouchableOpacity
              style={[
                  profilestyles.actionButtonTouchable,
                  ({ pressed }) => ({ opacity: pressed ? 0.7 : 1.0 })
              ]}
              onPress={() => navigation.navigate('SavedTopics')}
              onHoverIn={() => { if (Platform.OS === 'web') setViewTopicsHovered(true); }}
              onHoverOut={() => { if (Platform.OS === 'web') setViewTopicsHovered(false); }}
              activeOpacity={1.0}
            >
              <View style={[
                  profilestyles.actionButtonView,
                  profilestyles.viewTopicsButtonView, // Applies background color
                  viewTopicsHovered && Platform.OS === 'web' && profilestyles.viewTopicsButtonHover,
              ]}>
                <Icon name="bookmark" size={16} color="#fff" style={profilestyles.buttonIcon} />
                <Text style={profilestyles.actionButtonText}>View Saved Topics</Text>
              </View>
            </TouchableOpacity>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={[
                  profilestyles.actionButtonTouchable,
                  isSigningOut && profilestyles.buttonDisabled, // Apply disabled opacity to touchable
                  ({ pressed }) => ({ opacity: (pressed && !isSigningOut) ? 0.7 : 1.0 })
              ]}
              onPress={handleSignOut}
              onHoverIn={() => { if (Platform.OS === 'web') setSignOutHovered(true); }}
              onHoverOut={() => { if (Platform.OS === 'web') setSignOutHovered(false); }}
              disabled={isSigningOut}
              activeOpacity={1.0}
            >
              <View style={[
                  profilestyles.actionButtonView,
                  profilestyles.signOutButtonView, // Applies background color
                  signOutHovered && Platform.OS === 'web' && profilestyles.signOutButtonHover,
              ]}>
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="log-out" size={16} color="#fff" style={profilestyles.buttonIcon} />
                    <Text style={profilestyles.actionButtonText}>Sign Out</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
          {/* End of Buttons Container */}

        </View>
        {/* End of Profile Card */}
      </ScrollView>
      {/* End of ScrollView */}

      {/* Image Options Modal */}
      {/* Modal for changing/removing profile picture */}
      <Modal
        visible={isImageOptionsModalVisible}
        animationType="fade" // Or "slide"
        transparent={true}
        onRequestClose={() => setIsImageOptionsModalVisible(false)} // Android back button
      >
        {/* Pressable Overlay to close modal when clicking outside */}
        <Pressable
          style={profilestyles.modalOverlay}
          onPress={() => setIsImageOptionsModalVisible(false)}
        >
          {/* Pressable Modal Box to prevent closing when clicking inside */}
          <Pressable style={profilestyles.modalBox}>
             <Text style={profilestyles.modalTitle}>Profile Picture Options</Text>

             {/* Change/Upload Image Button */}
             <TouchableOpacity
                style={profilestyles.modalButton}
                onPress={handleChangeImage} // Opens Library/Camera choice
             >
                <Icon name="image" size={18} color="#fff" style={profilestyles.modalButtonIcon} />
                <Text style={profilestyles.modalButtonText}>Change Picture</Text>
             </TouchableOpacity>

             {/* Remove Image Button */}
             {!isDefaultImage && (
                <TouchableOpacity
                   style={[profilestyles.modalButton, profilestyles.removeButton]}
                   onPress={handleRemoveImage}
                >
                   <Icon name="trash-2" size={18} color="#fff" style={profilestyles.modalButtonIcon} />
                   <Text style={profilestyles.modalButtonText}>Remove Picture</Text>
                </TouchableOpacity>
             )}

             {/* Cancel Button */}
             <TouchableOpacity
                style={[profilestyles.modalButton, profilestyles.cancelButton]}
                onPress={() => setIsImageOptionsModalVisible(false)}
             >
                <Icon name="x" size={18} color="#666" style={profilestyles.modalButtonIcon} />
                <Text style={[profilestyles.modalButtonText, profilestyles.cancelButtonText]}>Cancel</Text>
             </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View> 
  );
};

/* ---------------------------------------------------------------------
   Saved Mind Maps Screen 
--------------------------------------------------------------------- */
const SavedMindMapsScreen = () => {
  const navigation = useNavigation();
  const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';

  const [savedMindMaps, setSavedMindMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [mapToDelete, setMapToDelete] = useState(null);

  // Animated logo scale
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handleLogoPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Load fonts
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_700Bold,
  });

  // State for back-button hover/press
  const [backHover, setBackHover] = useState(false);
  const [backPress, setBackPress] = useState(false);

  // State for open-button hover/press (multiple items)
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [pressedItemId, setPressedItemId] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'mindMaps'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const maps = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSavedMindMaps(maps);
    });
    return unsubscribe;
  }, [userId]);

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  // Handlers
  const openRenameModal = (map) => {
    setSelectedMap(map);
    setNewTitle(map.title);
    setRenameModalVisible(true);
  };

  const handleRename = async () => {
    if (!selectedMap) return;
    try {
      await updateDoc(doc(db, 'mindMaps', selectedMap.id), { title: newTitle });
      setRenameModalVisible(false);
      setSelectedMap(null);
      setNewTitle('');
    } catch (err) {
      console.error('Rename failed:', err);
      Alert.alert('Error', 'Failed to rename mind map.');
    }
  };

  const confirmDelete = (map) => {
    setMapToDelete(map);
    setDeleteModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'mindMaps', id));
      Alert.alert('Deleted', 'Mind map deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('Error', 'Failed to delete mind map.');
    }
  };

  // Renders each list item
  const renderItem = ({ item, index }) => {
    const isHovering = hoveredItemId === item.id;
    const isPressing = pressedItemId === item.id;

    return (
      <View style={styles.mapItem}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.mapTitle}>{item.title}</Text>
            <Text style={styles.mapDate}>
              {item.createdAt ? item.createdAt.toDate().toLocaleString() : ''}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openRenameModal(item)}>
              <Icon name="edit" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => confirmDelete(item)}>
              <Icon name="trash-2" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onMouseEnter={() => {
            if (Platform.OS === 'web') {
              setHoveredItemId(item.id);
            }
          }}
          onMouseLeave={() => {
            if (Platform.OS === 'web') {
              setHoveredItemId(null);
            }
          }}
          onPressIn={() => setPressedItemId(item.id)}
          onPressOut={() => setPressedItemId(null)}
          style={[
            styles.openButton,
            (isHovering || isPressing) && styles.openButtonHover,
          ]}
          onPress={() => navigation.navigate('MindMap', { mindMapData: item.mindMapData })}
        >
          <Text style={styles.openButtonText}>Open Topic</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Background image */}
      <Image source={bgimage3} style={styles.backgroundImage} />

      {/* Top-left logo */}
      <View style={styles.logoContainer}>
        <TouchableOpacity
          onPress={handleLogoPress}
          onMouseEnter={() => {
            if (Platform.OS === 'web') {
              Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }}
          onMouseLeave={() => {
            if (Platform.OS === 'web') {
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }).start();
            }
          }}
          activeOpacity={0.8}
        >
          <Animated.Image
            source={logo}
            style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
          />
        </TouchableOpacity>
      </View>

      {/* Back button (below the logo) */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          onMouseEnter={() => {
            if (Platform.OS === 'web') {
              setBackHover(true);
            }
          }}
          onMouseLeave={() => {
            if (Platform.OS === 'web') {
              setBackHover(false);
            }
          }}
          onPressIn={() => setBackPress(true)}
          onPressOut={() => setBackPress(false)}
          style={[
            styles.backButton,
            (backHover || backPress) && styles.backButtonHover,
          ]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={16} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card container */}
        <View style={styles.card}>
          <Text style={styles.screenTitle}>Saved Mind Maps</Text>
          <FlatList
            style={styles.mindMapsList}
            data={savedMindMaps}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No saved mind maps</Text>}
          />
        </View>
      </ScrollView>

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Mind Map</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="New title"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                <Text style={styles.modalAction}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename}>
                <Text style={[styles.modalAction, { color: '#ff4d4d' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this mind map?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalAction}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (mapToDelete) {
                    handleDelete(mapToDelete.id);
                  }
                  setDeleteModalVisible(false);
                }}
              >
                <Text style={[styles.modalAction, { color: '#ff4d4d' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/* ---------------------------------------------------------------------
  Recommended Courses Screen (3 Cards Side-by-Side)

   ---------------------------------------------------------------*/
// generateRecommendations helper function
const generateRecommendations = async (interests, engagementData) => {
  // Ensuring inputs are arrays
  const validInterests = Array.isArray(interests) ? interests : [];
  const validEngagementData = Array.isArray(engagementData) ? engagementData : [];

  // Creating a list of topics for the prompt based on engagement data
  const engagementTopics = validEngagementData
    .map(t => {
      if (typeof t === 'object' && t.name) {
        const seconds = t.timeSpent ? Math.round(t.timeSpent / 1000) : 0;
        return `${t.name} (${seconds}s engagement)`;
      }
      return null;
    })
    .filter(Boolean);

  // Combining unique topics from both interests and engagement
  const combinedTopics = [...new Set([...validInterests, ...engagementTopics])];

  // Returning empty array if no topics are available
  if (combinedTopics.length === 0) {
    console.log("No interests or engagement data to generate recommendations from.");
    return [];
  }

  const topicsString = combinedTopics.join(', ');
  console.log("Generating recommendations based on combined data:", topicsString);

  // Constructing the prompt to send to the OpenAI API
  const prompt = `Based on the user's stated interests and recent engagement (${topicsString}), suggest exactly 20-30 diverse and relevant educational course topics or specific sub-topics they might be interested in exploring next. Focus on related concepts, deeper dives, or complementary areas. Output only a JSON array where each element is an object with two properties: { "keyword": "<topic keyword>", "displayText": "Learn More About <topic keyword>" }. Return nothing else besides the valid JSON array.`;

  try {

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',

        'Authorization': `Bearer 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`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Or 'gpt-4o'
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Recommendation API Error:", data);
      throw new Error(`API Error (${response.status}): ${data?.error?.message || 'Failed to generate recommendations'}`);
    }

    let content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("API returned empty content.");
    }

    console.log("Raw recommendations response:", content);
    // Attempting to extract a JSON array from the response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    } else {
      const firstBracket = content.indexOf('[');
      const lastBracket = content.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        content = content.substring(firstBracket, lastBracket + 1);
      } else {
        try {
          const parsedDirectly = JSON.parse(content);
          if (!Array.isArray(parsedDirectly)) {
            throw new Error("Parsed content is not an array.");
          }
        } catch (parseError) {
          console.error("Failed to parse content as JSON array:", parseError);
          throw new Error("Could not find or parse JSON array in response.");
        }
      }
    }

    const recommendations = JSON.parse(content);
    console.log("Parsed recommendations:", recommendations);

    // Filtering out any undefined or invalid recommendations
    const validRecommendations = Array.isArray(recommendations)
      ? recommendations.filter(item => item && item.keyword && item.displayText)
      : [];

    if (validRecommendations.length !== recommendations.length) {
      console.warn("Some recommendations were invalid and have been removed.");
    }
    
    return validRecommendations;
  } catch (error) {
    console.error("Error generating or parsing recommendations:", error);
    return []; // Return empty array on error
  }
};

// --- RecommendedScreen Component ---
const RecommendedScreen = ({ navigation }) => {
  // State variables for courses, loading state, and error messages
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInterests, setUserInterests] = useState(null);
  const [userEngagementData, setUserEngagementData] = useState(null);

  // Animation and font loading
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold
  });

  // Platform check
  const isWeb = RNPlatform.OS === 'web';

  // Fetcheing user interests and engagement data from Firestore
  const fetchUserData = useCallback(async () => {
    setError(null);
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setError("Please log in to see recommendations.");
      setLoading(false);
      setUserInterests([]);
      setUserEngagementData([]);
      return;
    }

    console.log("Fetching user data (interests & engagement) for user:", userId);
    const userDocRef = doc(db, 'users', userId);

    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const interests = data.interests;
        const engagement = data.engagement;
        setUserInterests(Array.isArray(interests) ? interests : []);
        console.log("Fetched interests:", Array.isArray(interests) ? interests : 'Not found or invalid format');
        setUserEngagementData(Array.isArray(engagement) ? engagement : []);
        console.log("Fetched engagement data:", Array.isArray(engagement) ? engagement : 'Not found or invalid format');
      } else {
        console.log("User document not found.");
        setUserInterests([]);
        setUserEngagementData([]);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Could not load your data. Please try again later.");
      setUserInterests([]);
      setUserEngagementData([]);
    }
  }, []);

  // Generateing recommendations using fetched data and sets state accordingly
  const generateAndSetRecommendations = useCallback(async () => {
    if (userInterests === null || userEngagementData === null) {
      console.log("Waiting for user data (interests and engagement)...");
      return;
    }
    setLoading(true);
    setError(null);

    if (userInterests.length === 0 && userEngagementData.length === 0) {
      console.log("No interests or engagement data available to generate recommendations.");
      setCourses([]);
      setLoading(false);
      return;
    }

    try {
      console.log("Calling generateRecommendations with interests:", userInterests, "and engagement:", userEngagementData);
      const recs = await generateRecommendations(userInterests, userEngagementData);
      setCourses(recs);
      if (recs.length === 0 && !error) {
        console.log("Recommendation generation returned no results.");
      }
    } catch (err) {
      console.error("Caught error during recommendation generation:", err);
      setError("Failed to generate recommendations. Please try again.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [userInterests, userEngagementData]);

  // Fetching user data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("RecommendedScreen focused, fetching user data...");
      setLoading(true);
      setUserInterests(null);
      setUserEngagementData(null);
      setCourses([]);
      setError(null);
      fetchUserData();
      return () => {
        console.log("RecommendedScreen unfocused");
      };
    }, [fetchUserData])
  );

  // Generating recommendations whenever the user data changes
  useEffect(() => {
    generateAndSetRecommendations();
  }, [generateAndSetRecommendations]);

  // Showing AppLoading while fonts are loading
  if (!fontsLoaded) {
    return <AppLoading />;
  }

  // Safeguarded render function for each recommendation item
  const renderItem = ({ item, index }) => {
    if (!item || !item.displayText) {
      return null;
    }

    return (
      <TouchableOpacity
        key={index}
        style={recommendedStyles.recCard}
        onPress={() => navigation.navigate('TopicDetail', { topic: item.keyword })}
        activeOpacity={0.8}
      >
        <Text style={recommendedStyles.recCardText}>{item.displayText}</Text>
      </TouchableOpacity>
    );
  };

  // Animation handlers
  const handleLogoPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: RNPlatform.OS !== 'web' }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: RNPlatform.OS !== 'web' })
    ]).start();
  };
  const onHoverIn = () => { if (isWeb) Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: false }).start(); };
  const onHoverOut = () => { if (isWeb) Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start(); };

  // Rendering the RecommendedScreen UI
return (
  <SafeAreaView style={recommendedStyles.container}>
    {/* Background Image */}
    <Image 
      source={background} 
      style={recommendedStyles.backgroundImage} 
     />

    {/* Logo with touch and hover animations */}
    <View style={recommendedStyles.logoContainer}>
      <TouchableOpacity
        onPress={handleLogoPress}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
        activeOpacity={0.8}
      >
        <Animated.Image
          source={logo} 
          style={[recommendedStyles.logo, { transform: [{ scale: scaleAnim }] }]}
        />
      </TouchableOpacity>
    </View>

    {/* Main content area with scrolling */}
    <ScrollView contentContainerStyle={recommendedStyles.scrollContent}>
      {/* White Card Container */}
      <View style={recommendedStyles.cardContainer}>
        {/* Heading */}
        <Text style={recommendedStyles.heading}>Recommended for You</Text>

        {/* Conditional Rendering: Loading / Error / No Recs / List */}
        {loading ? (
          // Loading State
          <View style={recommendedStyles.centeredMessageContainer}>
            <ActivityIndicator size="large" color="#473c38" />
          </View>
        ) : error ? (
          // Error State
          <View style={recommendedStyles.centeredMessageContainer}>
            <Text style={recommendedStyles.errorText}>{error}</Text>
          </View>
        ) : courses.length === 0 ? (
          // No Recommendations State
          <View style={recommendedStyles.centeredMessageContainer}>
            <Text style={recommendedStyles.noRecsText}>
              No recommendations available. Explore some topics to get started!
            </Text>
          </View>
        ) : (
          // Recommendations List State (Using FlatList)
          <FlatList
            data={courses.filter(item => item && item.displayText)} // Filtered data source
            renderItem={renderItem} // Function to render each item
            // Key extractor for list optimization
            keyExtractor={(item, index) => item.keyword ? `${item.keyword}-${index}` : index.toString()} 
            style={{ width: '100%', maxHeight: 500 }} // Styles for the list container
            contentContainerStyle={recommendedStyles.listContainer} // Styles for the content within the list
            showsVerticalScrollIndicator={true} // Show scroll indicator
          />
        )}
      </View> 
    </ScrollView> 
  </SafeAreaView>
  );
};

  
const styles = StyleSheet.create({
  /* Background */
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },

  /* Logo */
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },

  /* Back button */
  backButtonContainer: {
    position: 'absolute',
    top: 140,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#473c38',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonHover: {
    backgroundColor: 'orange',
  },
  backButtonText: {
    marginLeft: 6,
    color: '#fff',
    fontFamily: 'Quicksand_700Bold',
    fontSize: 14,
  },

  /* Main scrollable content */
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 30,
    paddingTop: 90, 
  },

  /* Card container */
  card: {
    width: '85%',
    maxWidth: 700,
    minHeight: 400,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    padding: 20,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  screenTitle: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 24,
    color: '#473c38',
    textAlign: 'center',
    marginBottom: 20,
  },

  /* FlatList */
  mindMapsList: {
    width: '100%',
  },
  emptyText: {
    marginTop: 30,
    fontFamily: 'Quicksand_400Regular',
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },

  /* Each mind-map item */
  mapItem: {
    width: '100%',
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapTitle: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 17,
    color: '#222',
  },
  mapDate: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: '#2C2C2C',
    padding: 10,
    borderRadius: 10,
    marginLeft: 8,
  },

  /* Open Mind Map button */
  openButton: {
    marginTop: 12,
    backgroundColor: '#473c38', // Dark brown
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  openButtonHover: {
    backgroundColor: 'orange',
  },
  openButtonText: {
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
    fontSize: 15,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '60%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 20,
    color: '#1E1E1E',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginVertical: 10,
  },
  input: {
    fontFamily: 'Quicksand_400Regular',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    width: '50%',
    alignSelf: 'center',
    padding: 10,
    fontSize: 14,
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalAction: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginHorizontal: 30,
  },
});
/* ---------------------------------------------------------------------
   Bottom Tabs and Stack Navigators
--------------------------------------------------------------------- */
const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="SavedMindMaps" component={SavedMindMapsScreen} />
  </ProfileStack.Navigator>
);

const DashboardTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarLabelStyle: { 
        fontFamily: 'Quicksand_400Regular', 
        fontSize: 12, 
        marginBottom: 5 
      },
      tabBarActiveTintColor: '#fff',
      tabBarInactiveTintColor: '#ddd',
      tabBarStyle: {
        backgroundColor: '#473c38',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: 60,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 10,
      },
    }}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardTab}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Image 
            source={dashboardIcon} 
            style={{ tintColor: color, width: size, height: size }} 
          />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStackNavigator}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Image 
            source={require('./assets/profile-icon.png')} 
            style={{ tintColor: color, width: size, height: size }} 
          />
        ),
      }}
    />
    <Tab.Screen
      name="Recommended"
      component={RecommendedScreen} 
      options={{
        tabBarIcon: ({ color, size }) => (
          <Image 
            source={require('./assets/recommended-icon.png')} 
            style={{ tintColor: color, width: size, height: size }} 
          />
        ),
      }}
    />
  </Tab.Navigator>
);

const MainStackNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="DashboardTabs" component={DashboardTabs} />
    <MainStack.Screen name="MindMap" component={MindMapScreen} />
    <MainStack.Screen name="TopicDetail" component={TopicDetailScreen} />
    <MainStack.Screen name="SavedMindMaps" component={SavedMindMapsScreen} />
  </MainStack.Navigator>
);

export default MainStackNavigator;
export { generateMindMapData };
