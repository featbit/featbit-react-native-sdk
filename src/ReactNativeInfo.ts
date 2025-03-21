import { IInfo, IPlatformData, ISdkData } from "@featbit/react-client-sdk";
import { name, version } from './version';
import { Platform, type PlatformAndroidStatic } from "react-native";

export class ReactNativeInfo implements IInfo {
  get appType(): string {
    return "React-Native-Client-SDK";
  }

  platformData(): IPlatformData {
    return {
      name: 'React Native',
      fbDevice: {
        manufacturer: Platform.select({
          ios: 'apple',
          android: (Platform as PlatformAndroidStatic).constants.Manufacturer,
        }),
        model: Platform.select({
          // ios: model n/a from PlatformIOSStatic
          android: (Platform as PlatformAndroidStatic).constants.Model,
        }),
        os: {
          family: Platform.select({
            ios: 'apple',
            default: Platform.OS,
          }),
          name: Platform.OS,
          version: Platform.Version?.toString(),
        },
      }
    };
  }

  sdkData(): ISdkData {
    return {
      name: name,
      version: version,
      userAgent: `${ this.appType }/${ version }`,
    };
  }
}