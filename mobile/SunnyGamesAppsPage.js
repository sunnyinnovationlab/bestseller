import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from './ThemeContext';

const APP_LIST = [
  {
    name: 'Sky Peacemaker - Finger Force',
    link: 'https://skypeacemaker.onelink.me/YQxG/8s9sx66i',
    icon: require('./assets/Sky Peacemaker - Finger Force Icon.png'),
  },
  {
    name: 'World Movie Trailer',
    link: 'https://wmt.onelink.me/YPN9/m428wgpq',
    icon: require('./assets/World Movie Trailer New Icon.png'),
  },
  {
    name: 'Find Four',
    link: 'https://findfour.onelink.me/vurA/0tfteiuf',
    icon: require('./assets/Find Four Icon.png'),
  },
  {
    name: 'Dual Flashlight',
    link: 'https://dualflashlight.onelink.me/7gkq/qpbc8y65',
    icon: require('./assets/Dual Flashlight Icon.png'),
  },
  {
    name: 'decibella',
    link: 'https://decibella.onelink.me/Ve6i/vydwhkh4',
    icon: require('./assets/decibella Icon 1024.png'),
  },
  {
    name: 'Wisdom Qclock',
    link: 'https://wisdomqclock.onelink.me/SVr2/b7gs4og1',
    icon: require('./assets/Wisdom Qclock Icon.png'),
  },
];

export default function SunnyGamesAppsPage({ navigation }) {
  const { colors, isDark } = useTheme();

  const handleAppPress = async (link) => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        await Linking.openURL(link);
      }
    } catch (error) {
      console.error('[SunnyGamesApps] Error opening URL:', error);
      alert(`링크를 열 수 없습니다: ${error.message}`);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      backgroundColor: colors.primaryBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerIcon: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    appsSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    appItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    appIcon: {
      width: 48,
      height: 48,
      borderRadius: 10,
      marginRight: 12,
    },
    appNameContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    appName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    linkText: {
      fontSize: 16,
      color: colors.link,
      fontWeight: '500',
    },
  }), [colors, isDark]);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Icon name="apps" size={24} color={colors.text} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Sunny's Games and Apps</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.appsSection}>
          {APP_LIST.map((app, index) => (
            <TouchableOpacity
              key={index}
              style={styles.appItem}
              activeOpacity={0.7}
              onPress={() => handleAppPress(app.link)}
            >
              <View style={styles.appNameContainer}>
                {app.icon && (
                  <Image
                    source={app.icon}
                    style={styles.appIcon}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.appName}>{app.name}</Text>
              </View>
              <Text style={styles.linkText}>Link</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

