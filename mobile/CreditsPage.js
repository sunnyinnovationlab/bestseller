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

export default function CreditsPage({ navigation }) {
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
      console.error('[Credits] Error opening URL:', error);
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
    creditsSection: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    creditItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    creditLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    creditValue: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'right',
    },
    creditValueContainer: {
      flex: 2,
      alignItems: 'flex-end',
    },
    specialThanksItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    specialThanksLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      marginBottom: 8,
    },
    specialThanksValue: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 30,
      paddingBottom: 20,
      marginTop: 20,
    },
    logoContainer: {
      alignItems: 'flex-start',
      flex: 1,
      height: 144,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logoImage: {
      height: 80,
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
      color: colors.link,
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
        <Icon name="account-group" size={24} color={colors.text} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Credits</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.creditsSection}>
          {/* Producer */}
          <View style={styles.creditItem}>
            <Text style={styles.creditLabel}>Producer</Text>
            <Text style={styles.creditValue}>R.S.</Text>
          </View>

          {/* Programmers */}
          <View style={styles.creditItem}>
            <Text style={styles.creditLabel}>Programmers</Text>
            <View style={styles.creditValueContainer}>
              <Text style={styles.creditValue}>Mary kwon, Damin Joo,</Text>
              <Text style={styles.creditValue}>Youngjee Park</Text>
            </View>
          </View>

              {/* UIUX designer */}
              <View style={styles.creditItem}>
                <Text style={styles.creditLabel}>UIUX designer</Text>
                <Text style={styles.creditValue}>Jenny Kim</Text>
              </View>

              {/* QA Testers */}
              <View style={styles.creditItem}>
                <Text style={styles.creditLabel}>QA Testers</Text>
                <Text style={styles.creditValue}></Text>
              </View>

              {/* Localization Managers */}
              <View style={styles.creditItem}>
                <Text style={styles.creditLabel}>Localization Managers</Text>
                <Text style={styles.creditValue}></Text>
              </View>

              {/* Special Thanks */}
          <View style={styles.specialThanksItem}>
            <Text style={styles.specialThanksLabel}>Special Thanks</Text>
            <Text style={styles.specialThanksValue}>
              Hyangsook Lee, Ohkyung Kwon, Donna Lee, Daniel Joo, Joan Lee, Sam Kim, Jeff Kim, Cabbage Kim, Domi Kim, Junwoo Park
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('./assets/SIL_logo_setting_mini_xxhdpi.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
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

