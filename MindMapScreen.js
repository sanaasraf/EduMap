// MindMapScreen.js


import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  View,
  TextInput,
  Alert,
  FlatList,
  Platform,
  Image,
  Animated,
  useWindowDimensions,
  ActivityIndicator
} from 'react-native';
import Svg, { Defs, Filter, FeDropShadow, G, Ellipse, Path, Text as SvgText, Rect, TSpan } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebaseconfig';
import bgimage4 from './assets/bgimage4.png';
import logo from './assets/logo.png';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import Icon from 'react-native-vector-icons/Feather';


const VIRTUAL_WIDTH = 1350;
const VIRTUAL_HEIGHT = 1350;

/** Compute ellipse size + truncated text */
function computeEllipse(title, baseRx, baseRy, wideFactor, tallFactor, maxRx, maxRy) {
  title = typeof title === 'string' ? title : '';
  const textLength = title.length;
  let rx = baseRx + textLength * wideFactor;
  let ry = baseRy + textLength * tallFactor;
  rx = Math.min(rx, maxRx);
  ry = Math.min(ry, maxRy);
  const minDim = Math.min(rx, ry);
  let fontSize = Math.max(10, Math.min(minDim * 0.55, 28));

  let text = title;
  const approxMaxChars = Math.max(8, Math.floor((rx * 1.7) / (fontSize * 0.6)));
  if (textLength > approxMaxChars && textLength > 10) {
    text = text.substring(0, approxMaxChars - 3) + '...';
  }
  return { text, rx, ry, fontSize };
}

/** Quadratic bezier path between two points */
function computeCurvedPath(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const len = Math.hypot(dx, dy);
  const offset = Math.max(20, len * 0.1);
  const perpX = -dy / (len || 1);
  const perpY = dx / (len || 1);
  const ctrlX = midX + perpX * offset;
  const ctrlY = midY + perpY * offset;
  return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
}

/** layoutMindMap with force-directed repulsion and attraction */
function layoutMindMap(data) {
  const center = { x: VIRTUAL_WIDTH / 2, y: VIRTUAL_HEIGHT / 2 };
  const nodes = [];
  const edges = [];

  if (!data || !data.subject || !Array.isArray(data.mainTopics)) return { nodes, edges };

  // Subject node
  const subj = computeEllipse(data.subject, 140, 70, 2.5, 1.0, 300, 120);
  const subjectId = 'subject';
  nodes.push({ id: subjectId, type: 'subject', title: subj.text, originalTitle: data.subject, x: center.x, y: center.y, rx: subj.rx, ry: subj.ry, fontSize: subj.fontSize });

  // Main topics
  const mainTopics = data.mainTopics;
  const mainCount = Math.max(mainTopics.length, 1);
  const angleStepMain = (2 * Math.PI) / mainCount;
  const mainRadius = subj.rx + Math.max(200, mainCount * 40);
  const mainBaseRx = 110, mainBaseRy = 55, mainWideFactor = 2.2, mainTallFactor = 0.8, mainMaxRx = 240, mainMaxRy = 120;

  mainTopics.forEach((topic, i) => {
    if (!topic || !topic.title) return;
    const angle = -Math.PI / 2 + i * angleStepMain;
    const mx = center.x + mainRadius * Math.cos(angle);
    const my = center.y + mainRadius * Math.sin(angle);
    const m = computeEllipse(topic.title, mainBaseRx, mainBaseRy, mainWideFactor, mainTallFactor, mainMaxRx, mainMaxRy);
    const mid = `main-${i}`;
    nodes.push({ id: mid, type: 'main', title: m.text, originalTitle: topic.title, x: mx, y: my, rx: m.rx, ry: m.ry, fontSize: m.fontSize, ring: mainRadius, parent: subjectId });
    edges.push({ from: subjectId, to: mid });

    // Subtopics
    const subs = topic.subtopics || [];
    if (subs.length > 0) {
      const maxSubSize = subs.reduce((max, s) => {
        const ellipse = computeEllipse(s?.title, 90, 45, 1.8, 0.7, 160, 80);
        return Math.max(max, ellipse.rx, ellipse.ry);
      }, 0);
      const subRadius = m.rx + maxSubSize + 50;
      const spread = Math.PI * 1.2;
      const startAngle = angle + Math.PI - spread / 2;

      subs.forEach((sub, j) => {
        if (!sub || !sub.title) return;
        const subAngle = startAngle + (subs.length > 1 ? j * (spread / (subs.length - 1)) : spread / 2);
        const sx = mx + subRadius * Math.cos(subAngle);
        const sy = my + subRadius * Math.sin(subAngle);
        const s = computeEllipse(sub.title, 90, 45, 1.8, 0.7, 160, 80);
        const sid = `sub-${i}-${j}`;
        nodes.push({ id: sid, type: 'sub', title: s.text, originalTitle: sub.title, x: sx, y: sy, rx: s.rx, ry: s.ry, fontSize: s.fontSize, ring: subRadius, parent: mid });
        edges.push({ from: mid, to: sid });
      });
    }
  });

  // Force-directed layout to avoid collisions
  const ITER = 300;
  const MARGIN = 80;
  const CLAMP = 0.1;
  for (let iter = 0; iter < ITER; iter++) {
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy;
        if (distSq === 0) { dx = Math.random() * 0.1; dy = Math.random() * 0.1; distSq = dx * dx + dy * dy; }
        const dist = Math.sqrt(distSq);
        const angle = Math.atan2(dy, dx);
        const effRa = Math.hypot(a.rx, a.ry);
        const effRb = Math.hypot(b.rx, b.ry);
        const minDist = effRa + effRb + MARGIN;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          if (a.type !== 'subject') { a.x -= ux * overlap * CLAMP; a.y -= uy * overlap * CLAMP; }
          if (b.type !== 'subject') { b.x += ux * overlap * CLAMP; b.y += uy * overlap * CLAMP; }
        }
      }
    }
    // Attraction to ring
    nodes.forEach(n => {
      if (n.type === 'subject') return;
      const parent = nodes.find(x => x.id === n.parent);
      const px = parent ? parent.x : center.x;
      const py = parent ? parent.y : center.y;
      const targetR = n.ring;
      let dx = n.x - px;
      let dy = n.y - py;
      const dist = Math.hypot(dx, dy) || 1;
      const diff = dist - targetR;
      n.x -= (dx / dist) * diff * CLAMP;
      n.y -= (dy / dist) * diff * CLAMP;
    });
  }

  // Clamp to canvas
  const PAD = 50;
  nodes.forEach(n => {
    n.x = Math.max(PAD + n.rx, Math.min(VIRTUAL_WIDTH - PAD - n.rx, n.x));
    n.y = Math.max(PAD + n.ry, Math.min(VIRTUAL_HEIGHT - PAD - n.ry, n.y));
  });

  return { nodes, edges };
}

// SingleMindMap Component
const SingleMindMap = ({ data, width, height, navigation }) => {
  const { nodes, edges } = useMemo(() => layoutMindMap(data), [data]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimeoutRef = useRef(null);

  const handleHoverIn = useCallback(node => { if (node.type !== 'subject') setActiveNodeId(node.id); setTooltip({ id: node.id, x: node.x, y: node.y - node.ry - 15, text: node.originalTitle }); }, []);
  const handleHoverOut = useCallback(node => { setActiveNodeId(null); tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 100); }, []);
  const handlePress = useCallback(node => { if (node.type !== 'subject') navigation.navigate('TopicDetail', { topic: node.originalTitle }); }, [navigation]);

  const renderTooltip = () => {
    if (!tooltip) return null;
    const pad = 18;
    const fs = 16;
    const lh = fs * 1.4;
    const mw = 320;
    const br = 12;
    const aw = 18;
    const ah = 10;
    const wrap = (text) => {
      const words = text.split(' ');
      const lines = [];
      let cur = words[0];
      for (let i = 1; i < words.length; i++) {
        const test = cur + ' ' + words[i];
        if (test.length * fs * 0.6 < mw - 2 * pad) cur = test;
        else { lines.push(cur); cur = words[i]; }
      }
      lines.push(cur);
      return lines;
    };
    const lines = wrap(tooltip.text);
    const tw = Math.min(mw, Math.max(...lines.map(l => l.length * fs * 0.6)) + 2 * pad);
    const th = lines.length * lh + 2 * pad;
    let tx = tooltip.x - tw / 2;
    let ty = tooltip.y - th - ah;
    tx = Math.max(10, Math.min(tx, VIRTUAL_WIDTH - tw - 10));
    ty = Math.max(10, Math.min(ty, VIRTUAL_HEIGHT - th - ah - 10));
    const arrow = `M ${tw/2 - aw/2} ${th} L ${tw/2} ${th+ah} L ${tw/2 + aw/2} ${th} Z`;
    return (
      <G x={tx} y={ty} style={{ pointerEvents: 'none' }}>
        <Path d={arrow} fill="#FFFFF0" stroke="#888" strokeWidth={1} filter="url(#ts)" />
        <Rect width={tw} height={th} fill="#FFFFF0" stroke="#888" strokeWidth={1} rx={br} ry={br} filter="url(#ts)" />
        <SvgText x={pad} y={pad + fs * 0.8} fontSize={fs} fill="#333" fontFamily="Quicksand_500Medium">
          {lines.map((l, i) => <TSpan key={i} x={pad} dy={i === 0 ? 0 : lh}>{l}</TSpan>)}
        </SvgText>
      </G>
    );
  };

  if (!nodes.length) return <View style={mapStyles.mapContainer}><ActivityIndicator size="large"/><Text>Generating...</Text></View>;

  return (
    <View style={mapStyles.mapContainer}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIRTUAL_WIDTH} ${VIRTUAL_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        <Defs><Filter id="ts"><FeDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.3" /></Filter></Defs>
        {edges.map((e, i) => {
          const f = nodes.find(n => n.id === e.from), t = nodes.find(n => n.id === e.to);
          if (!f || !t) return null;
          return <Path key={i} d={computeCurvedPath(f.x, f.y, t.x, t.y)} stroke="#A0A0A0" strokeWidth={2.5} fill="none" />;
        })}
        {nodes.map(n => {
          const base = n.type === 'subject' ? '#8B4513' : n.type === 'main' ? '#2E8B57' : '#FF8C00';
          const act = n.type === 'subject' ? '#8B4513' : n.type === 'main' ? '#3CB371' : '#FFA500';
          const fill = activeNodeId === n.id ? act : base;
          const props = Platform.OS === 'web'
            ? {
                onMouseEnter: () => handleHoverIn(n),
                onMouseLeave: () => handleHoverOut(n),
                onPress: () => handlePress(n),
                style: n.type !== 'subject' ? { cursor: 'pointer' } : {}
              }
            : { onPressIn: () => setActiveNodeId(n.id), onPressOut: () => setActiveNodeId(null), onLongPress: () => handleHoverIn(n), onPress: () => handlePress(n) };
          return (
            <G key={n.id} {...props}>
              <Ellipse cx={n.x} cy={n.y} rx={n.rx} ry={n.ry} fill={fill} stroke="#606060" strokeWidth={1.5} />
              <SvgText x={n.x} y={n.y + n.fontSize * 0.35} fontSize={n.fontSize} fill="#FFF" textAnchor="middle" fontFamily="Quicksand_500Medium">{n.title}</SvgText>
            </G>
          );
        })}
        {renderTooltip()}
      </Svg>
    </View>
  );
};

// --- MindMapCarousel Component  ---
const MindMapCarousel = ({ data, navigation, setActiveIndex }) => {
  const { width, height } = useWindowDimensions();
  const mindMapsLocal = useMemo(() => (Array.isArray(data) ? data : (data ? [data] : [])), [data]);
  const [activeIdxLocal, setActiveIdxLocal] = useState(0);
  const flatRef = useRef(null);

  const snapSettings = { snapToInterval: width, decelerationRate: 'fast', snapToAlignment: 'start' };

  const onScroll = useCallback((e) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / (width || 1));
      if (newIndex !== activeIdxLocal && newIndex >= 0 && newIndex < mindMapsLocal.length) {
          setActiveIdxLocal(newIndex);
          setActiveIndex(newIndex);
      }
  }, [width, activeIdxLocal, setActiveIndex, mindMapsLocal.length]);

  const goPrev = () => {
    const newIndex = activeIdxLocal === 0 ? mindMapsLocal.length - 1 : activeIdxLocal - 1;
    if (flatRef.current) {
      flatRef.current.scrollToIndex({ index: newIndex, animated: true });
      setActiveIdxLocal(newIndex);
      setActiveIndex(newIndex);
    }
  };

  const goNext = () => {
    const newIndex = activeIdxLocal === mindMapsLocal.length - 1 ? 0 : activeIdxLocal + 1;
    if (flatRef.current) {
      flatRef.current.scrollToIndex({ index: newIndex, animated: true });
      setActiveIdxLocal(newIndex);
      setActiveIndex(newIndex);
    }
  };

  if (!mindMapsLocal || mindMapsLocal.length === 0) {
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No maps to display.</Text></View>;
  }

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <FlatList
        data={mindMapsLocal}
        keyExtractor={(_, i) => `map-carousel-${i}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        ref={flatRef}
        {...snapSettings}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width, height }}>
            {/* Pass navigation down */}
            <SingleMindMap data={item} width={width} height={height} navigation={navigation} />
          </View>
        )}
        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={carouselStyles.paginationContainer}>
        {mindMapsLocal.map((_, i) => (
          <View key={`dot-${i}`} style={[carouselStyles.paginationDot, activeIdxLocal === i ? carouselStyles.activeDot : null]} />
        ))}
      </View>
      <TouchableOpacity style={carouselStyles.arrowButtonLeft} onPress={goPrev} accessibilityLabel="Previous mind map">
        <Text style={carouselStyles.arrowText}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity style={carouselStyles.arrowButtonRight} onPress={goNext} accessibilityLabel="Next mind map">
        <Text style={carouselStyles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Main MindMapScreen Component  ---
export default function MindMapScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { mindMapData, onBack, mapId } = route.params || {};
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
      console.log('[MindMapScreen] Received route.params.mindMapData:', mindMapData);
  }, [mindMapData]);

  const initialMaps = useMemo(() => (Array.isArray(mindMapData) ? mindMapData : (mindMapData ? [mindMapData] : [])), [mindMapData]);
  const [mindMaps, setMindMaps] = useState(initialMaps);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [fontsLoaded] = useFonts({ Quicksand_400Regular, Quicksand_500Medium, Quicksand_700Bold });

  const onHoverIn = () => { if (Platform.OS === 'web') { Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: false }).start(); } };
  const onHoverOut = () => { if (Platform.OS === 'web') { Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start(); } };
  const handleLogoPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
    console.log("Logo pressed");
  };
  const handleBack = () => setConfirmModalVisible(true);
  const confirmBack = () => { setConfirmModalVisible(false); onBack?.(); navigation.goBack(); };
  const cancelBack = () => setConfirmModalVisible(false);
  const handleSaveMindMap = async () => {
      if (!fileName.trim()) { return Alert.alert('Error', 'Please provide a valid name for the mind map.'); }
      if (activeIndex < 0 || activeIndex >= mindMaps.length) { return Alert.alert('Error', 'Invalid mind map selected.'); }
      const mapToSave = mindMaps[activeIndex];
      const currentMapId = mapToSave.id || mapId;
      try {
          if (currentMapId) {
              await updateDoc(doc(db, 'mindMaps', currentMapId), { title: fileName.trim(), mindMapData: mapToSave.mindMapData || mapToSave, lastUpdatedAt: serverTimestamp() });
              Alert.alert('Success', 'Mind map updated!');
          } else {
              const userId = auth.currentUser?.uid || 'anonymous';
              await addDoc(collection(db, 'mindMaps'), { userId: userId, mindMapData: mapToSave, createdAt: serverTimestamp(), title: fileName.trim() });
              Alert.alert('Success', 'Mind map saved successfully!');
          }
          setSaveModalVisible(false);
      } catch (error) {
          console.error("Error saving/updating mind map:", error);
          Alert.alert('Error', `Failed to ${currentMapId ? 'update' : 'save'} mind map.`);
      }
  };
  const toggleFab = () => setFabOpen(o => !o);
  const isSavedMap = !!mapId;

  useEffect(() => {
      if (mindMaps.length > 0 && activeIndex >= 0 && activeIndex < mindMaps.length && mindMaps[activeIndex]) {
          setFileName(mindMaps[activeIndex].title || mindMaps[activeIndex].subject || '');
      } else {
          setFileName('');
      }
  }, [mindMaps, activeIndex]);

  if (!fontsLoaded) {
      return <ActivityIndicator size="large" style={screenStyles.centeredMessage} />;
  }
  if (!initialMaps || initialMaps.length === 0) {
    return (
      <SafeAreaView style={screenStyles.container}>
        <Image source={bgimage4} style={screenStyles.backgroundImage} />
         <View style={screenStyles.logoContainer}>
             <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.8} onMouseEnter={onHoverIn} onMouseLeave={onHoverOut} >
                 <Animated.Image source={logo} style={[screenStyles.logo, { transform: [{ scale: scaleAnim }] }]} />
             </TouchableOpacity>
         </View>
         <TouchableOpacity style={screenStyles.backButton} onPress={() => navigation.goBack()}>
             <Icon name="arrow-left" size={16} color="#fff" style={{ marginRight: 4 }} />
             <Text style={screenStyles.backButtonText}>Back</Text>
         </TouchableOpacity>
        <View style={screenStyles.centeredMessage}>
            <Text style={{ fontFamily: 'Quicksand_500Medium', fontSize: 18, color: '#555', textAlign: 'center', paddingHorizontal: 20 }}>
                No mind map data found. Please go back and try generating again.
            </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.container}>
      <Image source={bgimage4} style={screenStyles.backgroundImage} />
      <View style={screenStyles.logoContainer}>
         <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.8} onMouseEnter={onHoverIn} onMouseLeave={onHoverOut} >
             <Animated.Image source={logo} style={[screenStyles.logo, { transform: [{ scale: scaleAnim }] }]} />
         </TouchableOpacity>
      </View>
      <TouchableOpacity style={screenStyles.backButton} onPress={handleBack}>
        <Icon name="arrow-left" size={16} color="#fff" style={{ marginRight: 4 }} />
        <Text style={screenStyles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <View style={screenStyles.mapWrapper}>
          <MindMapCarousel
              data={mindMaps}
              navigation={navigation}
              setActiveIndex={setActiveIndex}
          />
      </View>
      <View style={screenStyles.fabContainer}>
        {fabOpen && (
          <View style={screenStyles.fabOptions}>
            <TouchableOpacity
              style={[screenStyles.fabOptionButton, { backgroundColor: isSavedMap ? '#ffc107' : '#28a745' }]}
              onPress={() => {
                const currentMap = mindMaps[activeIndex];
                if (currentMap) {
                    setFileName(currentMap.title || currentMap.subject || `MindMap_${Date.now()}`);
                    setSaveModalVisible(true);
                    setFabOpen(false);
                } else {
                  Alert.alert("Error", "Cannot save, no map selected.");
                }
              }}
            >
               <Icon name={isSavedMap ? "edit" : "save"} size={18} color="#fff" style={{ marginRight: 5 }} />
               <Text style={screenStyles.fabOptionText}>{isSavedMap ? "Rename" : "Save"}</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={screenStyles.fabButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Open actions menu" onPress={toggleFab} >
          <Icon name={fabOpen ? "x" : "plus"} size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <Modal visible={saveModalVisible} transparent animationType="slide" onRequestClose={() => setSaveModalVisible(false)} >
        <View style={screenStyles.modalContainer}>
          <View style={screenStyles.modalContent}>
            <Text style={screenStyles.modalTitle}>{isSavedMap ? "Rename Mind Map" : "Save Mind Map"}</Text>
            <Text style={screenStyles.modalSubtitle}>Enter a name:</Text>
            <TextInput style={screenStyles.textInput} placeholder="Mind map name" value={fileName} onChangeText={setFileName} autoFocus={true} />
            <View style={screenStyles.modalButtons}>
              <TouchableOpacity style={[screenStyles.modalButton, { backgroundColor: '#6c757d' }]} onPress={() => { setSaveModalVisible(false); }} >
                  <Text style={screenStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[screenStyles.modalButton, { backgroundColor: '#28a745' }]} onPress={handleSaveMindMap} >
                  <Text style={screenStyles.modalButtonText}>{isSavedMap ? "Update" : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={confirmModalVisible} transparent animationType="fade" onRequestClose={cancelBack} >
         <View style={screenStyles.modalContainer}>
           <View style={screenStyles.modalContent}>
             <Text style={screenStyles.modalTitle}>Go back?</Text>
             <Text style={screenStyles.modalSubtitle}>Going back will discard the current mind map unless saved. Continue?</Text>
             <View style={screenStyles.modalButtons}>
               <TouchableOpacity style={[screenStyles.modalButton, { backgroundColor: '#6c757d' }]} onPress={cancelBack} >
                   <Text style={screenStyles.modalButtonText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[screenStyles.modalButton, { backgroundColor: '#dc3545' }]} onPress={confirmBack} >
                   <Text style={screenStyles.modalButtonText}>OK</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const mapStyles = StyleSheet.create({
  mapContainer: { flex: 1, width: '100%', height: '100%' }, // Ensure map container takes full space
});

const carouselStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  card: { backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  arrowButtonLeft: { position: 'absolute', left: 10, top: '50%', transform: [{ translateY: -20 }], zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 20 },
  arrowButtonRight: { position: 'absolute', right: 10, top: '50%', transform: [{ translateY: -20 }], zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 20 },
  arrowText: { fontSize: 24, color: '#fff' },
  paginationContainer: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row' },
  paginationDot: { width: 8, height: 8, borderRadius: 4, margin: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#fff' }
});

const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5dc' },
  backgroundImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', resizeMode: 'cover', opacity: 0.3 },
  logoContainer: { position: 'absolute', top: Platform.OS === 'web' ? 20 : 40, left: 20, zIndex: 10 },
  logo: { width: 100, height: 100, resizeMode: 'contain' },
  backButton: { position: 'absolute', top: Platform.OS === 'web' ? 30 : 50, right: 20, backgroundColor: '#473c38', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, zIndex: 10, flexDirection: 'row', alignItems: 'center' },
  backButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Quicksand_700Bold', marginLeft: 4 },
  mapWrapper: { flex: 1, width: '100%' }, // Ensure wrapper takes full space
  fabContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 90 : 70, right: 30, alignItems: 'flex-end', zIndex: 20 },
  fabOptions: { marginBottom: 10, alignItems: 'flex-end' },
  fabButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#473c38', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  fabOptionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  fabOptionText: { color: '#fff', fontFamily: 'Quicksand_500Medium', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '90%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 15, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalTitle: { fontSize: 20, fontFamily: 'Quicksand_700Bold', marginBottom: 15, color: '#333' },
  modalSubtitle: { fontSize: 16, fontFamily: 'Quicksand_400Regular', marginBottom: 15, textAlign: 'center', color: '#555' },
  textInput: { width: '100%', height: 45, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginBottom: 20, fontFamily: 'Quicksand_400Regular', fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  modalButton: { flex: 1, marginHorizontal: 10, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontFamily: 'Quicksand_700Bold', fontSize: 15 },
  centeredMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
