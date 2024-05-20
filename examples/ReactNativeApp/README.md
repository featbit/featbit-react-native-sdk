# FeatBit React Native SDK example

This project is an example of how to use the [featbit-react-native-sdk](https://github.com/featbit/featbit-react-native-sdk).
It is built based on the project bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

This example asumes you have a FeatBit environment created which has the following sdkKey
```
Obg68EqYZk27JTxphPgy7At1aJ8GaAtEaIA1fb3IpuEA.
```

This environment has the following flags:
```javascript
{
    "id": "robot",
    "variation": "AlphaGo",
    // variation data type, string will be used if not specified
    variationType: VariationDataType.string
},
```

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
   // In the root folder of the repo
   npm install && npm run build
   
   // In the examples/ExpoApp folder
   npm install
   
   // In the root folder of the repo
   npm link ./examples/ExpoApp/node_modules/react
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

```bash
# using npm
npm run start

// Then follow the instructions in the terminal to run the app in an emulator or on a physical device.
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Troubleshooting

### Error: Hooks can only be called inside the body of a function component.
if see error: Hooks can only be called inside the body of a function component. just run the following command in the root folder of the repo.
```bash
npm link ./examples/ReactNativeApp/node_modules/react
```
