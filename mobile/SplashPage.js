import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Animated, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import translationsData from './assets/translations.json';

export default function SplashPage({ navigation }) {
  const { userLanguage } = useLanguage();
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);


  // Back 키 비활성화
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 뒤로가기 키를 눌러도 아무 동작도 하지 않음
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Navigation beforeRemove 이벤트로 뒤로가기 방지
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // 뒤로가기 방지
      e.preventDefault();
    });

    return unsubscribe;
  }, [navigation]);

  // 자동으로 메인 화면으로 이동 (2초 후)
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Main');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  useEffect(() => {
    const animateDots = () => {
      // 첫 번째 점
      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // 두 번째 점 (200ms 지연)
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);

      // 세 번째 점 (400ms 지연)
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 400);
    };

    // 초기 애니메이션 시작
    animateDots();

    // 반복 실행 (각 사이클은 약 1.2초)
    const interval = setInterval(animateDots, 1200);

    return () => clearInterval(interval);
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  // JSON 파일에서 번역 가져오기
  const title = translationsData?.splash?.title?.[userLanguage] || translationsData?.splash?.title?.[1] || 'World Best Sellers';
  const subtitle = translationsData?.splash?.subtitle?.[userLanguage] || translationsData?.splash?.subtitle?.[1] || 'Discover amazing books the world is talking about!';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('./assets/Frame1.png')}
          style={styles.iconImage}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? colors.primaryBackground : '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconImage: {
    width: 150,
    height: 75,
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: isDark ? colors.text : '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: isDark ? colors.secondaryText : '#E3F2FD',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 48,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: isDark ? colors.secondaryText : '#E3F2FD',
  },
});
