import React from 'react';
import { View, Text, Button } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View>
      <Text>Welcome to Driver's License Scanner</Text>
      <Button
        title="Scan Driver's License"
        onPress={() => navigation.navigate('Scan')}
      />
    </View>
  );
};

export default HomeScreen;