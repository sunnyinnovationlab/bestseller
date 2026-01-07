import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { APP_VERSION } from './config/version';
import translationsData from './assets/translations.json';

// LANGUAGE_OPTIONS는 JSON 파일에서 동적으로 생성
export const getLanguageOptions = (translationsData, currentLanguage) => {
  if (!translationsData?.languageLabels) {
    // Fallback
    return [
      { label: 'Korean', value: 0 },
      { label: 'English', value: 1 },
      { label: 'Japanese', value: 2 },
      { label: 'Chinese (SC)', value: 3 },
      { label: 'Traditional Chinese', value: 4 },
      { label: 'French', value: 5 },
      { label: 'Spanish', value: 6 },
    ];
  }
  
  // 현재 선택된 언어로 각 언어 레이블 표시
  // 예: English로 선택했으면 모든 언어를 English로 표시
  return [0, 1, 2, 3, 4, 5, 6].map(value => ({
    label: translationsData.languageLabels[value]?.[currentLanguage] || 
           translationsData.languageLabels[value]?.[value] || 
           `Language ${value}`,
    value,
  }));
};

export default function SettingsPage({ navigation }) {
  const { language, setLanguage, userLanguage, setUserLanguage } = useLanguage();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSlideshowIntervalOpen, setIsSlideshowIntervalOpen] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState({ minutes: 0, seconds: 5 }); // 기본값: 5초
  const { theme, updateTheme, isDark, colors } = useTheme();
  
  // JSON 파일에서 언어 옵션 가져오기
  const LANGUAGE_OPTIONS = useMemo(() => {
    return getLanguageOptions(translationsData, userLanguage);
  }, [userLanguage]);
  
  // JSON 파일에서 번역 가져오기
  const getTranslation = (key) => {
    if (!translationsData || !translationsData.settings || !translationsData.settings[key]) {
      // Fallback: 기본값
      const fallbacks = {
        settings: 'Settings',
        language: 'Language',
        theme: 'Theme',
        dark: 'Dark',
        light: 'Light',
        instagram: 'Instagram',
        twitter: 'X (Twitter)',
        link: 'Link',
        sunnyGamesApps: "Sunny's Games and Apps",
        credits: 'Credits',
        openSourceInfo: 'Open Source Info',
        appVersion: 'App Version',
        slideshowInterval: 'Slideshow Interval',
      };
      if (key === 'slideshowInterval') {
        return translationsData?.settings?.slideshowInterval?.[userLanguage] || translationsData?.settings?.slideshowInterval?.['1'] || fallbacks[key];
      }
      return fallbacks[key] || key;
    }
    
    const translation = translationsData.settings[key];
    // userLanguage는 0=Korean, 1=English, 2=Japanese, 3=Chinese, 4=Traditional Chinese, 5=French, 6=Spanish
    return translation[userLanguage] || translation['1'] || key;
  };

  // 화면이 포커스될 때마다 테마 다시 불러오기
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // 테마는 ThemeContext에서 자동으로 불러옴
    });
    return unsubscribe;
  }, [navigation]);

  const handleLinkPress = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('[Settings] Error opening URL:', error);
      // 사용자에게 알림을 표시할 수도 있음
      alert(`링크를 열 수 없습니다: ${error.message}`);
    }
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
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
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedItem: {
      backgroundColor: colors.secondaryBackground,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    selectedLabel: {
      fontWeight: '600',
    },
    languageValue: {
      fontSize: 16,
      color: colors.text,
    },
    themeContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1e293b' : '#F5F5F5',
      borderRadius: 8,
      padding: 4,
      gap: 4,
    },
    themeOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: isDark ? '#334155' : '#E0E0E0',
    },
    themeOptionActive: {
      backgroundColor: isDark ? '#1a1f2e' : '#9d4edd',
      borderColor: isDark ? '#1a1f2e' : '#9d4edd',
    },
    themeOptionText: {
      fontSize: 14,
      color: isDark ? (theme === 'Dark' ? '#60a5fa' : '#94a3b8') : (theme === 'Dark' ? '#fff' : '#000'),
      fontWeight: '500',
    },
    themeOptionTextActive: {
      color: isDark ? '#60a5fa' : '#fff',
      fontWeight: '600',
    },
    linkText: {
      fontSize: 16,
      color: colors.link,
      fontWeight: '600',
    },
    languageList: {
      backgroundColor: colors.secondaryBackground,
    },
    languageOptionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedLanguageOption: {
      backgroundColor: isDark ? '#1e293b' : '#E8F0FE',
    },
    languageOptionText: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    selectedLanguageText: {
      color: colors.link,
      fontWeight: '600',
    },
    versionText: {
      fontSize: 16,
      color: colors.secondaryText,
      fontWeight: '500',
    },
    slideshowIntervalPicker: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    settingSubLabel: {
      fontSize: 12,
      color: colors.secondaryText,
    },
  }), [colors, isDark]);

  return (
    <View style={dynamicStyles.container}>
      {/* 헤더 */}
      <View style={dynamicStyles.header}>
        <Icon name="cog" size={24} color={colors.text} style={styles.headerIcon} />
        <Text style={dynamicStyles.headerTitle}>{getTranslation('settings')}</Text>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.primaryBackground }]} contentContainerStyle={styles.scrollContent}>
        {/* Language */}
        <View>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsLanguageOpen(!isLanguageOpen)}
          >
            <Text style={dynamicStyles.settingLabel}>{getTranslation('language')}</Text>
            <View style={styles.languageContainer}>
              <Text style={dynamicStyles.languageValue}>
                {translationsData?.languageLabels?.[userLanguage]?.[userLanguage] || 
                 translationsData?.languageLabels?.[userLanguage]?.[1] || 
                 '한국어'}
              </Text>
              <Icon name={isLanguageOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.secondaryText} />
            </View>
          </TouchableOpacity>

          {isLanguageOpen && (
            <View style={dynamicStyles.languageList}>
              {LANGUAGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    dynamicStyles.languageOptionItem,
                    language === option.value && dynamicStyles.selectedLanguageOption
                  ]}
                  onPress={async () => {
                    setUserLanguage(option.value);
                    setLanguage(option.value + 1);
                    setIsLanguageOpen(false);
                    // MainScreen에서 사용할 언어 이름 저장
                    const languageNames = ['Korean', 'English', 'Japanese', 'Chinese', 'Traditional Chinese', 'French', 'Spanish'];
                    const languageName = languageNames[option.value] || 'English';
                    try {
                      await AsyncStorage.setItem('appLanguage', languageName);
                    } catch (error) {
                        console.error('[Settings] Failed to save language:', error);
                    }
                  }}
                >
                  <Text style={[
                    dynamicStyles.languageOptionText,
                    userLanguage === option.value && dynamicStyles.selectedLanguageText
                  ]}>
                    {option.label}
                  </Text>
                  {userLanguage === option.value && (
                    <Icon name="check" size={20} color={colors.link} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Slideshow Interval */}
        <View>
          <TouchableOpacity
            style={dynamicStyles.settingItem}
            activeOpacity={0.7}
            onPress={() => setIsSlideshowIntervalOpen(!isSlideshowIntervalOpen)}
          >
            <Text style={dynamicStyles.settingLabel}>
              {getTranslation('slideshowInterval')}
            </Text>
            <View style={styles.languageContainer}>
              <Text style={dynamicStyles.languageValue}>
                {slideshowInterval.minutes > 0 && `${slideshowInterval.minutes}m `}
                {slideshowInterval.seconds > 0 && `${slideshowInterval.seconds}s`}
                {slideshowInterval.minutes === 0 && slideshowInterval.seconds === 0 && 'Not set'}
              </Text>
              <Icon name={isSlideshowIntervalOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.secondaryText} />
            </View>
          </TouchableOpacity>

          {isSlideshowIntervalOpen && (
            <View style={[dynamicStyles.slideshowIntervalPicker, { backgroundColor: colors.secondaryBackground }]}>
              <Text style={[dynamicStyles.pickerLabel, { color: colors.text }]}>Minutes (1-14)</Text>
              <ScrollView style={styles.timePickerScrollView} nestedScrollEnabled={true}>
                <View style={styles.timePickerRow}>
                  {Array.from({ length: 14 }, (_, i) => i + 1).map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timePickerButton,
                        { borderColor: colors.border },
                        slideshowInterval.minutes === minute && { backgroundColor: colors.link },
                      ]}
                      onPress={() => setSlideshowInterval({ ...slideshowInterval, minutes: minute })}
                    >
                      <Text style={[
                        styles.timePickerButtonText,
                        { color: slideshowInterval.minutes === minute ? '#fff' : colors.text },
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={[dynamicStyles.pickerLabel, { color: colors.text, marginTop: 16 }]}>Seconds</Text>
              <ScrollView style={styles.timePickerScrollView} nestedScrollEnabled={true}>
                <View style={styles.timePickerRow}>
                  {Array.from({ length: 60 }, (_, i) => i).map((second) => (
                    <TouchableOpacity
                      key={second}
                      style={[
                        styles.timePickerButton,
                        { borderColor: colors.border },
                        slideshowInterval.seconds === second && { backgroundColor: colors.link },
                      ]}
                      onPress={() => setSlideshowInterval({ ...slideshowInterval, seconds: second })}
                    >
                      <Text style={[
                        styles.timePickerButtonText,
                        { color: slideshowInterval.seconds === second ? '#fff' : colors.text },
                      ]}>
                        {second}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Theme */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{getTranslation('theme')}</Text>
          <View style={dynamicStyles.themeContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.themeOption,
                theme === 'Dark' && dynamicStyles.themeOptionActive,
              ]}
              onPress={() => updateTheme('Dark')}
            >
              <Text
                style={[
                  dynamicStyles.themeOptionText,
                  theme === 'Dark' && dynamicStyles.themeOptionTextActive,
                ]}
              >
                {getTranslation('dark')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.themeOption,
                theme === 'Light' && dynamicStyles.themeOptionActive,
              ]}
              onPress={() => updateTheme('Light')}
            >
              <Text
                style={[
                  dynamicStyles.themeOptionText,
                  theme === 'Light' && dynamicStyles.themeOptionTextActive,
                ]}
              >
                {getTranslation('light')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instagram */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{getTranslation('instagram')}</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://www.instagram.com/sunnyinnolab/')}
          >
            <Text style={dynamicStyles.linkText}>{getTranslation('link')}</Text>
          </TouchableOpacity>
        </View>

        {/* X (Twitter) */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{getTranslation('twitter')}</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://x.com/Sunnyinnolab')}
          >
            <Text style={dynamicStyles.linkText}>{getTranslation('link')}</Text>
          </TouchableOpacity>
        </View>

        {/* Sunny's Games and Apps */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SunnyGamesApps')}
        >
          <Text style={dynamicStyles.settingLabel}>{getTranslation('sunnyGamesApps')}</Text>
          <Icon name="chevron-right" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        {/* Credits */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Credits')}
        >
          <Text style={dynamicStyles.settingLabel}>{getTranslation('credits')}</Text>
          <Icon name="chevron-right" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        {/* Open Source Info */}
        <TouchableOpacity
          style={dynamicStyles.settingItem}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('OpenSourceInfo')}
        >
          <Text style={dynamicStyles.settingLabel}>{getTranslation('openSourceInfo')}</Text>
          <Icon name="chevron-right" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        {/* App Version */}
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.settingLabel}>{getTranslation('appVersion')}</Text>
          <Text style={dynamicStyles.versionText}>v {APP_VERSION}</Text>
        </View>

        {/* 써니 로고 배너 - 가로 배치 (다른 페이지와 동일) */}
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

const styles = StyleSheet.create({
  headerIcon: {
    marginRight: 12,
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
  },
  footerDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timePickerScrollView: {
    maxHeight: 120,
  },
  timePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timePickerButton: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  timePickerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
