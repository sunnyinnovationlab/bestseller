import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookmarkScreen from './Bookmark';
import SettingsPage from './SettingsPage';
import LoadingScreen from './LoadingScreen';
import { useBookmark } from './BookmarkContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { BannerAdSize, InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import MyAds from './BannerAd';
import translationsData from './assets/translations.json';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3940256099942544/1033173712';

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const COUNTRY_TABS = [
  { label: 'KOR', index: 0 },
  { label: 'USA', index: 1 },
  { label: 'JPN', index: 2 },
  { label: 'GBR', index: 3 },
  { label: 'CHN', index: 4 },
  { label: 'TPE', index: 5 },
  { label: 'FRA', index: 6 },
  { label: 'ESP', index: 7 },
];

const INDEX_TO_COUNTRY_LABEL = {
  0: 'KOR',
  1: 'USA',
  2: 'JPN',
  3: 'GBR',
  4: 'CHN',
  5: 'TPE',
  6: 'FRA',
  7: 'ESP',
};

const COUNTRY_LABEL_TO_INDEX = {
  'KOR': 0,
  'USA': 1,
  'JPN': 2,
  'GBR': 3,
  'CHN': 4,
  'TPE': 5,
  'FRA': 6,
  'ESP': 7,
};

const COUNTRY_INDEX_TO_LABEL_COLUMN = {
  0: 1, // KOR -> Column B (English)
  1: 0, // USA -> Column A (Korean)
  2: 0, // JPN -> Column A (Korean)
  3: 0, // GBR -> Column A (Korean)
  4: 0, // CHN -> Column A (Korean)
  5: 0, // TPE -> Column A (Korean)
  6: 0, // FRA -> Column A (Korean)
  7: 0, // ESP -> Column A (Korean)
};

export default function MainScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      interstitial.load();
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const { isBookmarked, toggleBookmark } = useBookmark();
  const { colors, isDark } = useTheme();
  const {
    country,
    setCountry,
    language,
    setLanguage,
    userLanguage,
    filteredData,
    originalLangs,
    loading,
    error,
    fetchSheets,
  } = useLanguage();

  const activeCountryTab = useMemo(
    () => INDEX_TO_COUNTRY_LABEL[country] ?? 'KOR',
    [country]
  );

  const orderedCountryTabs = useMemo(() => {
    let order = ['KOR', 'USA', 'JPN', 'GBR', 'CHN', 'TPE', 'FRA', 'ESP'];
    
    if (userLanguage === 1) { // English
      // 영어에서는 FRA 다음에 ESP 위치
      order = ['USA', 'GBR', 'KOR', 'JPN', 'CHN', 'TPE', 'FRA', 'ESP'];
    } else if (userLanguage === 2) { // Japanese
      order = ['JPN', 'USA', 'KOR', 'GBR', 'CHN', 'TPE', 'FRA', 'ESP'];
    } else if (userLanguage === 3) { // Chinese
      order = ['CHN', 'USA', 'KOR', 'JPN', 'GBR', 'TPE', 'FRA', 'ESP'];
    } else if (userLanguage === 4) { // Traditional Chinese
      order = ['TPE', 'USA', 'KOR', 'JPN', 'GBR', 'CHN', 'FRA', 'ESP'];
    } else if (userLanguage === 5) { // French
      order = ['FRA', 'USA', 'GBR', 'KOR', 'JPN', 'CHN', 'TPE', 'ESP'];
    } else if (userLanguage === 6) { // Spanish
      // 스페인어일 때는 스페인을 제일 앞에 위치
      order = ['ESP', 'USA', 'GBR', 'KOR', 'JPN', 'CHN', 'TPE', 'FRA'];
    } else {
      // 지원하지 않는 언어에서는 FRA 다음에 ESP 위치
      order = ['KOR', 'USA', 'JPN', 'GBR', 'CHN', 'TPE', 'FRA', 'ESP'];
    }

    return order.map(label => COUNTRY_TABS.find(tab => tab.label === label));
  }, [userLanguage]);

  const books = useMemo(
    () =>
      filteredData.map(row => ({
        image: row[0] || '', // B행: 이미지 URL
        link: row[1] || '', // C행: View on Store URL
        title: row[2] || '',
        author: row[3] || '',
        authorInfo: row[4] || '',
        description: row[5] || '', // G행: 도서정보
        moreInfo: row[6] || '', // H행: 상세정보
      })),
    [filteredData]
  );

  // JSON 파일에서 언어 레이블 가져오기
  const userLanguageLabel = useMemo(() => {
    if (translationsData?.languageLabels?.[userLanguage]?.[userLanguage]) {
      // 현재 선택된 언어로 언어 레이블 표시 (예: English로 선택하면 "English" 표시)
      return translationsData.languageLabels[userLanguage][userLanguage];
    }
    // Fallback
    const fallbacks = {
      0: '한국어',
      1: 'English',
      2: '日本語',
      3: 'Chinese (SC)',
      4: 'Traditional Chinese',
      5: 'French',
      6: 'Spanish',
    };
    return fallbacks[userLanguage] || '한국어';
  }, [userLanguage]);

  const originalLanguageIndex = COUNTRY_INDEX_TO_LABEL_COLUMN[country] ?? 1;
  
  const originalLabel = useMemo(() => {
    if (originalLangs && originalLangs[userLanguage]) {
      return originalLangs[userLanguage];
    }
    return 'Original';
  }, [userLanguage, originalLangs]);

  const setCountryByLabel = label => {
    const nextIndex = COUNTRY_LABEL_TO_INDEX[label];
    if (typeof nextIndex === 'number') {
      setCountry(nextIndex);
    }
  };

  // JSON 파일에서 나라 이름 번역 가져오기
  const getCountryName = (countryLabel) => {
    if (!translationsData?.countries?.[countryLabel]) {
      return countryLabel;
    }
    const countryData = translationsData.countries[countryLabel];
    // userLanguage: 0=Korean, 1=English, 2=Japanese, 3=Chinese, 4=Traditional Chinese, 5=French, 6=Spanish
    return countryData[userLanguage] || countryData['1'] || countryLabel;
  };
  
  // JSON 파일에서 Best Sellers 텍스트 가져오기
  const getBestSellersText = () => {
    if (!translationsData?.bestSellers) {
      return 'Best Sellers';
    }
    return translationsData.bestSellers[userLanguage] || translationsData.bestSellers['1'] || 'Best Sellers';
  };

  // 📚 책 아이템 렌더링
  const renderBookItem = ({ item, index }) => {
    const getDetailScreen = () => {
      if (activeCountryTab === 'KOR') return 'KrDetail';
      if (activeCountryTab === 'JPN') return 'JpDetail';
      if (activeCountryTab === 'USA') return 'UsDetail';
      if (activeCountryTab === 'TPE') return 'TwDetail';
      if (activeCountryTab === 'FRA') return 'FrDetail';
      if (activeCountryTab === 'GBR') return 'UkDetail';
      if (activeCountryTab === 'CHN') return 'TwDetail'; // 임시로 대만 디테일 사용
      if (activeCountryTab === 'ESP') return 'EsDetail';
      return 'UsDetail';
    };

    const getCountry = () => {
      if (activeCountryTab === 'KOR') return 'KR';
      if (activeCountryTab === 'JPN') return 'JP';
      if (activeCountryTab === 'USA') return 'US';
      if (activeCountryTab === 'TPE') return 'TW';
      if (activeCountryTab === 'FRA') return 'FR';
      if (activeCountryTab === 'GBR') return 'UK';
      if (activeCountryTab === 'CHN') return 'CN';
      if (activeCountryTab === 'ESP') return 'ES';
      return 'US';
    };

    return (
      <TouchableOpacity
        style={[styles.bookItem, { borderBottomColor: colors.border }]}
        onPress={() => {
          navigation.navigate(getDetailScreen(), {
            book: {
              title: item.title,
              author: item.author,
              publisher: item.publisher,
              image: item.image,
              link: item.link,
              country: getCountry(),
              // 상세 정보 필드도 전달 (캐시에서 온 데이터)
              description: item.description,
              contents: item.contents,
              authorInfo: item.authorInfo,
              publisherReview: item.publisherReview,
              plot: item.plot,
              moreInfo: item.moreInfo, // H행: 상세정보
              // 한국어 필드
              description_kr: item.description_kr,
              authorInfo_kr: item.authorInfo_kr,
              moreInfo_kr: item.moreInfo_kr,
              rank: index + 1,
            },
          });
        }}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: colors.text }]}>{index + 1}</Text>
        </View>

        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.bookImage} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.secondaryBackground }]}>
            <Text style={[styles.placeholderText, { color: colors.secondaryText }]}>No Image</Text>
          </View>
        )}

        <View style={styles.bookInfo}>
          <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.author || 'Unknown Author'}
          </Text>
          {item.publisher && (
            <Text style={[styles.bookMeta, { color: colors.secondaryText }]} numberOfLines={1}>
              {item.publisher} {item.genre ? `• ${item.genre}` : ''}
            </Text>
          )}
          {item.description && (
            <Text style={[styles.bookDescription, { color: colors.secondaryText }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.bookmarkIcon}
          onPress={e => {
            e.stopPropagation();
            const bookData = {
              title: item.title,
              author: item.author,
              publisher: item.publisher,
              image: item.image,
              link: item.link,
              country: getCountry(),
              // 상세 정보 필드도 포함
              description: item.description,
              contents: item.contents,
              authorInfo: item.authorInfo,
              publisherReview: item.publisherReview,
              plot: item.plot,
              moreInfo: item.moreInfo, // H행: 상세정보
              // 한국어 필드
              description_kr: item.description_kr,
              authorInfo_kr: item.authorInfo_kr,
              moreInfo_kr: item.moreInfo_kr,
            };
            toggleBookmark(bookData);
          }}
        >
          <Icon
            name={isBookmarked(item.title) ? 'star' : 'star-outline'}
            size={24}
            color={isBookmarked(item.title) ? '#FFD700' : colors.secondaryText}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHomeContent = () => {
    if (loading) {
      return <LoadingScreen />;
    }

    if (error) {
      return (
        <View style={[styles.center, { backgroundColor: colors.primaryBackground }]}>
          <Text style={{ color: '#d32f2f', marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSheets}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const visibleBooks = books.slice(0, 20);

    if (!visibleBooks.length) {
      return (
        <View style={[styles.center, { backgroundColor: colors.primaryBackground }]}>
          <Text style={{ color: colors.secondaryText }}>표시할 데이터가 없습니다.</Text>
        </View>
      );
    }

    return (
      <View style={[styles.homeContainer, { backgroundColor: colors.primaryBackground }]}>
        {/* 상단 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.primaryBackground, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{getBestSellersText()}</Text>
          <View style={[styles.languageToggle, { backgroundColor: colors.secondaryBackground, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === (userLanguage + 1) && styles.languageOptionActive
              ]}
              onPress={() => {
                setLanguage(userLanguage + 1);
                if (loaded) {
                  interstitial.show();
                }
              }}
            >
              <Text style={[
                styles.languageText,
                { color: language === (userLanguage + 1) ? '#fff' : colors.secondaryText },
                language === (userLanguage + 1) && styles.languageTextActive
              ]}>
              {userLanguageLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 0 && styles.languageOptionActive
              ]}
              onPress={() => {
                setLanguage(0);
                if (loaded) {
                  interstitial.show();
                }
              }}
            >
              <Text style={[
                styles.languageText,
                { color: language === 0 ? '#fff' : colors.secondaryText },
                language === 0 && styles.languageTextActive
              ]}>
              {originalLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 국가 선택 탭 */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
          >
            {orderedCountryTabs.map(tab => (
              <TouchableOpacity
                key={tab.label}
                style={[styles.countryTab, activeCountryTab === tab.label && [styles.activeCountryTab, { borderBottomColor: colors.link }]]}
                onPress={() => setCountryByLabel(tab.label)}
              >
                <Text
                  style={[
                    styles.countryTabText,
                    { color: activeCountryTab === tab.label ? colors.link : colors.secondaryText },
                    activeCountryTab === tab.label && styles.activeCountryTabText
                  ]}
                >
                  {getCountryName(tab.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 책 목록 */}
        <FlatList
          data={visibleBooks}
          renderItem={renderBookItem}
          keyExtractor={(item, index) => `${activeCountryTab}-${index}`}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'bookmark':
        return <BookmarkScreen navigation={navigation} />;
      case 'settings':
        return <SettingsPage navigation={navigation} />;
      default:
        return renderHomeContent();
    }
  };

  // 동적 스타일 생성
  const dynamicStyles = useMemo(() => ({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    contentContainer: {
      flex: 1,
      paddingBottom: 150, // 배너 광고 + 하단 네비게이션 공간 확보
    },
    fixedBannerAd: {
      position: 'absolute',
      bottom: 70, // 하단 네비게이션 위에 위치
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      zIndex: 999,
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 15,
      paddingBottom: 25,
      backgroundColor: colors.primaryBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      zIndex: 1000,
    },
    navLabel: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    activeNavLabel: {
      color: colors.link,
      fontWeight: 'bold',
    },
  }), [colors]);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.contentContainer}>
        {renderContent()}
      </View>
      
      {/* 고정 배너 광고 - 하단 네비게이션 위 */}
      <View style={[dynamicStyles.fixedBannerAd, { backgroundColor: colors.primaryBackground, borderTopColor: colors.border }]}>
        <MyAds type="adaptive" size={BannerAdSize.BANNER} />
      </View>
      
      {/* 하단 네비게이션 */}
      <View style={dynamicStyles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Icon 
            name="home-outline" 
            size={24} 
            color={activeTab === 'home' ? colors.link : colors.secondaryText} 
          />
          <Text style={[dynamicStyles.navLabel, activeTab === 'home' && dynamicStyles.activeNavLabel]}>
            {translationsData?.navigation?.home?.[userLanguage] || translationsData?.navigation?.home?.[1] || 'Home'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('bookmark')}
        >
          <Icon 
            name="bookmark-outline" 
            size={24} 
            color={activeTab === 'bookmark' ? colors.link : colors.secondaryText} 
          />
          <Text style={[dynamicStyles.navLabel, activeTab === 'bookmark' && dynamicStyles.activeNavLabel]}>
            {translationsData?.navigation?.bookmarks?.[userLanguage] || translationsData?.navigation?.bookmarks?.[1] || 'Bookmarks'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
        >
          <Icon 
            name="cog-outline" 
            size={24} 
            color={activeTab === 'settings' ? colors.link : colors.secondaryText} 
          />
          <Text style={[dynamicStyles.navLabel, activeTab === 'settings' && dynamicStyles.activeNavLabel]}>
            {translationsData?.navigation?.settings?.[userLanguage] || translationsData?.navigation?.settings?.[1] || 'Settings'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80, // 하단 네비게이션 공간 확보
  },
  homeContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  languageToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  languageOptionActive: {
    backgroundColor: '#4285F4',
  },
  languageText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  languageTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  countryTab: {
    marginRight: 30,
    paddingBottom: 10,
  },
  activeCountryTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  countryTabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeCountryTabText: {
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 170, // 배너 광고 + 네비게이션 바 높이만큼 여백 추가
  },
  bookItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  rankContainer: {
    width: 30,
    justifyContent: 'flex-start',
    paddingTop: 5,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
    marginRight: 15,
  },
  imagePlaceholder: {
    width: 80,
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  placeholderText: {
    fontSize: 12,
  },
  bookInfo: {
    flex: 1,
    paddingRight: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    lineHeight: 22,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 4,
  },
  bookMeta: {
    fontSize: 12,
    marginBottom: 8,
  },
  bookDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  bookmarkIcon: {
    paddingTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
  },
});
