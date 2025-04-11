// // MindMap.js
// import React, { useRef, useState } from 'react';
// import {
//   View,
//   StyleSheet,
//   useWindowDimensions,
//   FlatList,
//   TouchableOpacity,
//   Text,
//   Pressable,
//   Alert,
// } from 'react-native';
// import Svg, {
//   Ellipse,
//   Path,
//   Text as SvgText,
//   ForeignObject,
// } from 'react-native-svg';
// import { useNavigation } from '@react-navigation/native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { generateMindMapData } from './DashboardScreen'; // Your existing import

// // Virtual dimensions for the SVG canvas
// const VIRTUAL_WIDTH = 1350;
// const VIRTUAL_HEIGHT = 1350;

// /* ---------------------------------------------------------------------
//    Helper Functions
// --------------------------------------------------------------------- */
// function computeEllipse(title, baseRx, baseRy, wideFactor, tallFactor, maxRx, maxRy) {
//   title = typeof title === 'string' ? title : '';
//   const textLength = title.length;
//   let rx = baseRx + textLength * wideFactor;
//   let ry = baseRy + textLength * tallFactor;
//   if (rx > maxRx) rx = maxRx;
//   if (ry > maxRy) ry = maxRy;
//   const minDim = Math.min(rx, ry);
//   let fontSize = minDim * 0.6;
//   if (fontSize < 12) fontSize = 12;
//   if (fontSize > 30) fontSize = 30;

//   let text = title;
//   if (textLength > 50) {
//     text = text.substring(0, 47) + '...';
//   }
//   return { text, rx, ry, fontSize };
// }

// // Create a smooth, curved path (quadratic Bézier) between two nodes
// function computeCurvedPath(x1, y1, x2, y2) {
//   const dx = x2 - x1;
//   const dy = y2 - y1;
//   const midX = (x1 + x2) / 2;
//   const midY = (y1 + y2) / 2;
//   const length = Math.sqrt(dx * dx + dy * dy);
//   const offset = length ? length * 0.15 : 20;
//   const perpX = -dy / (length || 1);
//   const perpY = dx / (length || 1);
//   const controlX = midX + perpX * offset;
//   const controlY = midY + perpY * offset;
//   return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
// }

// /* ---------------------------------------------------------------------
//    layoutMindMap:
//    Generates the node/edge objects for subject, main topics, subtopics.
// --------------------------------------------------------------------- */
// function layoutMindMap(data, width, height) {
//   const center = { x: width / 2, y: height / 2 };
//   const nodes = [];
//   const edges = [];

//   // Subject node
//   const subjectProps = computeEllipse(data.subject, 140, 70, 2.5, 1.0, 300, 120);
//   const subjectId = 'subject';
//   nodes.push({
//     id: subjectId,
//     type: 'subject',
//     title: subjectProps.text,
//     originalTitle: data.subject,
//     x: center.x,
//     y: center.y,
//     rx: subjectProps.rx,
//     ry: subjectProps.ry,
//     fontSize: subjectProps.fontSize,
//   });

//   const minDim = Math.min(width, height);
//   const mainRingRadius = subjectProps.rx + minDim * 0.2;

//   const mainBaseRx = 110;
//   const mainBaseRy = 55;
//   const mainWideFactor = 2.2;
//   const mainTallFactor = 0.8;
//   const mainMaxRx = 200;
//   const mainMaxRy = 110;

//   const mainTopics = data.mainTopics || [];
//   const mainCount = mainTopics.length;
//   const mainEffectiveCount = Math.max(mainCount, 3);
//   const mainAngleStep = (2 * Math.PI) / mainEffectiveCount;
//   const mainAngleOffset = -Math.PI / 2;

//   mainTopics.forEach((topic, i) => {
//     const angle = mainAngleOffset + i * mainAngleStep;
//     const mx = center.x + mainRingRadius * Math.cos(angle);
//     const my = center.y + mainRingRadius * Math.sin(angle);
//     const mainProps = computeEllipse(
//       topic.title,
//       mainBaseRx,
//       mainBaseRy,
//       mainWideFactor,
//       mainTallFactor,
//       mainMaxRx,
//       mainMaxRy
//     );
//     const mainId = `main-${i}`;
//     nodes.push({
//       id: mainId,
//       type: 'main',
//       title: mainProps.text,
//       originalTitle: topic.title,
//       x: mx,
//       y: my,
//       rx: mainProps.rx,
//       ry: mainProps.ry,
//       fontSize: mainProps.fontSize,
//     });
//     edges.push({ from: subjectId, to: mainId });

//     // Subtopics
//     const subTopics = topic.subtopics || [];
//     const subCount = subTopics.length;
//     const subEffectiveCount = Math.max(subCount, 3);
//     const subAngleStep = (2 * Math.PI) / subEffectiveCount;
//     const subAngleOffset = -Math.PI / 2;
//     const subRingRadius = mainProps.rx + 100;

//     const subBaseRx = 90;
//     const subBaseRy = 45;
//     const subWideFactor = 1.8;
//     const subTallFactor = 0.7;
//     const subMaxRx = 150;
//     const subMaxRy = 80;

//     subTopics.forEach((sub, j) => {
//       const subAngle = subAngleOffset + j * subAngleStep;
//       const sx = mx + subRingRadius * Math.cos(subAngle);
//       const sy = my + subRingRadius * Math.sin(subAngle);
//       const subProps = computeEllipse(
//         sub.title,
//         subBaseRx,
//         subBaseRy,
//         subWideFactor,
//         subTallFactor,
//         subMaxRx,
//         subMaxRy
//       );
//       const subId = `sub-${i}-${j}`;
//       nodes.push({
//         id: subId,
//         type: 'sub',
//         title: subProps.text,
//         originalTitle: sub.title,
//         x: sx,
//         y: sy,
//         rx: subProps.rx,
//         ry: subProps.ry,
//         fontSize: subProps.fontSize,
//       });
//       edges.push({ from: mainId, to: subId });
//     });
//   });

//   return { nodes, edges };
// }

// /* ---------------------------------------------------------------------
//    SingleMindMap - Renders nodes & edges for one mind map
// --------------------------------------------------------------------- */
// const SingleMindMap = ({ data, width, height, navigation }) => {
//   const { nodes, edges } = layoutMindMap(data, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

//   return (
//     <View style={styles.mapContainer}>
//       <Svg width={width} height={height} viewBox={`0 0 ${VIRTUAL_WIDTH} ${VIRTUAL_HEIGHT}`}>
//         {edges.map((edge, i) => {
//           const fromNode = nodes.find((n) => n.id === edge.from);
//           const toNode = nodes.find((n) => n.id === edge.to);
//           if (!fromNode || !toNode) return null;
//           const pathData = computeCurvedPath(fromNode.x, fromNode.y, toNode.x, toNode.y);
//           return (
//             <Path
//               key={`edge-${i}`}
//               d={pathData}
//               stroke="#888"
//               strokeWidth={3}
//               fill="none"
//             />
//           );
//         })}

//         {nodes.map((n, i) => {
//           let fillColor = '#228B22'; // green for main
//           if (n.type === 'subject') fillColor = '#8B4513'; // brown
//           else if (n.type === 'sub') fillColor = '#FFA500'; // orange

//           return (
//             <React.Fragment key={`node-${i}`}>
//               <Ellipse
//                 cx={n.x}
//                 cy={n.y}
//                 rx={n.rx}
//                 ry={n.ry}
//                 fill={fillColor}
//                 stroke="#fff"
//                 strokeWidth={2}
//               />
//               <SvgText
//                 x={n.x}
//                 y={n.y + n.fontSize / 3}
//                 fontSize={n.fontSize}
//                 fill="#fff"
//                 textAnchor="middle"
//               >
//                 {n.title}
//               </SvgText>
//               {n.type === 'sub' && (
//                 <ForeignObject
//                   x={n.x - n.rx}
//                   y={n.y - n.ry}
//                   width={n.rx * 2}
//                   height={n.ry * 2}
//                 >
//                   <Pressable
//                     onPress={() =>
//                       navigation.navigate('TopicDetail', { topic: n.originalTitle })
//                     }
//                     style={({ hovered }) => [
//                       {
//                         width: '100%',
//                         height: '80%',
//                         borderRadius: n.rx,
//                         backgroundColor: hovered ? 'rgba(0,0,0,0.1)' : 'transparent',
//                       },
//                     ]}
//                   />
//                 </ForeignObject>
//               )}
//             </React.Fragment>
//           );
//         })}
//       </Svg>
//     </View>
//   );
// };

// /* ---------------------------------------------------------------------
//    MindMapCarousel - Horizontal scroll of multiple mind maps
// --------------------------------------------------------------------- */
// const MindMapCarousel = ({ data: initialData, navigation }) => {
//   const { width, height } = useWindowDimensions();
//   const [mindMaps, setMindMaps] = useState(initialData);
//   const [activeIndex, setActiveIndex] = useState(0);
//   const flatListRef = useRef(null);

//   const CARD_SPACING = 20;
//   // Make the card as big as you want; or remove “cards” entirely
//   const cardWidth = width * 0.8;
//   const cardHeight = height * 0.7;
//   const snapInterval = cardWidth + CARD_SPACING;

//   const onViewableItemsChanged = useRef(({ viewableItems }) => {
//     if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
//   }).current;
//   const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

//   const goToPrev = () => {
//     if (activeIndex > 0) {
//       flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
//     }
//   };

//   const goToNext = () => {
//     if (activeIndex < mindMaps.length - 1) {
//       flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
//     }
//   };

//   // If you need to regenerate the mind map
//   const handleRegenerate = async (index) => {
//     const currentMap = mindMaps[index];
//     if (!currentMap.fileDetails) {
//       Alert.alert('Error', 'No file details available for regeneration.');
//       return;
//     }
//     try {
//       const regenerated = await generateMindMapData([], [], [currentMap.fileDetails]);
//       if (regenerated && regenerated.length > 0) {
//         const newMapData = regenerated[0];
//         const updatedMaps = [...mindMaps];
//         updatedMaps[index] = { ...newMapData, fileDetails: currentMap.fileDetails };
//         setMindMaps(updatedMaps);
//         Alert.alert('Success', 'Mind map regenerated successfully.');
//       } else {
//         Alert.alert('Error', 'Failed to regenerate mind map.');
//       }
//     } catch (error) {
//       console.error('Regeneration failed:', error);
//       Alert.alert('Error', 'Failed to regenerate mind map.');
//     }
//   };

//   return (
//     <SafeAreaView style={carouselStyles.container}>
//       <FlatList
//         data={mindMaps}
//         keyExtractor={(_, idx) => idx.toString()}
//         horizontal
//         snapToInterval={snapInterval}
//         decelerationRate="fast"
//         showsHorizontalScrollIndicator={false}
//         ref={flatListRef}
//         contentContainerStyle={{ paddingHorizontal: CARD_SPACING / 2 }}
//         onViewableItemsChanged={onViewableItemsChanged}
//         viewabilityConfig={viewConfigRef}
//         renderItem={({ item, index }) => (
//           <View style={[carouselStyles.card, { width: cardWidth, height: cardHeight }]}>
//             <SingleMindMap
//               data={item}
//               width={cardWidth}
//               height={cardHeight}
//               navigation={navigation}
//             />
//             {/* Regenerate Button - optional */}
//             <TouchableOpacity
//               style={carouselStyles.regenerateButton}
//               onPress={() => handleRegenerate(index)}
//             >
//               <Text style={carouselStyles.regenerateButtonText}>Regenerate</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />
//       {/* Pagination Dots */}
//       <View style={carouselStyles.paginationContainer}>
//         {mindMaps.map((_, idx) => (
//           <View
//             key={idx}
//             style={[
//               carouselStyles.paginationDot,
//               activeIndex === idx && carouselStyles.activeDot,
//             ]}
//           />
//         ))}
//       </View>
//       {/* Arrow Buttons */}
//       <TouchableOpacity style={carouselStyles.arrowButtonLeft} onPress={goToPrev}>
//         <Text style={carouselStyles.arrowText}>←</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={carouselStyles.arrowButtonRight} onPress={goToNext}>
//         <Text style={carouselStyles.arrowText}>→</Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// /* ---------------------------------------------------------------------
//    MindMap - Renders either a single mind map or a carousel
// --------------------------------------------------------------------- */
// const MindMap = ({ data }) => {
//   const navigation = useNavigation();
//   const { width, height } = useWindowDimensions();
//   if (Array.isArray(data)) {
//     return <MindMapCarousel data={data} navigation={navigation} />;
//   }
//   return <SingleMindMap data={data} width={width} height={height} navigation={navigation} />;
// };

// /* ---------------------------------------------------------------------
//    Styles
// --------------------------------------------------------------------- */
// const styles = StyleSheet.create({
//   mapContainer: {
//     width: '100%',
//     height: '100%',
//   },
// });

// const carouselStyles = StyleSheet.create({
//   container: {
//     // Make entire background transparent so the parent screen's background shows
//     flex: 1,
//     backgroundColor: 'transparent',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   card: {
//     // Remove the white background and shadows
//     backgroundColor: 'transparent',
//     borderRadius: 0,
//     elevation: 0,
//     shadowColor: 'transparent',
//     paddingBottom: 0,
//     marginHorizontal: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   regenerateButton: {
//     position: 'absolute',
//     bottom: 40,
//     backgroundColor: '#d9534f',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 5,
//   },
//   regenerateButtonText: {
//     color: '#fff',
//     fontSize: 12,
//   },
//   arrowButtonLeft: {
//     position: 'absolute',
//     left: 10,
//     top: '50%',
//     transform: [{ translateY: -25 }],
//     backgroundColor: '#473c38',
//     padding: 10,
//     borderRadius: 20,
//     zIndex: 999,
//   },
//   arrowButtonRight: {
//     position: 'absolute',
//     right: 10,
//     top: '50%',
//     transform: [{ translateY: -25 }],
//     backgroundColor: '#473c38',
//     padding: 10,
//     borderRadius: 20,
//     zIndex: 999,
//   },
//   arrowText: {
//     color: '#fff',
//     fontSize: 20,
//   },
//   paginationContainer: {
//     position: 'absolute',
//     bottom: 20,
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   paginationDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: '#ccc',
//     margin: 5,
//   },
//   activeDot: {
//     backgroundColor: '#473c38',
//   },
// });

// export default MindMap;
