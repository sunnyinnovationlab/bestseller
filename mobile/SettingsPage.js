import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SettingsPage({ navigation }) {
  const [haptics, setHaptics] = useState(true);
  const [notification, setNotification] = useState(true);
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('Light'); // 'Dark' or 'Light'

  const handleLinkPress = async (url) => {
    try {
      console.log('🔗 Opening URL:', url);
      const supported = await Linking.canOpenURL(url);
      console.log('🔗 Can open URL:', supported);
      
      if (supported) {
        await Linking.openURL(url);
        console.log('🔗 URL opened successfully');
      } else {
        // canOpenURL이 false를 반환해도 직접 시도
        console.log('🔗 canOpenURL returned false, trying anyway...');
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('❌ Error opening URL:', error);
      // 사용자에게 알림을 표시할 수도 있음
      alert(`링크를 열 수 없습니다: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Icon name="cog" size={24} color="#000" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* User Data */}
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('UserData')}
          activeOpacity={0.7}
        >
          <Text style={styles.settingLabel}>User Data</Text>
          <Icon name="chevron-right" size={24} color="#666" />
        </TouchableOpacity>

        {/* Sound */}
        <TouchableOpacity
          style={[styles.settingItem, styles.selectedItem]}
          activeOpacity={0.7}
        >
          <Text style={[styles.settingLabel, styles.selectedLabel]}>Sound</Text>
        </TouchableOpacity>

        {/* Haptics */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Haptics</Text>
          <Switch
            value={haptics}
            onValueChange={setHaptics}
            trackColor={{ false: '#767577', true: '#9d4edd' }}
            thumbColor={haptics ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#767577"
          />
        </View>

        {/* Notification */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notification</Text>
          <Switch
            value={notification}
            onValueChange={setNotification}
            trackColor={{ false: '#767577', true: '#9d4edd' }}
            thumbColor={notification ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#767577"
          />
        </View>

        {/* Language */}
        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
        >
          <Text style={styles.settingLabel}>Language</Text>
          <View style={styles.languageContainer}>
            <Text style={styles.languageValue}>{language}</Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Theme */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Theme</Text>
          <View style={styles.themeContainer}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                theme === 'Dark' && styles.themeOptionActive,
              ]}
              onPress={() => setTheme('Dark')}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  theme === 'Dark' && styles.themeOptionTextActive,
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                theme === 'Light' && styles.themeOptionActive,
              ]}
              onPress={() => setTheme('Light')}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  theme === 'Light' && styles.themeOptionTextActive,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instagram */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Instagram</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://www.instagram.com/sunnyinnolab/')}
          >
            <Text style={styles.linkText}>Link</Text>
          </TouchableOpacity>
        </View>

        {/* X (Twitter) */}
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>X (Twitter)</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleLinkPress('https://x.com/Sunnyinnolab')}
          >
            <Text style={styles.linkText}>Link</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  selectedItem: {
    backgroundColor: '#F5F5F5',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
  },
  selectedLabel: {
    fontWeight: '600',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageValue: {
    fontSize: 16,
    color: '#000',
  },
  themeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  themeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  themeOptionActive: {
    backgroundColor: '#9d4edd',
    borderColor: '#9d4edd',
  },
  themeOptionText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  linkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#9d4edd',
    fontWeight: '600',
  },
});
