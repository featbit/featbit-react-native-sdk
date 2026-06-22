import React, { useEffect } from 'react';
import {Text, View} from 'react-native';
import {useFbClient, useFlags, UserBuilder} from '@featbit/react-client-sdk';

export default function TwoFlagsComponent() {
  const flags = useFlags();
  const flagA = flags["flag-a"];
  const flagB = flags["flag-b"];
  const fbClient = useFbClient();

  useEffect(() => {
    if (!fbClient) return;
    let active = true;

    const loadVarations = async (keys: string[]) => {
      const all = await fbClient.getAllVariations();
      console.log('loadVarations', keys);
      if (active) {
        console.log('active in loadVariations');
      }
    }

    fbClient.on("update", loadVarations);

    return () => {
      active = false;
      fbClient.off("update", loadVarations);
    }
  }, [fbClient])

  // useEffect(() => {
  //   const variationId = `203:${flagA}:exclusive`;
  //   const user = new UserBuilder("fb-demo-user-key")
  //     .name("the user name")
  //     .custom("loggedIn", "true")
  //     .custom("variationId", variationId)
  //     .build();
  //
  //   fbClient?.identify(user);
  // }, [fbClient, flagA]);

  return (
    <View
      style={[
        {
          marginTop: 32,
          paddingHorizontal: 24,
        },
      ]}>
      <Text
        style={[
          {
            textAlign: 'center',
            fontSize: 30,
            fontWeight: '700',
          },
        ]}>
        flagA: {flagA}
      </Text>
      <Text
        style={[
          {
            textAlign: 'center',
            fontSize: 30,
            fontWeight: '700',
          },
        ]}>
        flagB: {flagB}
      </Text>
    </View>
  );
}
