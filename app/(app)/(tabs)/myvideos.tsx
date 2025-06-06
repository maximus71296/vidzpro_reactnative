import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const myvideos = () => {
  return (
    <View style={styles.container}>
        <Text>My Videos</Text>
    </View>
  )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})

export default myvideos