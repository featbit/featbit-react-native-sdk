# FeatBit React Native SDK example

This project is an example of how to use the [featbit-react-native-sdk](https://github.com/featbit/featbit-react-native-sdk).
This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

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

## Get started

1. Install dependencies

   ```bash
   // In the root folder of the repo
   npm install && npm run build
   
   // In the examples/ExpoApp folder
   npm install
   
   // In the root folder of the repo
   npm link ./examples/ExpoApp/node_modules/react
   ```

2. Start the app

   ```bash
   // In the examples/ExpoApp folder
   npm run start
   
   // Then follow the instructions in the terminal to run the app in an emulator or on a physical device.
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).


## Troubleshooting

### Error: Hooks can only be called inside the body of a function component.
if see error: Hooks can only be called inside the body of a function component. just run the following command in the root folder of the repo.

```bash
npm link ./examples/ExpoApp/node_modules/react
```