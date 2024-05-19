# Featbit Client-Side SDK for React Native

## Introduction

This is the React client side SDK for the feature management platform [FeatBit](https://www.featbit.co).

Be aware, this is a client side SDK, it is intended for use in a single-user context, which can be mobile, desktop or embeded applications. This SDK is designed to be used for React Native projects.

> The React Native SDK is based on the React Client SDK  
The React SDK builds on FeatBit's React Client SDK (the latter depends on the JavaScript client SDK) to provide a better integration for use in React Native applications. As a result, much of the React Client SDK and JavaScript SDK functionality is also available for the React Native SDK to use.

## Getting started
### Install

```
npm install @featbit/react-native-sdk
```

### Prerequisite

Before using the SDK, you need to obtain the environment secret and SDK URLs.

Follow the documentation below to retrieve these values

- [How to get the environment secret](https://docs.featbit.co/sdk/faq#how-to-get-the-environment-secret)
- [How to get the SDK URLs](https://docs.featbit.co/sdk/faq#how-to-get-the-sdk-urls)

### Quick Start

The following code demonstrates:
1. Initialize the SDK
2. Evaluate flag with userFlags hook

```javascript
// src/TestComponent.tsx
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

// App.tsx
import React from 'react';
import {
    SafeAreaView,
    useColorScheme
} from 'react-native';
import type { PropsWithChildren } from 'react';
import {buildConfig, withFbProvider} from '@featbit/react-native-sdk';
import TestCompoment from './src/TestComponent.tsx';

function App(): React.JSX.Element {
    const isDarkMode = useColorScheme() === 'dark';

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };

    return (
        <SafeAreaView style={backgroundStyle}>
            <TestCompoment isDarkMode={isDarkMode} />
        </SafeAreaView>
    )
}

const options = {
    user: {
        name: 'the user name',
        keyId: 'fb-demo-user-key',
        customizedProperties: []
    },
    sdkKey: 'YOUR ENVIRONMENT SECRET',
    streamingUrl: 'THE STREAMING URL',
    eventsUrl: 'THE EVENTS URL'
};

export default withFbProvider(buildConfig({options}))(App);
```

## Examples

- [React Native APP](./examples/ReactNativeApp)

## SDK

The React Native SDK depends on the React Client SDK, please refer to the [React Client SDK](https://github.com/featbit/featbit-react-client-sdk) for more information.
The Main difference between the React Client SDK and the React Native SDK is the way the SDK is initialized.

### Initializing the SDK
After you install the dependency, initialize the React SDK. You can do this in one of two ways:

- Using the `asyncWithFbProvider` function
- Using the `withFbProvider` function

Before using either of the above ways, you need to create a `IOption` object and please make sure that you have called the `buildConfig` function with the `IOption` object as an argument.

```javascript
function App(): React.JSX.Element {
    // The App component code ...
}

const options = {
    user: {
        name: 'the user name',
        keyId: 'fb-demo-user-key',
        customizedProperties: []
    },
    sdkKey: 'YOUR ENVIRONMENT SECRET',
    streamingUrl: 'THE STREAMING URL',
    eventsUrl: 'THE EVENTS URL'
};

// This line is needed to initialize the SDK
const config = buildConfig({options});

export default withFbProvider(config)(App);

```