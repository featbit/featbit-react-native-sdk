import React from 'react';
import {Text, View} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {useFlags} from '@featbit/react-client-sdk';

export default function TestCompoment({isDarkMode}: {isDarkMode: boolean}) {
  const {robot} = useFlags();
  return (
    <View
      style={[
        {
          marginTop: 32,
          paddingHorizontal: 24,
        },
      ]}>
      {robot === 'AlphaGo' && (
        <Text
          style={[
            {
              color: isDarkMode ? Colors.white : Colors.black,
              textAlign: 'center',
              fontSize: 30,
              fontWeight: '700',
            },
          ]}>
          AlphaGo 🤖
        </Text>
      )}
    </View>
  );
}
