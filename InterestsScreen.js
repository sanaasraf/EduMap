// InterestsScreen.js 
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
    ImageBackground,
    Animated,
    Platform,
    Image,
    ActivityIndicator,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseconfig';
import Icon from 'react-native-vector-icons/Ionicons';

import {
    useFonts,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';

// --- ADJUST PATHS AS NEEDED ---
const backgroundImage = require('./assets/bgimage12.png');
const logoImage = require('./assets/logo.png');
// --- END ADJUST PATHS ---

export default function InterestsScreen({ navigation }) {
    const [fontsLoaded, fontError] = useFonts({
        'Quicksand-Regular': Quicksand_400Regular,
        'Quicksand-Medium': Quicksand_500Medium,
        'Quicksand-Bold': Quicksand_700Bold,
    });

    const topics = [
        "Programming", "Art", "Philosophy", "History", "Physics", "Chemistry",
        "English Literature", "Health Sciences", "Geography", "Mathematics",
        "Biology", "Economics", "Psychology", "Law", "Sociology"
    ];

    const [selectedTopics, setSelectedTopics] = useState([]);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const toggleTopic = (topic) => {
        setSelectedTopics((prevSelected) =>
            prevSelected.includes(topic)
                ? prevSelected.filter((t) => t !== topic)
                : [...prevSelected, topic]
        );
    };

    const handleLogoPress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== 'web' }),
        ]).start(() => {
            console.log("Logo pressed");
        });
    };

    const handleContinue = async () => {
        if (selectedTopics.length === 0) {
            Alert.alert("Select Interests", "Please select at least one interest to continue.");
            return;
        }
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { interests: selectedTopics });
            }
            navigation.navigate('Dashboard');
        } catch (error) {
            console.error("Error updating interests: ", error);
            Alert.alert("Error", "An error occurred while saving your interests.");
        }
    };

    if (!fontsLoaded && !fontError) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#473c38" />
            </View>
        );
    }

    if (fontError) {
        console.error("Font loading error:", fontError);
        return <View style={styles.loadingContainer}><Text>Error loading fonts.</Text></View>;
    }

    return (
        <ImageBackground
            source={backgroundImage}
            resizeMode="cover"
            style={styles.backgroundImage}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled" // Good practice for ScrollViews with inputs/buttons
                >
                    <View style={styles.contentInner}>
                        <TouchableOpacity
                            onPress={handleLogoPress}
                            activeOpacity={0.8}
                        >
                            <Animated.Image
                                source={logoImage}
                                style={[styles.logo, { transform: [{ scale: scaleAnim }] }]}
                            />
                        </TouchableOpacity>

                        <Text style={styles.heading}>Select Your Interests</Text>
                        <Text style={styles.subHeading}>Choose topics you'd like to explore.</Text>
                        <View style={styles.topicsContainer}>
                            {topics.map((topic) => {
                                const isSelected = selectedTopics.includes(topic);
                                return (
                                    <TouchableOpacity
                                        key={topic}
                                        style={[
                                            styles.topicButton,
                                            isSelected && styles.topicButtonSelected,
                                        ]}
                                        onPress={() => toggleTopic(topic)}
                                        activeOpacity={0.7}
                                    >
                                        {isSelected && (
                                            <Icon name="checkmark-circle-outline"
                                                  size={20} color="white" style={styles.iconStyle} />
                                        )}
                                        <Text
                                            style={[
                                                styles.topicText,
                                                isSelected && styles.topicTextSelected,
                                            ]}
                                        >
                                            {topic}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.continueButtonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f0e1',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 35, // ** Reduced vertical padding **
        paddingHorizontal: 10, // Slightly reduce horizontal padding to compensate for wider card
    },
    contentInner: {
        alignItems: 'center',
        width: '95%', // ** Made card wider **
        maxWidth: 600, // Increase max width slightly
        padding: 20, // ** Reduced internal padding **
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
    },
    logo: {
        width: 150, // ** Increased logo size **
        height: 150, // ** Increased logo size **
        resizeMode: 'contain',
        marginBottom: 25, // ** Reduced space below logo **
    },
    heading: {
        fontFamily: 'Quicksand-Bold',
        fontSize: 28,
        color: '#403530',
        marginBottom: 10, // ** Reduced space **
        textAlign: 'center',
    },
    subHeading: {
        fontFamily: 'Quicksand-Regular',
        fontSize: 17,
        color: '#5a4a43',
        marginBottom: 30, // ** Reduced space **
        textAlign: 'center',
        lineHeight: 24,
    },
    topicsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20, // ** Reduced space **
        width: '100%', // Ensure it uses the container width for wrapping
    },
    topicButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#7d6b63',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 18,
        margin: 7, // Kept margin reasonable for spacing
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    topicButtonSelected: {
        backgroundColor: '#473c38',
        borderColor: '#473c38',
        elevation: 1,
        shadowOpacity: 0.05,
    },
    iconStyle: {
        marginRight: 8,
    },
    topicText: {
        fontFamily: 'Quicksand-Medium',
        fontSize: 15,
        color: '#473c38',
    },
    topicTextSelected: {
        fontFamily: 'Quicksand-Bold',
        color: 'white',
    },
    continueButton: {
        marginTop: 35, // ** Reduced space **
        backgroundColor: '#473c38',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    continueButtonText: {
        fontFamily: 'Quicksand-Bold',
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
    },
});