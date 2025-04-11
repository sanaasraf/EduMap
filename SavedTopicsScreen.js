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
  serverTimestamp, query, where, onSnapshot, orderBy, getDocs, limit
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

const SavedTopicsScreen = () => {
  const navigation = useNavigation();
  const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';

  const [savedTopics, setSavedTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [renameTopicModalVisible, setRenameTopicModalVisible] = useState(false);
  const [deleteTopicModalVisible, setDeleteTopicModalVisible] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);

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
      const topics = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSavedTopics(topics);
    });
    return unsubscribe;
  }, [userId]);

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  // Handlers
  const openRenameModal = (topic) => {
    setSelectedTopic(topic);
    setNewTopicTitle(topic.title);
    setRenameTopicModalVisible(true);
  };

  const handleRename = async () => {
    if (!selectedTopic) return;
    try {
      await updateDoc(doc(db, 'mindMaps', selectedTopic.id), { title: newTopicTitle });
      setRenameTopicModalVisible(false);
      setSelectedTopic(null);
      setNewTopicTitle('');
    } catch (err) {
      console.error('Rename failed:', err);
      Alert.alert('Error', 'Failed to rename topic.');
    }
  };

  const confirmDelete = (topic) => {
    setTopicToDelete(topic);
    setDeleteTopicModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'mindMaps', id));
      Alert.alert('Deleted', 'Topic deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('Error', 'Failed to delete topic.');
    }
  };

  // Renders each list item
  const renderItem = ({ item, index }) => {
    const isHovering = hoveredItemId === item.id;
    const isPressing = pressedItemId === item.id;

    return (
      <View style={styles.topicItem}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.topicTitle}>{item.title}</Text>
            <Text style={styles.topicDate}>
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
          onPress={() => navigation.navigate('Topic', { topicData: item.topicData })}
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
          <Text style={styles.screenTitle}>SavedTopicsScreen</Text>
          <FlatList
            style={styles.mindMapsList}
            data={savedTopics}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyText}>No saved topics</Text>}
          />
        </View>
      </ScrollView>

      {/* Rename Modal */}
      <Modal visible={renameTopicModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Topic</Text>
            <TextInput
              style={styles.input}
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
              placeholder="New title"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setRenameTopicModalVisible(false)}>
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
      <Modal visible={deleteTopicModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this topic?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDeleteTopicModalVisible(false)}>
                <Text style={styles.modalAction}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (topicToDelete) {
                    handleDelete(topicToDelete.id);
                  }
                  setDeleteTopicModalVisible(false);
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

export default SavedTopicsScreen;
