import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookmarkScreen from './Bookmark';
import SettingsPage from './SettingsPage';
import LoadingScreen from './LoadingScreen';
import { useBookmark } from './BookmarkContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { BannerAdSize, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import MyAds from './BannerAd';
import translationsData from './assets/translations.json';

const rewardedAdUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3940256099942544/5224354917';

const rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

// 12시간 무료 기간 상수
const FREE_PERIOD_MS = 12 * 60 * 60 * 1000; // 12시간
const REWARD_AD_WATCHED_KEY = 'rewardAdWatchedTimestamp';

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
  console.log('[MainScreen] ===== MainScreen component rendering =====');
  
  const [activeTab, setActiveTab] = useState('home');
  const [rewardedLoaded, setRewardedLoaded] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [pendingLanguageChange, setPendingLanguageChange] = useState(null);
  const [rewardEarned, setRewardEarned] = useState(false);
  // 메모리 백업 (AsyncStorage가 가득 찬 경우를 대비)
  const watchedTimestampRef = React.useRef(null);

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

  // 앱 시작 시 오래된 캐시 정리 (AsyncStorage 공간 확보)
  useEffect(() => {
    const cleanupOldCache = async () => {
      try {
        console.log('[MainScreen] Starting aggressive cache cleanup...');
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('[MainScreen] Total AsyncStorage keys:', allKeys.length);
        
        // sheet_data_로 시작하는 키들만 필터링
        const cacheKeys = allKeys.filter(key => key.startsWith('sheet_data_'));
        console.log('[MainScreen] Found cache keys:', cacheKeys.length);
        
        let cleanedCount = 0;
        const now = Date.now();
        const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간
        
        // 가장 오래된 캐시부터 삭제 (공간이 부족하면 최근 것도 삭제)
        const cacheEntries = [];
        
        for (const key of cacheKeys) {
          try {
            const cachedData = await AsyncStorage.getItem(key);
            if (cachedData) {
              try {
                const { timestamp } = JSON.parse(cachedData);
                cacheEntries.push({ key, timestamp });
              } catch (parseErr) {
                // 파싱 에러면 바로 삭제 대상에 추가
                cacheEntries.push({ key, timestamp: 0 });
              }
            }
          } catch (err) {
            // 읽기 에러면 삭제 대상에 추가
            cacheEntries.push({ key, timestamp: 0 });
          }
        }
        
        // 타임스탬프 기준으로 정렬 (오래된 것부터)
        cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
        
        // 24시간 이상 된 캐시는 모두 삭제
        // 그리고 공간이 부족할 수 있으니 가장 오래된 것부터 최대 3개까지 더 삭제
        for (let i = 0; i < cacheEntries.length; i++) {
          const { key, timestamp } = cacheEntries[i];
          const shouldDelete = timestamp === 0 || 
                               (now - timestamp > CACHE_TTL) || 
                               (i < 3 && now - timestamp > CACHE_TTL / 2); // 가장 오래된 3개는 12시간 이상이면 삭제
          
          if (shouldDelete) {
            try {
              await AsyncStorage.removeItem(key);
              cleanedCount++;
              console.log('[MainScreen] Removed cache:', key, 'age:', timestamp ? Math.round((now - timestamp) / (60 * 60 * 1000)) + 'h' : 'invalid');
            } catch (removeErr) {
              console.warn('[MainScreen] Failed to remove cache key:', key, removeErr.message);
            }
          }
        }
        
        console.log('[MainScreen] Cache cleanup completed, removed:', cleanedCount, 'items');
      } catch (error) {
        console.error('[MainScreen] Cache cleanup error:', error);
      }
    };
    
    cleanupOldCache();
  }, []);

  // 리워드 광고 로드
  useEffect(() => {
    console.log('[MainScreen] ===== useEffect: Component mounted, initializing rewarded ad =====');
    console.log('[MainScreen] Rewarded ad unit ID:', rewardedAdUnitId);
    console.log('[MainScreen] Is DEV mode:', __DEV__);
    
    // 광고 로드 시작
    rewarded.load();
    console.log('[MainScreen] Called rewarded.load()');
    
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('[MainScreen] ===== Rewarded ad loaded successfully =====');
      setRewardedLoaded(true);
    });

    const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async (reward) => {
      console.log('[MainScreen] User earned reward:', reward);
      setRewardEarned(true);
      
      // 광고 시청 시간 저장
      const watchedTimestamp = Date.now();
      console.log('[MainScreen] Saving watched timestamp:', watchedTimestamp, new Date(watchedTimestamp).toLocaleString());
      
      // 메모리에 먼저 저장 (AsyncStorage 실패 시 대비)
      watchedTimestampRef.current = watchedTimestamp;
      
      // AsyncStorage에 저장 시도
      try {
        await AsyncStorage.setItem(REWARD_AD_WATCHED_KEY, watchedTimestamp.toString());
        console.log('[MainScreen] Successfully saved timestamp to AsyncStorage');
        
        // 저장 확인
        const saved = await AsyncStorage.getItem(REWARD_AD_WATCHED_KEY);
        console.log('[MainScreen] Verified saved timestamp:', saved);
      } catch (storageError) {
        console.error('[MainScreen] Failed to save timestamp to AsyncStorage:', storageError);
        console.log('[MainScreen] Using memory backup instead');
        // AsyncStorage 저장 실패해도 메모리에 저장되어 있으므로 계속 진행
      }
      
      // 언어 변경 적용
      if (pendingLanguageChange !== null) {
        setLanguage(pendingLanguageChange);
        setPendingLanguageChange(null);
      }
    });

    const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      console.log('[MainScreen] ===== Rewarded ad closed =====');
      setRewardedLoaded(false);
      console.log('[MainScreen] Reloading rewarded ad after close...');
      rewarded.load();
      setShowAdModal(false);
      
      // 리워드를 받지 않고 닫은 경우에만 언어 변경 취소
      if (!rewardEarned && pendingLanguageChange !== null) {
        console.log('[MainScreen] Ad closed without reward, canceling language change');
        setPendingLanguageChange(null);
      }
      
      // 리워드 상태 리셋
      setRewardEarned(false);
    });

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
    };
  }, []);

  // 12시간 무료 기간 체크
  const checkFreePeriod = useCallback(async () => {
    try {
      let watchedTime = null;
      
      // 먼저 AsyncStorage에서 확인
      try {
        const timestamp = await AsyncStorage.getItem(REWARD_AD_WATCHED_KEY);
        console.log('[MainScreen] checkFreePeriod - timestamp from storage:', timestamp);
        
        if (timestamp) {
          watchedTime = parseInt(timestamp, 10);
          if (!isNaN(watchedTime)) {
            console.log('[MainScreen] checkFreePeriod - Using timestamp from AsyncStorage');
          } else {
            watchedTime = null;
          }
        }
      } catch (storageError) {
        console.warn('[MainScreen] checkFreePeriod - AsyncStorage read error:', storageError);
      }
      
      // AsyncStorage에서 못 찾았으면 메모리 백업 확인
      if (!watchedTime && watchedTimestampRef.current) {
        watchedTime = watchedTimestampRef.current;
        console.log('[MainScreen] checkFreePeriod - Using timestamp from memory backup');
      }
      
      if (!watchedTime) {
        console.log('[MainScreen] checkFreePeriod - No timestamp found, returning false');
        return false; // 광고를 본 적이 없음
      }
      
      const now = Date.now();
      const timeSinceWatched = now - watchedTime;
      const hoursRemaining = (FREE_PERIOD_MS - timeSinceWatched) / (60 * 60 * 1000);
      
      console.log('[MainScreen] checkFreePeriod - watchedTime:', new Date(watchedTime).toLocaleString());
      console.log('[MainScreen] checkFreePeriod - now:', new Date(now).toLocaleString());
      console.log('[MainScreen] checkFreePeriod - timeSinceWatched (ms):', timeSinceWatched);
      console.log('[MainScreen] checkFreePeriod - hoursRemaining:', hoursRemaining.toFixed(2));
      console.log('[MainScreen] checkFreePeriod - FREE_PERIOD_MS:', FREE_PERIOD_MS);
      
      const isFree = timeSinceWatched < FREE_PERIOD_MS;
      console.log('[MainScreen] checkFreePeriod - isFree:', isFree);
      
      return isFree; // 12시간 이내면 무료
    } catch (error) {
      console.error('[MainScreen] Error checking free period:', error);
      return false;
    }
  }, []);

  // 언어 변경 핸들러
  const handleLanguageChange = useCallback(async (newLanguage) => {
    // 현재 선택된 언어와 동일하면 변경하지 않음
    if (language === newLanguage) {
      return;
    }
    
    console.log('[MainScreen] Language change requested:', newLanguage);
    
    const isFree = await checkFreePeriod();
    console.log('[MainScreen] Free period check result:', isFree);
    
    if (isFree) {
      // 무료 기간이면 바로 언어 변경 (팝업 없이)
      console.log('[MainScreen] Free period active, changing language directly');
      setLanguage(newLanguage);
    } else {
      // 무료 기간이 아니면 항상 팝업 먼저 표시 (광고를 보겠는지 물어봄)
      // 팝업에서 "Watch Ad"를 누르면 그때 광고가 표시됨
      console.log('[MainScreen] Free period expired, showing ad modal');
      setPendingLanguageChange(newLanguage);
      setShowAdModal(true);
    }
  }, [language, checkFreePeriod]);

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
                if (language !== (userLanguage + 1)) {
                  handleLanguageChange(userLanguage + 1);
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
                if (language !== 0) {
                  handleLanguageChange(0);
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

  // 광고 팝업 모달
  const renderAdModal = () => {
    // 번역 데이터 가져오기
    const modalTitle = translationsData?.adModal?.title?.[userLanguage] || 
                       translationsData?.adModal?.title?.[1] || 
                       'Unlimited Translations\n+ No Video Ads!';
    const modalDescription = translationsData?.adModal?.description?.[userLanguage] || 
                             translationsData?.adModal?.description?.[1] || 
                             'Watch one ad to unlock unlimited translations for 12 hours.';
    const watchAdText = translationsData?.adModal?.watchAd?.[userLanguage] || 
                        translationsData?.adModal?.watchAd?.[1] || 
                        'Watch Ad';
    const cancelText = translationsData?.adModal?.cancel?.[userLanguage] || 
                       translationsData?.adModal?.cancel?.[1] || 
                       'Cancel';

    return (
      <Modal
        visible={showAdModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAdModal(false);
          setPendingLanguageChange(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FFF8E1' }]}>
            <Text style={styles.modalTitle}>
              {modalTitle}
            </Text>
            <Text style={styles.modalDescription}>
              {modalDescription}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAdModal(false);
                  setPendingLanguageChange(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>{cancelText}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonWatch]}
                onPress={async () => {
                  console.log('[MainScreen] Watch Ad button pressed, rewardedLoaded:', rewardedLoaded);
                  if (rewardedLoaded) {
                    console.log('[MainScreen] Closing modal and showing rewarded ad');
                    // 팝업을 먼저 닫고, 약간의 지연 후 광고 표시 (팝업 애니메이션이 완료되도록)
                    setShowAdModal(false);
                    // 팝업이 완전히 닫힌 후 광고 표시
                    setTimeout(() => {
                      console.log('[MainScreen] Showing rewarded ad after modal close');
                      rewarded.show();
                    }, 300); // 300ms 지연으로 팝업 닫힘 애니메이션 완료 대기
                  } else {
                    // 광고가 로드되지 않았으면 로드 대기
                    console.log('[MainScreen] Rewarded ad not loaded yet, waiting...');
                    // 광고 로드 대기 후 표시
                    const checkLoaded = setInterval(() => {
                      if (rewardedLoaded) {
                        clearInterval(checkLoaded);
                        console.log('[MainScreen] Rewarded ad loaded, showing ad');
                        setShowAdModal(false);
                        setTimeout(() => {
                          rewarded.show();
                        }, 300);
                      }
                    }, 500);
                    
                    // 5초 후 타임아웃
                    setTimeout(() => {
                      clearInterval(checkLoaded);
                      console.log('[MainScreen] Timeout waiting for rewarded ad');
                    }, 5000);
                  }
                }}
                disabled={!rewardedLoaded}
              >
                <Text style={styles.modalButtonWatchText}>[{watchAdText}]</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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
      
      {/* 광고 팝업 모달 */}
      {renderAdModal()}
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
  // 광고 팝업 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#5D4037',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonCancelText: {
    color: '#424242',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonWatch: {
    backgroundColor: '#5D4037',
  },
  modalButtonWatchText: {
    color: '#FFF8E1',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
