import React from 'react';
import {Text, View} from 'react-native';
import {useFlags} from '@featbit/react-client-sdk';

export default function TestCompoment() {
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
