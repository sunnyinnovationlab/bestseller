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

// 오픈소스 라이브러리 정보
const openSourceLibraries = [
  { name: 'react', version: '19.1.1' },
  { name: 'react-native', version: '0.82.1' },
  { name: 'expo', version: '~51.0.0' }, // Expo는 React Native와 함께 사용되는 경우가 많음
  { name: '@react-navigation/native', version: '7.1.19' },
  { name: '@react-navigation/native-stack', version: '7.6.2' },
  { name: 'react-native-screens', version: '4.18.0' },
  { name: 'react-native-safe-area-context', version: '5.6.2' },
  { name: 'react-native-gesture-handler', version: '2.29.1' },
  { name: 'react-native-svg', version: '15.15.0' },
  { name: 'react-native-webview', version: '13.16.0' },
  { name: '@react-native-async-storage/async-storage', version: '2.2.0' },
  { name: 'axios', version: '1.13.2' },
  { name: 'express', version: '5.1.0' },
  { name: 'cors', version: '2.8.5' },
  { name: 'puppeteer', version: '24.29.0' },
  { name: 'puppeteer-extra', version: '3.3.6' },
  { name: 'puppeteer-extra-plugin-stealth', version: '2.11.2' },
  { name: 'cheerio', version: '1.1.2' },
  { name: 'react-native-google-mobile-ads', version: '16.0.0' },
  { name: 'react-native-vector-icons', version: '10.3.0' }, // 추가
  { name: 'csv-parse', version: '6.0.0' }, // 추가
];

export default function OpenSourceInfoPage({ navigation }) {
  const { colors, isDark } = useTheme();

  const handleLinkPress = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('[OpenSourceInfo] Error opening URL:', error);
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
    librariesSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    libraryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    libraryName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    libraryVersion: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'right',
    },
    sunnyBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 20,
      height: 70, // 높이 70px
      backgroundColor: '#2d2d2d', // 진한 회색 배경
    },
    logoContainer: {
      alignItems: 'flex-start',
      flex: 1,
      height: 70,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logoImage: {
      height: 70,
      width: 120,
    },
    footerLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 16,
      flex: 1,
    },
    footerLink: {
      fontSize: 14,
      color: '#ffffff', // 흰색 (다크모드/라이트모드 모두)
      fontWeight: '500',
    },
    footerDivider: {
      width: 1,
      height: 14,
      backgroundColor: colors.border,
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
        <Icon name="cog" size={24} color={colors.text} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Open Source Info</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.librariesSection}>
          {openSourceLibraries.map((library, index) => (
            <View key={index} style={styles.libraryItem}>
              <Text style={styles.libraryName}>{library.name}</Text>
              <Text style={styles.libraryVersion}>{library.version}</Text>
            </View>
          ))}
        </View>

        {/* 써니 로고 배너 - 높이 144px (xxhdpi 기준) */}
        <View style={styles.sunnyBanner}>
          <View style={styles.logoContainer}>
            <TouchableOpacity
              onPress={() => handleLinkPress('https://sunnyinnolab.com')}
              activeOpacity={0.7}
            >
              <Image
                source={require('./assets/SIL_logo_setting_mini_xxhdpi.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => handleLinkPress('https://marmalade-neptune-dbe.notion.site/Terms-Conditions-c18656ce6c6045e590f652bf8291f28b?pvs=74')}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
            <TouchableOpacity onPress={() => handleLinkPress('https://marmalade-neptune-dbe.notion.site/Privacy-Policy-ced8ead72ced4d8791ca4a71a289dd6b')}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

