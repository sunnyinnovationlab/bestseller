import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// 이미지에 나온 색상 팔레트
export const colors = {
  light: {
    primaryBackground: '#FFFFFF',
    secondaryBackground: '#F5F5F5',
    text: '#000000',
    secondaryText: '#666666',
    border: '#E0E0E0',
    link: '#9d4edd',
  },
  dark: {
    primaryBackground: '#1a1f2e', // Deep Blue
    secondaryBackground: '#1e293b', // Dark Indigo
    text: '#60a5fa', // Soft Blue Text
    secondaryText: '#94a3b8', // Ashy Blue
    border: '#334155',
    link: '#60a5fa',
    white: '#FFFFFF', // Pure White
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('Light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('[Theme] Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('appTheme', newTheme);
    } catch (error) {
      console.error('[Theme] Failed to save theme:', error);
    }
  };

  const isDark = theme === 'Dark';
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, isDark, colors: themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

