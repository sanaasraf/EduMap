import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
  AppState // Import AppState
} from 'react-native';
// import AppLoading from 'expo-app-loading'; // Deprecated
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for save icon
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
// Updated Firestore imports
import { db, auth } from './firebaseconfig'; // Ensure auth is exported from your config
// Import necessary Firestore functions including arrayUnion
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';

// --- Logo Assets ---
// Assuming these are correctly imported from your assets folder
import bgimage10      from './assets/bgimage10.png';
import logo           from './assets/logo.png';
import courseraLogo   from './assets/coursera.png';
import udemyLogo      from './assets/udemy.png';
import edxLogo        from './assets/edx.png';
import linkedinLogo   from './assets/linkedin.png';
import udacityLogo    from './assets/udacity.png';
import skillshareLogo from './assets/skillshare.png';
import pluralsightLogo from './assets/pluralsight.png';
import simplilearnLogo from './assets/simplilearn.png';
import khanAcademyLogo from './assets/khanacademy.png';
// --- End Logo Imports ---


// --- OpenAI API Key (Only used for Summary now) ---
// IMPORTANT: Avoid hardcoding API keys in production apps. Use environment variables or a secure config service.
const OPENAI_API_KEY = `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`; // Replace with your actual key or use secure method

// List of platforms for which search links will be generated
const PLATFORMS = [
    'Coursera',
    'Udemy',
    'edX',
    'LinkedIn Learning',
    'Udacity',
    'Skillshare',
    'Pluralsight',
    'Simplilearn',
    'Khan Academy'
];

// Map Platform Names to Imported Logo Variables
const PLATFORM_LOGOS = {
  'Coursera':         courseraLogo,
  'Udemy':            udemyLogo,
  'edX':              edxLogo,
  'LinkedIn Learning': linkedinLogo,
  'Udacity':          udacityLogo,
  'Skillshare':       skillshareLogo,
  'Pluralsight':      pluralsightLogo,
  'Simplilearn':      simplilearnLogo,
  'Khan Academy':     khanAcademyLogo,
};

// Search URL builder (Generates search links for each platform)
const makeSearchURL = (platform, topic) => {
  const q = encodeURIComponent(topic);
  switch (platform) {
    case 'Coursera': return `https://www.coursera.org/search?query=${q}`;
    case 'Udemy':    return `https://www.udemy.com/courses/search/?q=${q}`;
    case 'edX':      return `https://www.edx.org/search?tab=course&q=${q}`;
    case 'LinkedIn Learning': return `https://www.linkedin.com/learning/search?keywords=${q}`;
    case 'Udacity': return `https://www.udacity.com/courses/all?search=${q}`;
    case 'Skillshare': return `https://www.skillshare.com/en/search?query=${q}`;
    case 'Pluralsight': return `https://www.pluralsight.com/search?q=${q}`;
    case 'Simplilearn': return `https://www.simplilearn.com/search?query=${q}`;
    case 'Khan Academy': return `https://www.khanacademy.org/search?page_search_query=${q}`;
    default: return '';
  }
};

export default function TopicDetailScreen({ route }) {
  const navigation = useNavigation();
  // Use only the single 'topic' parameter passed via navigation
  const { topic } = route.params || {};

  // State Hooks
  const [fontsLoaded, fontError] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold,
  });

  const [summary, setSummary] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [courses, setCourses] = useState([]); // Holds search links
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState(null);

  const [annotations, setAnnotations] = useState([]);
  const [selBlock, setSelBlock] = useState(null); // Index of block being edited
  const [noteText, setNoteText] = useState(''); // Text for the edit modal input
  const [showModal, setShowModal] = useState(false); // Visibility for EDIT modal
  const [highlightMode, setHighlightMode] = useState(false); // Toggle between highlight/annotate

  // --- State for View-Only Annotation Modal ---
  const [showViewModal, setShowViewModal] = useState(false); // Visibility for VIEW modal
  const [viewNoteText, setViewNoteText] = useState('');      // Holds the note text to display in VIEW modal
  const [viewBlockText, setViewBlockText] = useState('');    // Optional: Holds the original text block being viewed

  // --- State for Saved Topic ---
  const [isTopicSaved, setIsTopicSaved] = useState(false); // Tracks if the current topic is saved
  const [loadingSavedStatus, setLoadingSavedStatus] = useState(false); // Loading indicator for save status check

  // Animation Ref for logo scaling
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- Added for Time Tracking ---
  const startTimeRef = useRef(null); // Ref to store the time when the topic screen was entered
  const appState = useRef(AppState.currentState); // Ref to track app state (active/background)
  // --- End Time Tracking Add ---

  // ─── Helper Functions ───────────────────────────────────────────────────
  const parse = txt => txt.split('\n').map(l => l.trim()).filter(l => l);
  const renderInline = t => {
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|"[^"]+")/g;
    const parts = []; let last = 0, m;
    while ((m = re.exec(t))) {
      if (m.index > last) parts.push({ text: t.slice(last, m.index) });
      const s = m[0];
      if (s.startsWith('**') && s.endsWith('**')) parts.push({ text: s.slice(2, -2), style: styles.bold });
      else if (s.startsWith('*') && s.endsWith('*')) parts.push({ text: s.slice(1, -1), style: styles.italic });
      else if (s.startsWith('"') && s.endsWith('"')) parts.push({ text: s.slice(1, -1), style: styles.italic });
      else parts.push({text: s});
      last = m.index + s.length;
    }
    if (last < t.length) parts.push({ text: t.slice(last) });
    return parts.map((p, i) => ( <Text key={i} style={[styles.text, p.style]}>{p.text}</Text> ));
   };
  const blockType = b => /^[-•]\s/.test(b) ? 'bullet' : b.endsWith(':') && b.split(' ').length < 10 ? 'heading' : 'para';

  // ─── Data Fetching Functions ───────────────────────────────────────────

  /*
    Fetches the summary from OpenAI for the current topic.
   */
  const getSummary = async () => {
    // Using the 'topic' variable derived from route.params and ensuring it exists.
    if (!topic) return;
    // Setting the loading state for summary to true.
    setLoadingSummary(true);
    // Clearing any previous summary error.
    setSummaryError(null);
    // Clearing any previous summary text and block data.
    setSummary('');
    setBlocks([]);
    // Logging the topic for which the summary is being fetched.
    console.log(`Fetching summary for: "${topic}"`);
    try {
      // Constructing a prompt that is instructing the API to produce a structured write-up.
      const prompt = `Give a structured write-up on "${topic}". Include descriptive paragraphs, headings (end with ":"), bullet points ("-"/"•") where appropriate, and use **bold**, *italic*, and "quotes" for emphasis. Keep it concise and informative.`;
      // Making an API call to OpenAI's chat completions endpoint with the constructed prompt.
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Using the API key (ensure to securely store and manage this key)
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        // Sending the request with the chosen model, message content, and max tokens.
        body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }], max_tokens: 2000 })
      });
      // Parsing the response into JSON.
      const j = await res.json();
      // Checking if the response status is not OK, then handling the error.
      if (!res.ok) {
        console.error('OpenAI Summary API Error:', res.status, j);
        const errorMsg = `API Error (${res.status}): ${j?.error?.message || 'Failed to fetch summary'}`;
        // Setting the summary error to show in the UI.
        setSummaryError(errorMsg);
        // Not throwing here to let the UI display the error message.
      } else {
        // Extracting and trimming the summary text from the API response.
        const txt = j.choices?.[0]?.message?.content?.trim() || '';
        console.log('📝 OpenAI summary fetched successfully.');
        // Warning if the returned summary text is empty.
        if (!txt) console.warn('OpenAI returned an empty summary.');
        // Updating the state with the summary text and parsing it into blocks.
        setSummary(txt);
        setBlocks(parse(txt));
      }
    } catch (e) {
      // Logging any error encountered during the fetching process.
      console.error('Error fetching summary:', e);
      // Setting the summary error if no previous error was set.
      if (!summaryError) setSummaryError(`Failed to get summary: ${e.message}`);
      // Clearing the summary and block state on error.
      setSummary('');
      setBlocks([]);
    } finally {
      // Setting the loading state for summary to false once all is done.
      setLoadingSummary(false);
    }
  };
  
  /*
   * Generating search links for the current single topic on all defined platforms.
   */
  const getCourses = () => {
    // Using the 'topic' variable derived from route.params and ensuring it exists.
    if (!topic) return;
    // Setting the loading state for courses to true.
    setLoadingCourses(true);
    // Clearing any previous courses error.
    setCoursesError(null);
    // Logging the process of generating search links for the topic and the number of platforms.
    console.log(`Generating search links for topic: "${topic}" on ${PLATFORMS.length} platforms.`);
    try {
      // Mapping over the defined platforms to generate search links for the single topic.
      const searchLinks = PLATFORMS.map(pl => ({
        platform: pl,
        // Constructing a title indicating recommended courses on each platform.
        title: `Recommended Courses on ${pl}`,
        // Generating the search URL for the given platform and topic.
        url: makeSearchURL(pl, topic),
        // Marking these links as fallback recommendations.
        isFallback: true
      }));
      // Updating the state with the newly generated search links.
      setCourses(searchLinks);
    } catch (e) {
      // Logging any error encountered while generating the search links.
      console.error("Error generating search links:", e);
      // Setting the courses error state and clearing courses data.
      setCoursesError("Failed to generate course links.");
      setCourses([]);
    } finally {
      // Ending the courses loading state.
      setLoadingCourses(false);
    }
  };
  // --- End of getCourses ---
  
  // --- Added: Function to Save Engagement Time ---
  const saveEngagementTime = async (currentTopic, durationMs) => {
    // Checking if the topic is valid and if duration is greater than zero.
    if (!currentTopic || durationMs <= 0) {
      console.log("Invalid topic or duration, skipping save.");
      return; // Skipping saving if topic is invalid or duration is non-positive.
    }
    // Retrieving the current user's ID.
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log("No user logged in, cannot save engagement time.");
      return; // Skipping saving if no user is logged in.
    }
    // Logging the engagement details including user, topic, and duration.
    console.log(`Saving engagement: User ${userId}, Topic "${currentTopic}", Duration ${durationMs}ms`);
    // Creating a reference to the user's document in Firestore.
    const userDocRef = doc(db, 'users', userId);
  
    try {
      // Retrieving the user document snapshot from Firestore.
      const docSnap = await getDoc(userDocRef);
      let currentEngagement = [];
  
      // If the user document exists, extracting the current engagement data.
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensuring that the engagement field exists and is an array.
        if (Array.isArray(data.engagement)) {
          currentEngagement = data.engagement;
        }
      } else {
        // Logging that the user document is missing and suggesting creation.
        console.log("User document does not exist. Cannot save engagement. Consider creating it.");
        // Returning early since there is no user document.
        return;
      }
  
      // Checking if the current topic already exists in the engagement array.
      const existingTopicIndex = currentEngagement.findIndex(item => item.name === currentTopic);
      let updatedEngagement;
      if (existingTopicIndex > -1) {
        // Logging that the topic is being updated with additional time.
        console.log(`Updating time for "${currentTopic}": ${(currentEngagement[existingTopicIndex].timeSpent || 0)} + ${durationMs}`);
        // Mapping through the engagement array and updating the timeSpent for the existing topic.
        updatedEngagement = currentEngagement.map((item, index) => {
          if (index === existingTopicIndex) {
            return {
              ...item,
              timeSpent: (item.timeSpent || 0) + durationMs
            };
          }
          return item;
        });
      } else {
        // Logging that a new topic engagement entry is being added.
        console.log(`Adding new topic "${currentTopic}" with duration ${durationMs}ms`);
        // Appending a new engagement object for the current topic.
        updatedEngagement = [
          ...currentEngagement,
          { name: currentTopic, timeSpent: durationMs }
        ];
      }
  
      // Updating the Firestore user document with the new engagement data.
      await updateDoc(userDocRef, {
        engagement: updatedEngagement
      });
      console.log("Engagement time saved successfully.");
  
    } catch (error) {
      // Logging any errors encountered during the engagement time saving process.
      console.error("Error saving engagement time:", error);

    }
  };




  

  // --- Added: Function to handle saving the current topic ---
  const handleSaveTopic = async () => {
      if (!topic || isTopicSaved) {
          console.log("Topic is empty or already saved.");
          return; // Don't save if no topic or already saved
      }
      const userId = auth.currentUser?.uid;
      if (!userId) {
          Alert.alert("Login Required", "You need to be logged in to save topics.");
          return;
      }

      const userDocRef = doc(db, 'users', userId);
      console.log(`Attempting to save topic "${topic}" for user ${userId}`);

      try {
          // Use updateDoc with arrayUnion to add the topic if it doesn't exist in the array
          // This automatically handles duplicates.
          await updateDoc(userDocRef, {
              savedTopics: arrayUnion(topic) // Add the topic to the 'savedTopics' array
          });

          // If updateDoc succeeds, it means the topic was added (or already existed)
          setIsTopicSaved(true); // Update state to reflect saved status
          Alert.alert("Topic Saved", `"${topic}" has been added to your saved topics.`);
          console.log(`Topic "${topic}" saved successfully.`);

      } catch (error) {
          console.error("Error saving topic:", error);
          // Check if the error is because the document or field doesn't exist
          if (error.code === 'not-found' || (error.message && error.message.includes("No document to update"))) {
              // Document or field might not exist, try creating it with setDoc
              console.log("User document or savedTopics field might be missing, attempting to create/update with setDoc.");
              try {
                  await setDoc(userDocRef,
                      { savedTopics: [topic] }, // Create the array with the current topic
                      { merge: true } // Use merge: true to avoid overwriting other user data
                  );
                  setIsTopicSaved(true);
                  Alert.alert("Topic Saved", `"${topic}" has been added to your saved topics.`);
                  console.log(`Topic "${topic}" saved successfully using setDoc.`);
              } catch (setDocError) {
                  console.error("Error saving topic with setDoc:", setDocError);
                  Alert.alert("Error", "Could not save the topic. Please try again.");
              }
          } else {
              // Handle other potential errors
              Alert.alert("Error", "Could not save the topic. Please try again.");
          }
      }
  };
  // --- End handleSaveTopic ---


  // ─── Annotation Handlers ───────────────────────────────────────────────

  /**
   * Handles single tap on a text block.
   * - In Highlight Mode: Toggles a simple highlight (yellow background) if the block has no note. Does nothing if it has a note.
   * - In Annotation Mode: If the block has a note, opens the View-Only Modal. Otherwise, does nothing.
   */
  const pressBlock = i => {
    if (highlightMode) {
      // --- Highlight Mode Logic ---
      const exIndex = annotations.findIndex(a => a.blockIndex === i);
      if (exIndex > -1) {
        // Block is already annotated/highlighted
        if (annotations[exIndex].note === '') {
          // It's just a highlight (no note), remove it on tap
          setAnnotations(prev => prev.filter(a => a.blockIndex !== i));
        } else {
          // It has a note, tapping in highlight mode does nothing to prevent accidental removal
          console.log("Cannot modify annotation with note in highlight mode via tap.");
        }
      } else {
        // Block is not highlighted/annotated, add a simple highlight
        setAnnotations(prev => [...prev, { blockIndex: i, note: '' }]);
      }
      // --- End Highlight Mode Logic ---

    } else {
      // --- Annotation Mode Logic (View on Tap) ---
      // Check if there's an annotation WITH a non-empty note for this block
      const annotation = annotations.find(a => a.blockIndex === i && a.note && a.note.trim() !== '');
      if (annotation) {
        // Found an annotation with a note, show the view modal
        setViewBlockText(blocks[i]); // Store original block text for context
        setViewNoteText(annotation.note); // Store the note to display
        setShowViewModal(true); // Show the view modal
      } else {
        // No note to view (either no annotation or annotation has empty note).
        // Single tap does nothing in this case when not in annotation mode.
        // Long press is still used for editing/creating.
        console.log("Single tap in annotation mode: No note to view for this block.");
      }
      // --- End Annotation Mode Logic ---
    }
  };

  /**
   * Handles long press on a text block.
   * Opens the EDIT Modal to add or modify a note. Only active when NOT in highlightMode.
   */
  const longPressBlock = i => {
    if (highlightMode) return; // Long press does nothing in highlight mode
    setSelBlock(i); // Set the index of the block being edited
    const ex = annotations.find(a => a.blockIndex === i);
    setNoteText(ex?.note || ''); // Pre-fill input with existing note or empty string
    setShowModal(true); // Show the EDIT modal
  };

  /**
   * Saves the note from the EDIT modal. Updates or adds the annotation.
   */
  const saveNote = () => {
    if (selBlock === null) return;
    const trimmedNote = noteText.trim();
    setAnnotations(prev => {
        const existingIndex = prev.findIndex(a => a.blockIndex === selBlock);
        if (existingIndex > -1) {
            // Update existing annotation
            if (trimmedNote === '') {
                // If note is cleared, keep the highlight but remove the note text
                const updatedAnnotations = [...prev];
                updatedAnnotations[existingIndex] = { ...prev[existingIndex], note: '' };
                return updatedAnnotations;
            } else {
                // Update note text
                const updatedAnnotations = [...prev];
                updatedAnnotations[existingIndex] = { ...prev[existingIndex], note: trimmedNote };
                return updatedAnnotations;
            }
        } else {
            // Add new annotation only if there's text
            if (trimmedNote !== '') {
                return [...prev, { blockIndex: selBlock, note: trimmedNote }];
            }
        }
        return prev; // Return previous state if no changes needed
    });
    closeModal();
  };

  /**
   * Deletes the annotation (both highlight and note) from the EDIT modal.
   */
  const deleteAnnotation = () => {
    if (selBlock === null) return;
    setAnnotations(prev => prev.filter(a => a.blockIndex !== selBlock));
    closeModal();
  };

  /**
   * Closes the EDIT modal and resets related state.
   */
  const closeModal = () => { setShowModal(false); setNoteText(''); setSelBlock(null); };

  /**
   * Renders a single text block (paragraph, heading, bullet) with appropriate styling and annotation highlights.
   */
  const renderBlock = (b, i) => {
    const type = blockType(b);
    const ann = annotations.find(a => a.blockIndex === i);
    // Apply highlight style based on whether there's a note
    const contStyle = [
        styles.block,
        // Use original highlight styles
        ann ? (ann.note && ann.note.trim() !== '' ? styles.noteHighlight : styles.hlHighlight) : null
    ];
    const textStyle = type === 'heading' ? styles.heading : type === 'bullet' ? styles.bullet : styles.para;
    return (
      <TouchableOpacity
        key={i}
        activeOpacity={0.8} // Provide visual feedback on press
        onPress={() => pressBlock(i)}
        onLongPress={() => longPressBlock(i)}
        delayLongPress={300} // Standard long press delay
      >
        <View style={contStyle}>
          {type === 'bullet' ? ( <Text style={textStyle}> • {renderInline(b.replace(/^[-•]\s+/, ''))} </Text> )
           : ( <Text style={textStyle}>{renderInline(b)}</Text> )}
        </View>
      </TouchableOpacity>
    );
  };

  // Animation Handlers for Logo
  const onHoverIn = () => Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
  const onHoverOut = () => Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();

  // Link Opener
  const openLink = async (u) => {
      try {
          await WebBrowser.openBrowserAsync(u);
      } catch (error) {
          console.error("Failed to open link:", error);
          // Optionally show an error message to the user
      }
  };



  // ─── Lifecycle Effects ───────────────────────────────────────────────────

  // Effect for fetching data, checking saved status, AND starting/stopping timer
  useEffect(() => {
    let localStartTime = null; // Use a local variable for the start time within this effect instance
    let isMounted = true; // Track mount status for async operations

    // --- Function to check if the current topic is saved ---
    const checkSavedStatus = async (currentTopic) => {
        const userId = auth.currentUser?.uid;
        if (!userId || !currentTopic) {
            if (isMounted) setIsTopicSaved(false); // Reset if no user or topic
            return;
        }
        if (isMounted) setLoadingSavedStatus(true);
        const userDocRef = doc(db, 'users', userId);
        try {
            console.log(`Checking saved status for topic: "${currentTopic}" for user: ${userId}`);
            const docSnap = await getDoc(userDocRef);
            if (isMounted) { // Check if component is still mounted before setting state
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const savedTopics = data.savedTopics || []; // Default to empty array if field doesn't exist
                    const isSaved = savedTopics.includes(currentTopic);
                    setIsTopicSaved(isSaved);
                    console.log(`Topic "${currentTopic}" saved status: ${isSaved}`);
                } else {
                    setIsTopicSaved(false); // User doc doesn't exist
                    console.log(`User doc not found, topic "${currentTopic}" cannot be saved yet.`);
                }
            }
        } catch (error) {
            console.error("Error checking saved topic status:", error);
            if (isMounted) setIsTopicSaved(false); // Assume not saved on error
        } finally {
            if (isMounted) setLoadingSavedStatus(false);
        }
    };
    // --- End checkSavedStatus ---


    if (topic) {
        console.log(`Topic changed to: ${topic}. Fetching data, checking saved status, and starting timer.`);
        // Reset previous data/errors
        setSummary(''); setBlocks([]); setAnnotations([]); // Clear annotations for new topic
        setCourses([]);
        setSummaryError(null); setCoursesError(null);
        setIsTopicSaved(false); // Reset saved status initially

        // Fetch new data
        getSummary();
        getCourses();
        checkSavedStatus(topic); // Check if this new topic is saved

        // Record the start time when the topic becomes active
        localStartTime = Date.now();
        startTimeRef.current = localStartTime; // Also store in ref for AppState access
    } else {
        // Handle case where no topic is provided
        setSummaryError("No topic selected.");
        setCoursesError("No topic selected.");
        setSummary(''); setBlocks([]); setAnnotations([]);
        setCourses([]);
        setIsTopicSaved(false);
        startTimeRef.current = null; // Reset start time ref
    }

    // --- Cleanup function for Time Tracking ---
    // This runs when the component unmounts OR BEFORE the effect runs again due to 'topic' changing
    return () => {
        isMounted = false; // Set mounted status to false on cleanup
        // Use the localStartTime captured when this effect instance ran
        if (localStartTime && topic) { // Ensure there was a start time and a topic for this instance
            const endTime = Date.now();
            const durationMs = endTime - localStartTime;
            // Only save if duration is meaningful (e.g., more than a few seconds)
            if (durationMs > 3000) { // Example: only save if > 3 seconds
                saveEngagementTime(topic, durationMs);
            } else {
                console.log(`Duration for topic "${topic}" (${durationMs}ms) too short, not saving via unmount/topic change.`);
            }
            // No need to reset startTimeRef here, the next effect run will set it
        }
    };
    // --- End Cleanup ---

  }, [topic]); // Dependency: Run when 'topic' changes




  // --- Effect to handle AppState changes (background/foreground) ---
  useEffect(() => {
      const subscription = AppState.addEventListener('change', nextAppState => {
          const currentAppState = appState.current; // Get current state from ref
          if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
              // App has come to the foreground
              console.log('App has come to foreground');
              // Reset start time to now to avoid counting background time
              if (topic) { // Only reset if there's an active topic
                  startTimeRef.current = Date.now();
                  console.log(`Foreground detected, timer reset for topic "${topic}".`);
              }
          } else if (nextAppState.match(/inactive|background/) && currentAppState === 'active' ) {
              // App has gone to the background
              console.log('App has gone to background');
              // Save time spent so far when app goes to background
              if (startTimeRef.current && topic) {
                  const endTime = Date.now();
                  const durationMs = endTime - startTimeRef.current;
                  if (durationMs > 1000) { // Save even shorter durations if going to background
                      console.log(`Saving time for "${topic}" due to backgrounding.`);
                      saveEngagementTime(topic, durationMs);
                      // Reset start time *after* saving to prevent double counting if app is immediately reopened
                      startTimeRef.current = null;
                  } else {
                      console.log(`Duration for "${topic}" (${durationMs}ms) too short, not saving on backgrounding.`);
                      // Optionally reset startTimeRef.current = null; here too if you never want short background intervals counted
                  }
              }
          }
          // Update the ref AFTER processing the change
          appState.current = nextAppState;
          console.log('AppState changed to:', appState.current);
      });

      // Cleanup subscription on component unmount
      return () => {
          console.log("Removing AppState listener.");
          subscription.remove();
          // Save any remaining time when the component unmounts completely
          if (startTimeRef.current && topic) {
              const endTime = Date.now();
              const durationMs = endTime - startTimeRef.current;
              if (durationMs > 1000) { // Threshold for final unmount save
                  console.log(`Saving final time for "${topic}" on unmount.`);
                  saveEngagementTime(topic, durationMs);
              }
              startTimeRef.current = null; // Clear ref on unmount
          }
      };
  }, [topic]); // Re-run if topic changes to ensure saveEngagementTime uses the correct topic
  // --- End AppState Effect ---


  // Load Annotations Effect
  useEffect(() => {
      if (!topic || !auth.currentUser?.uid) { // Ensure topic and user ID exist
        setAnnotations([]); // Clear annotations if no topic or user
        return;
      }
      let isMounted = true;
      const userId = auth.currentUser.uid;
      // Use a path that includes the user ID to keep annotations user-specific
      const annotationsDocPath = `users/${userId}/userAnnotations/${topic}`;
      const docRef = doc(db, annotationsDocPath);

      const loadAnnotations = async () => {
          console.log(`Loading annotations for topic: ${topic} for user: ${userId}`);
          try {
              const docSnap = await getDoc(docRef);
              if (isMounted) {
                  if (docSnap.exists()) {
                      const data = docSnap.data();
                      console.log("Annotations loaded:", data.annotations ? data.annotations.length : 0);
                      // Ensure loaded data is an array
                      setAnnotations(Array.isArray(data.annotations) ? data.annotations : []);
                  } else {
                      console.log("No existing annotations document for this user/topic.");
                      setAnnotations([]);
                  }
              }
          } catch (error) {
              console.error("Error loading annotations:", error);
              if (isMounted) { setAnnotations([]); } // Reset on error
          }
      };
      loadAnnotations();
      return () => { isMounted = false; };
  }, [topic]); // Reload when topic changes


  // Save Annotations Effect (Debounced)
  useEffect(() => {
      if (!topic || !auth.currentUser?.uid) return; // Don't save if no topic or user

      // Debounce function definition
      const debounce = (func, delay) => {
          let timeoutId;
          return (...args) => {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                  func.apply(this, args);
              }, delay);
          };
      };

      // Function to save annotations to Firestore
      const saveAnnotationsToFirestore = async (currentAnnotations) => {
          if (!Array.isArray(currentAnnotations)) {
              console.error("Attempted to save non-array annotations:", currentAnnotations);
              return;
          }
          const userId = auth.currentUser.uid;
          const annotationsDocPath = `users/${userId}/userAnnotations/${topic}`;
          console.log(`Debounced save triggered. Saving ${currentAnnotations.length} annotations for topic: ${topic} to path: ${annotationsDocPath}`);
          try {
              // Use setDoc with merge: true to create/update the document
              await setDoc(doc(db, annotationsDocPath), { annotations: currentAnnotations }, { merge: true });
              console.log("Annotations saved.");
          } catch (error) {
              console.error("Error saving annotations:", error);
          }
      };

      // Create debounced version of the save function
      const debouncedSave = debounce(saveAnnotationsToFirestore, 1500); // 1.5 second debounce delay

      // Call the debounced save function whenever 'annotations' state changes
      // Pass the current state directly to the debounced function
      debouncedSave(annotations);

  }, [annotations, topic]); // Trigger effect when annotations or topic change


  // ─── Render Logic ───────────────────────────────────────────────────────

    if (!fontsLoaded && !fontError) { return <ActivityIndicator size="large" style={styles.centeredMessage} color="#8B4513" />; }
    if (fontError) { return <View style={styles.centeredMessage}><Text style={styles.errorText}>Error loading fonts.</Text></View>; }
    // Show loading only if fonts are loaded but we are still fetching initial data
    const showInitialLoading = fontsLoaded && !topic && (loadingSummary || loadingCourses);
    if (showInitialLoading) { return <ActivityIndicator size="large" style={styles.centeredMessage} color="#8B4513" />; }
    // Show message if fonts loaded but no topic provided and not loading
    if (fontsLoaded && !topic && !loadingSummary && !loadingCourses) { return ( <SafeAreaView style={styles.container}><View style={styles.centeredMessage}><Text style={styles.para}>No topic provided.</Text></View></SafeAreaView> ); }


  return (
    <SafeAreaView style={styles.container}>
      <Image source={bgimage10} style={styles.bg} />

      {/* Header Area - Reverted to original layout */}
      <View style={styles.logoRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} onMouseEnter={onHoverIn} onMouseLeave={onHoverOut} >
          {/* Reverted logo size */}
          <Animated.Image source={logo} style={[styles.logo, { transform: [{ scale: scaleAnim }] }]} />
        </TouchableOpacity>
        {/* Back button below logo with updated text */}
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} >
          <Text style={styles.backBtnText}>&lt;- Back</Text>
        </Pressable>
      </View>

      {/* Main Content Area - Reverted marginTop */}
      <View style={styles.contentRow}>
        {/* === LEFT PANEL: SUMMARY === */}
        <View style={styles.left}>
          {/* Topic Title and Save Button Row */}
          <View style={styles.topicHeaderRow}>
              <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{topic || 'Loading Topic...'}</Text>
              {/* Save Topic Button */}
              <TouchableOpacity
                  onPress={handleSaveTopic}
                  disabled={isTopicSaved || loadingSavedStatus} // Disable if saved or currently checking status
                  style={styles.saveButton}
              >
                  {loadingSavedStatus ? (
                      <ActivityIndicator size="small" color="#8B4513" />
                  ) : (
                      <Ionicons
                          name={isTopicSaved ? "bookmark" : "bookmark-outline"} // Filled icon if saved, outline if not
                          size={28}
                          color={isTopicSaved ? "#FFC107" : "#8B4513"} // Gold if saved, brown if not
                      />
                  )}
              </TouchableOpacity>
          </View>

          {loadingSummary ? ( <ActivityIndicator size="large" style={styles.loadingIndicator} color="#8B4513"/> )
           : summaryError ? ( <View style={styles.card}><Text style={styles.errorText}>{summaryError}</Text></View> )
           : ( <View style={styles.card}>
                <View style={styles.penRow}>
                  <TouchableOpacity onPress={() => setHighlightMode(h => !h)} style={styles.penButton}>
                    {/* Reverted icon color logic */}
                    <Ionicons name="pencil" size={24} color={highlightMode ? '#007AFF' : '#333'} />
                  </TouchableOpacity>
                  {/* Updated label text */}
                  <Text style={styles.penLabel}>{highlightMode ? 'Highlight Mode: Tap to highlight' : 'Annotate Mode: Long-press to edit, Tap to view note'}</Text>
                </View>
                <ScrollView contentContainerStyle={styles.scroll}>
                  {blocks.length > 0 ? ( blocks.map(renderBlock) )
                   : !loadingSummary ? ( <Text style={styles.para}>No summary available for this topic.</Text> ) : null }
                </ScrollView>
              </View> )}
        </View>

        {/* === RIGHT PANEL: COURSES === */}
        <View style={styles.right}>
          <View style={styles.coursesHeader}>
            {/* Reverted subtitle text */}
            <Text style={styles.subtitle}>Recommended Courses</Text>
            <TouchableOpacity onPress={getCourses} style={styles.refreshBtn} disabled={loadingCourses}>
              {/* Reverted icon color logic */}
              <Ionicons name="refresh" size={20} color={loadingCourses ? "#aaa" : "#007AFF"} />
            </TouchableOpacity>
          </View>
          {loadingCourses ? ( <ActivityIndicator size="small" style={styles.loadingIndicator} color="#8B4513"/> )
           : coursesError ? ( <Text style={styles.errorText}>{coursesError}</Text> )
           : !Array.isArray(courses) || courses.length === 0 ? ( <Text style={styles.noCourses}>Could not generate course links.</Text> )
           : (
            // ScrollView with flex: 1 to ensure it scrolls with more items
            <ScrollView style={{ flex: 1, flexGrow: 1 }} contentContainerStyle={styles.courseScroll}>
              {courses.map((c, i) => {
                   if (!c || typeof c.platform === 'undefined') { return ( <View key={`error-${i}`} style={styles.courseCard}><Text style={styles.errorText}>Invalid course data</Text></View> ); }
                   // Render Course Card (always a search link now)
                   return (
                     <View key={i} style={styles.courseCard}>
                       {PLATFORM_LOGOS[c.platform] ? (
                         <Image
                           source={PLATFORM_LOGOS[c.platform]}
                           style={[ styles.platformLogo, c.platform === 'Udemy' && styles.udemyLogoStyle, c.platform === 'LinkedIn Learning' && styles.linkedinLogoStyle ]}
                           onError={(e) => console.log(`Failed to load logo for ${c.platform}`, e.nativeEvent.error)}
                          />
                       ) : ( <Text style={styles.missingLogoText}>{c.platform}</Text> )}
                       {/* Reverted course title style */}
                       <Text style={styles.courseTitle}>{c.title || 'Search Courses'}</Text>
                       {/* Reverted course link style (simple Text link) */}
                       <Pressable onPress={() => c.url && openLink(c.url)} disabled={!c.url} >
                         <Text style={[ styles.courseLink, !c.url && { color: '#aaa' } ]} >
                           {c.url ? 'Browse →' : 'Link Missing'}
                         </Text>
                       </Pressable>
                     </View>
                   );
                  })}
            </ScrollView>
           )}
        </View>
      </View>

      {/* --- Annotation Edit Modal (Existing - Reverted button styles) --- */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.modalBg} onPress={closeModal}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            {/* Reverted title */}
            <Text style={styles.modalTitle}>Annotate</Text>
            {selBlock !== null && blocks[selBlock] && ( <Text style={styles.modalSentence}>"{blocks[selBlock]}"</Text> )}
            <TextInput
                style={styles.modalInput}
                // Reverted placeholder
                placeholder="Your note.."
                placeholderTextColor="#999"
                value={noteText}
                onChangeText={setNoteText}
                multiline
                autoFocus // Focus input when modal opens
            />
            <View style={styles.modalActions}>
              {/* Reverted button structure/styles */}
              <TouchableOpacity onPress={closeModal} style={styles.modalButton}>
                <Text style={[styles.modalActionText, { color: '#FF9500' }]}>Cancel</Text>
              </TouchableOpacity>
              {/* Show delete only if there is an existing annotation */}
              {annotations.some(a => a.blockIndex === selBlock) && (
                <TouchableOpacity onPress={deleteAnnotation} style={styles.modalButton}>
                  <Text style={[styles.modalActionText, { color: '#FF3B30' }]}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={saveNote} style={styles.modalButton}>
                <Text style={styles.modalActionText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- NEW Annotation View Modal (Kept as implemented) --- */}
      <Modal
        visible={showViewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)} // Close on physical back button (Android)
      >
        <Pressable style={styles.viewModalBg} onPress={() => setShowViewModal(false)}>
          {/* Prevent closing when tapping inside the modal content */}
          <Pressable style={styles.viewModal} onPress={(e) => e.stopPropagation()}>
            {/* Reverted title */}
            <Text style={styles.viewModalTitle}>Annotation</Text>
            {/* Optional: Display the original text */}
            {viewBlockText && (
                <Text style={styles.viewModalBlockText}>"{viewBlockText}"</Text>
            )}
            {/* Display the note */}
            <ScrollView style={styles.viewModalScroll}>
                <Text style={styles.viewModalNoteText}>{viewNoteText || "No note text."}</Text>
            </ScrollView>
            {/* Simple close button */}
            <TouchableOpacity onPress={() => setShowViewModal(false)} style={styles.viewModalCloseButton}>
              <Text style={styles.viewModalCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      {/* --- End NEW Annotation View Modal --- */}

    </SafeAreaView>
  );
}

// --- StyleSheet ---
// Reverted most styles to match user's original code + v15, keeping only view modal styles
const styles = StyleSheet.create({
  // Base text styles
  text:           { fontFamily:'Quicksand_400Regular', color:'#333' },
  bold:           { fontFamily:'Quicksand_700Bold' },
  italic:         { fontFamily:'Quicksand_500Medium', fontStyle:'italic' },
  // Layout styles reverted to original/v15
  container:      { flex:1, backgroundColor:'#f5f5dc' }, // Original background
  bg:             { position:'absolute', top:0, left:0, width:'100%', height:'100%', opacity:0.3 },
  logoRow:        { position:'absolute', top: Platform.OS === 'ios' ? 50 : 20, left:20, zIndex:10 }, // Removed flex row
  logo:           { width:100, height:100, resizeMode:'contain' }, // Original logo size
  backBtn:        { marginTop:8, backgroundColor:'#8B4513', padding:4, borderRadius:4, alignSelf:'flex-start' }, // Original position/style
  backBtnText:    { fontFamily:'Quicksand_700Bold', color:'#fff' }, // Original text color
  contentRow:     { flex:1, flexDirection:'row', marginTop: Platform.OS === 'ios' ? 140 : 120 }, // Adjusted marginTop for header
  left:           { flex:1, padding:20 }, // Original padding
  right:          { flex:1, padding:20, borderLeftWidth:1, borderLeftColor:'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'}, // Original border color
  card:           { flex:1, backgroundColor:'#fff', borderRadius:12, padding:16, shadowColor:'#000', shadowOffset:{ width:0, height:4 }, shadowOpacity:0.1, shadowRadius:6, elevation:3 }, // Original card style
  scroll:         { paddingBottom:20 },
  // --- Added styles for Topic Header Row and Save Button ---
  topicHeaderRow: {
    flexDirection: 'row', // Arrange title and button side-by-side
    alignItems: 'center', // Vertically align items in the middle
    justifyContent: 'center', // Center items horizontally
    marginBottom: 10, // Space below the header row
    // position: 'relative', // Only needed if absolutely positioning within
  },
  title:          {
    fontFamily:'Quicksand_700Bold',
    fontSize:24,
    textAlign:'center',
    color: '#333', // Ensure title color is set
    // Removed marginBottom, handled by topicHeaderRow
    flexShrink: 1, // Allow title text to shrink if needed
    marginRight: 10, // Add space between title and save button
  },
  saveButton: {
    padding: 5, // Increase touchable area
    // Add margin if needed, but centering in parent should work
    // marginLeft: 10,
  },
  // --- End Added Styles ---
  subtitle:       { fontFamily:'Quicksand_700Bold', fontSize:24, textAlign:'center' }, // Original subtitle style
  coursesHeader:  { position:'relative', alignItems:'center', marginBottom:10 }, // Original margin
  refreshBtn:     { position:'absolute', top:0, right:0, padding:4 },
  // Annotation block styles reverted to original/v15
  block:          { marginBottom:10, padding:4, borderRadius:4 }, // Removed border
  hlHighlight:    { backgroundColor:'rgba(255,255,0,0.4)' }, // Original highlight
  noteHighlight:  { backgroundColor:'rgba(255,165,0,0.4)' }, // Original note highlight
  // Text content styles reverted to original/v15
  heading:        { fontFamily:'Quicksand_700Bold', fontSize:18, marginBottom:6 }, // Original heading style
  para:           { fontFamily:'Quicksand_400Regular', fontSize:16, lineHeight:22 }, // Original para style
  bullet:         { fontFamily:'Quicksand_400Regular', fontSize:16, lineHeight:22 }, // Original bullet style
  penRow:         { flexDirection:'row', alignItems:'center', marginBottom:8 }, // Original pen row style
  penButton:      { padding: 5 }, // Kept padding for tap area
  penLabel:       { fontFamily:'Quicksand_400Regular', marginLeft:8, color:'#555', flexShrink: 1, fontSize: 13 }, // Updated label text
  // Course styles reverted to original/v15
  courseScroll:   { paddingBottom:20, alignItems:'center' }, // Original alignment
  courseCard:     { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:16, shadowColor:'#000', shadowOffset:{ width:0, height:4 }, shadowOpacity:0.1, shadowRadius:6, elevation:3, width:'95%', }, // Original card style
  platformLogo:   { width:80, height:40, resizeMode:'contain', alignSelf:'center', marginBottom:12 },
  udemyLogoStyle: { width: 90, height: 45 }, // Keep specific overrides
  linkedinLogoStyle: { width: 90, height: 45 }, // Keep specific overrides
  missingLogoText: { textAlign: 'center', color: 'grey', height: 40, lineHeight: 40, marginBottom: 12, fontFamily:'Quicksand_500Medium' },
  courseTitle:    { fontFamily:'Quicksand_500Medium', fontSize:16, marginBottom:8, textAlign:'center' }, // Original title style
  courseLink:     { fontFamily:'Quicksand_700Bold', fontSize:14, color:'#007AFF', textAlign:'center' }, // Original link style
  noCourses:      { fontFamily:'Quicksand_400Regular', fontSize:14, textAlign:'center', marginTop:20 }, // Original style
  // Edit Modal styles reverted to original/v15
  modalBg:        { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center', padding: 20 },
  modal:          { width:'85%', maxWidth: 500, backgroundColor:'#fff', borderRadius:16, padding:20, shadowColor:'#000', shadowOffset:{ width:0, height:6 }, shadowOpacity:0.3, shadowRadius:8, elevation:5 }, // Adjusted width slightly
  modalTitle:     { fontFamily:'Quicksand_700Bold', fontSize:20, marginBottom:12, textAlign:'center' }, // Original title style
  modalSentence:  { fontFamily:'Quicksand_400Regular', fontSize:16, marginBottom:12, fontStyle:'italic', color:'#555' }, // Original sentence style
  modalInput:     { borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:10, height:80, textAlignVertical:'top', marginBottom:16, fontFamily:'Quicksand_400Regular' }, // Original input style
  modalActions:   { flexDirection:'row', justifyContent:'space-around' }, // Original actions layout
  modalButton:    { paddingVertical: 8, paddingHorizontal: 12 }, // Original button padding
  modalActionText:{ fontFamily:'Quicksand_500Medium', fontSize:16, color:'#007AFF' }, // Original action text style (color overrides applied inline)
  // Utility styles reverted to original/v15
  centeredMessage:{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, // Original centered message
  loadingIndicator:{ marginTop: 40 },
  errorText:      { color: 'red', textAlign: 'center', marginTop: 10, fontFamily:'Quicksand_500Medium', paddingHorizontal: 10 }, // Original error text

  // --- Styles for the View-Only Annotation Modal (Kept from previous step) ---
  viewModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  viewModal: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '70%', // Limit modal height
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    display: 'flex',
    flexDirection: 'column', // Arrange content vertically
  },
  viewModalTitle: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  viewModalBlockText: { // Optional style for the original text block
    fontFamily: 'Quicksand_400Regular',
    fontSize: 15,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 15,
    maxHeight: 60, // Limit height if block text is long
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    textAlign: 'center',
  },
  viewModalScroll: {
    flexShrink: 1, // Allow scrollview to shrink if content is short
    marginBottom: 15, // Space before close button
  },
  viewModalNoteText: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  viewModalCloseButton: {
    marginTop: 'auto', // Push button to the bottom if content is short
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF', // Standard blue
    borderRadius: 8,
    alignSelf: 'center', // Center the button
  },
  viewModalCloseText: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});

