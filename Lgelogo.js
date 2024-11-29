import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function Lgelogo() {
  return (
    <View style={styles.headerContainer}>
      <Image
        source={require('./assets/lge_logo.png')} // Adjust the path as needed
        style={styles.newLogo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    right: 20,
  },
  newLogo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },
});
