import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewOrFallback = ({ uri, style }) => {
  if (Platform.OS === 'web') {
    // On web, we cannot use react-native-webview, so use <iframe>:
    return (
      <View style={[styles.iframeContainer, style]}>
        <iframe
          src={uri}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Embedded Website"
        />
      </View>
    );
  } else {
    // On iOS/Android, use react-native-webview:
    return (
      <WebView
        source={{ uri }}
        style={style}
        startInLoadingState
      />
    );
  }
};

const styles = StyleSheet.create({
  iframeContainer: {
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
});

export default WebViewOrFallback;
