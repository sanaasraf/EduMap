import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  View,
  Modal
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './firebaseconfig';
import { useNavigation } from '@react-navigation/native';

const SavedMindMapsScreen = () => {
  const [savedMindMaps, setSavedMindMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [mapToDelete, setMapToDelete] = useState(null);

  const navigation = useNavigation();
  const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous';

  // Listen for mind maps belonging to this user, sorted by createdAt desc
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

  // Delete mind map from Firestore
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'mindMaps', id));
      Alert.alert('Deleted', 'Mind map deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('Error', 'Failed to delete mind map.');
    }
  };

  // Rename mind map in Firestore
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

  // Open the rename modal
  const openRenameModal = (map) => {
    setSelectedMap(map);
    setNewTitle(map.title);
    setRenameModalVisible(true);
  };

  // Open the delete confirmation modal
  const confirmDelete = (map) => {
    setMapToDelete(map);
    setDeleteModalVisible(true);
  };

  // Renders each mind map item in a row with title/date on the left, buttons on the right
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      {/* Top row: title/date (left) + rename/delete (right) */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>
            {item.createdAt ? item.createdAt.toDate().toLocaleString() : ''}
          </Text>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { marginRight: 10 }]}
            onPress={() => openRenameModal(item)}
          >
            <Text style={styles.actionText}>Rename</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => confirmDelete(item)}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Separate link to open the mind map */}
      <TouchableOpacity
        style={styles.openButton}
        onPress={() => navigation.navigate('MindMap', { mindMapData: item.mindMapData })}
      >
        <Text style={styles.openButtonText}>Open Mind Map</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={savedMindMaps}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No saved mind maps</Text>}
      />

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename Mind Map</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setRenameModalVisible(false)}
                style={{ marginRight: 15 }}
              >
                <Text style={styles.modalAction}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRename}>
                <Text style={styles.modalAction}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this mind map?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={{ marginRight: 15 }}
              >
                <Text style={styles.modalAction}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!mapToDelete) return;
                  handleDelete(mapToDelete.id);
                  setDeleteModalVisible(false);
                }}
              >
                <Text style={styles.modalAction}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SavedMindMapsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 8,
    elevation: 2, // Android shadow
    // You can add a border for debugging:
    // borderWidth: 1, borderColor: 'blue'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#473c38',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
  },
  openButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  openButtonText: {
    color: 'blue',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000aa', // semi-transparent background
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalAction: {
    color: '#007BFF',
    fontSize: 16,
  },
});
