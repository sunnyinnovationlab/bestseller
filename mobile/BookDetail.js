// BookDetail.js - 통합 상세 화면 (모든 국가 지원)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
// WebView는 react-native-webview 패키지 설치 필요
// 설치 후 아래 주석을 해제하세요: npm install react-native-webview
// import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBookmark } from './BookmarkContext';
import { CloseIcon, StarIcon, ShareIcon, ExternalLinkIcon } from './components/IconButton';
import apiConfig from './config/api';

// 번역 데이터 (Google Sheets 기반)
// 참조: https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/edit?gid=0#gid=0
// Row 29: View on Store
// Row 30: Author
// Row 31: About Book
// Row 32: More Info
const translations = {
  korean: {
    viewOnStore: '스토어 방문', // Row 29, Column A
    author: '저자', // Row 30, Column A
    aboutBook: '도서 정보', // Row 31, Column A
    moreInfo: '상세 정보', // Row 32, Column A
  },
  english: {
    viewOnStore: 'View on Store', // Row 29, Column B
    author: 'Author', // Row 30, Column B
    aboutBook: 'About Book', // Row 31, Column B
    moreInfo: 'More Info', // Row 32, Column B
  },
  japanese: {
    viewOnStore: 'ストアで見る', // Row 29, Column C
    author: '著者', // Row 30, Column C
    aboutBook: '書籍情報', // Row 31, Column C
    moreInfo: '詳細情報', // Row 32, Column C
  },
  chinese: {
    viewOnStore: '前往商店', // Row 29, Column D
    author: '作者', // Row 30, Column D
    aboutBook: '图书信息', // Row 31, Column D
    moreInfo: '细节', // Row 32, Column D
  },
  traditionalChinese: {
    viewOnStore: '查看店鋪', // Row 29, Column E
    author: '作者', // Row 30, Column E
    aboutBook: '關於本書', // Row 31, Column E
    moreInfo: '更多資訊', // Row 32, Column E
  },
  french: {
    viewOnStore: 'Voir en magasin', // Row 29, Column F
    author: 'auteur', // Row 30, Column F
    aboutBook: 'Informations sur le livre', // Row 31, Column F
    moreInfo: 'Plus d\'informations', // Row 32, Column F
  },
};

// 국가별 설정
const COUNTRY_CONFIG = {
  KR: {
    apiEndpoint: 'kr-book-detail',
    storeName: 'Store',
    defaultAuthorText: 'is a renowned author known for their insightful works.',
  },
  US: {
    apiEndpoint: 'us-book-detail',
    storeName: 'Store',
    defaultAuthorText: 'is a renowned writer known for their insightful works.',
  },
  JP: {
    apiEndpoint: 'jp-book-detail',
    storeName: 'Store',
    defaultAuthorText: 'は、洞察力のある作品で知られる著名な作家です。',
  },
  TW: {
    apiEndpoint: 'tw-book-detail',
    storeName: 'Store',
    defaultAuthorText: 'is a renowned writer known for their insightful works.',
  },
  FR: {
    apiEndpoint: 'fr-book-detail',
    storeName: 'Store',
    defaultAuthorText: 'est un écrivain renommé connu pour ses œuvres perspicaces.',
  },
  UK: {
    apiEndpoint: 'uk-book-detail',
    storeName: 'Waterstones',
    defaultAuthorText: 'is a renowned writer known for their insightful works.',
  },
};

export default function BookDetail({ route, navigation }) {
  const { book } = route.params;
  const country = book.country || 'US';
  const config = COUNTRY_CONFIG[country] || COUNTRY_CONFIG.US;
  
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('author'); // 기본값을 'author'로 변경
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [appLanguage, setAppLanguage] = useState('English');
  const [wikiModalVisible, setWikiModalVisible] = useState(false);
  const [wikiUrl, setWikiUrl] = useState('');
  const [wikiType, setWikiType] = useState(''); // 'title' or 'author'
  const { isBookmarked, toggleBookmark } = useBookmark();

  // 앱 언어 설정 불러오기
  useEffect(() => {
    const loadAppLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage) {
          setAppLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('언어 설정 불러오기 실패:', error);
      }
    };
    loadAppLanguage();
  }, []);

  // 위키 URL 생성 함수
  const getWikiUrl = (query, type) => {
    const languageMap = {
      'Korean': 'ko',
      'English': 'en',
      'Japanese': 'ja',
      'Chinese': 'zh',
      'Traditional Chinese': 'zh-tw',
      'French': 'fr',
    };
    const lang = languageMap[appLanguage] || 'en';
    const encodedQuery = encodeURIComponent(query);
    return `https://${lang}.wikipedia.org/wiki/${encodedQuery}`;
  };

  // 위키 팝업 열기
  const openWiki = async (query, type) => {
    const url = getWikiUrl(query, type);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        // WebView가 설치되어 있으면 팝업으로, 없으면 외부 브라우저로 열기
        // WebView 사용 시 아래 주석 해제하고 Linking.openURL 주석 처리
        setWikiUrl(url);
        setWikiType(type);
        setWikiModalVisible(true);
        // await Linking.openURL(url); // WebView 사용 시 주석 처리
      }
    } catch (error) {
      console.error('Error opening wiki URL:', error);
      // 에러 발생 시 외부 브라우저로 열기
      try {
        await Linking.openURL(url);
      } catch (e) {
        console.error('Error opening URL in browser:', e);
      }
    }
  };

  // 책 상세 정보 가져오기
  useEffect(() => {
    // 먼저 book 객체에 이미 상세 정보가 있는지 확인 (캐시 데이터)
    if (book.authorInfo || book.publisherReview || book.description || book.contents || book.plot) {
      setDetails({
        authorInfo: book.authorInfo || '',
        publisherReview: book.publisherReview || '',
        description: book.description || '',
        contents: book.contents || '',
        plot: book.plot || '',
        tableOfContents: book.tableOfContents || '',
      });
      setLoading(false);
      
      // link가 있으면 추가로 API 호출하여 더 자세한 정보 가져오기 (선택적)
      if (book.link) {
        const countryKey = country.toLowerCase();
        const detailUrl = apiConfig.endpoints[`${countryKey}BookDetail`] || 
          `${apiConfig.baseURL}/${config.apiEndpoint}`;
        fetch(
          `${detailUrl}?url=${encodeURIComponent(
            book.link,
          )}`,
        )
          .then(res => {
            if (res.ok) {
              return res.json();
            }
            return null;
          })
          .then(data => {
            if (data) {
              // API에서 받은 데이터로 기존 details 업데이트 (빈 필드만 채움)
              setDetails(prev => ({
                ...prev,
                authorInfo: data.authorInfo || prev.authorInfo || '',
                publisherReview: data.publisherReview || prev.publisherReview || '',
                description: data.description || prev.description || '',
                contents: data.contents || prev.contents || '',
                plot: data.plot || prev.plot || '',
                tableOfContents: data.tableOfContents || prev.tableOfContents || '',
              }));
            }
          })
          .catch(err => {
            console.error('❌ Detail Fetch Error (optional):', err);
            // 에러가 나도 캐시 데이터는 이미 표시되므로 무시
          });
      }
    } else if (book.link) {
      // 캐시 데이터가 없고 link만 있는 경우 API 호출
      console.log('📘 요청 URL:', book.link);

      const countryKey = country.toLowerCase();
      const detailUrl = apiConfig.endpoints[`${countryKey}BookDetail`] || 
        `${apiConfig.baseURL}/${config.apiEndpoint}`;
      fetch(
        `${detailUrl}?url=${encodeURIComponent(
          book.link,
        )}`,
      )
        .then(res => {
          console.log('📘 응답 상태:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('📘 받은 데이터:', data);
          setDetails(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('❌ Detail Fetch Error:', err);
          setLoading(false);
        });
    } else {
      // 데이터가 전혀 없는 경우
      setLoading(false);
    }
  }, [book.link, book.description, book.contents, book.authorInfo, book.publisherReview, book.plot, config.apiEndpoint]);

  // 번역 가져오기
  const getTranslation = (key) => {
    const languageMap = {
      'Korean': 'korean',
      'English': 'english',
      'Japanese': 'japanese',
      'Chinese': 'chinese',
      'Traditional Chinese': 'traditionalChinese',
      'French': 'french',
    };
    const langKey = languageMap[appLanguage] || 'english';
    return translations[langKey]?.[key] || translations.english[key];
  };

  // 탭 제목 가져오기
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'author':
        return getTranslation('author');
      case 'aboutBook':
        return getTranslation('aboutBook');
      case 'moreInfo':
        return getTranslation('moreInfo');
      default:
        return '';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'author':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>{getTabTitle('author')}</Text>
            <Text style={styles.tabContentText}>
              {details?.authorInfo || 
                `${book.author || 'The author'} ${config.defaultAuthorText}`}
            </Text>
          </View>
        );
      case 'aboutBook':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>{getTabTitle('aboutBook')}</Text>
            {details?.tableOfContents ? (
              <Text style={styles.tabContentText}>{details.tableOfContents}</Text>
            ) : details?.plot ? (
              <View>
                <Text style={styles.tabContentText}>{details.plot}</Text>
              </View>
            ) : details?.description || details?.contents ? (
              <View>
                <Text style={styles.tabContentText}>
                  {details.description || details.contents}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.tabContentText}>
                  Table of contents information is not available for this book.
                </Text>
                {(details?.publisher || book.publisher) && (
                  <View style={styles.infoSection}>
                    <Text style={styles.tabContentSubtitle}>Publication Information</Text>
                    <Text style={styles.tabContentText}>
                      Publisher: {details.publisher || book.publisher}
                    </Text>
                    {details?.publishDate && (
                      <Text style={styles.tabContentText}>Published: {details.publishDate}</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      case 'moreInfo':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>{getTabTitle('moreInfo')}</Text>
            <Text style={styles.tabContentText}>
              {details?.publisherReview || details?.review || details?.contents || details?.description || 
                'Publisher review information is not available.'}
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <CloseIcon size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => toggleBookmark({ ...book, country })}
          >
            <StarIcon 
              size={24} 
              color="#000" 
              filled={isBookmarked(book.title)} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <ShareIcon size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* 책 커버 및 정보 */}
        <View style={styles.bookHeaderContainer}>
          <View style={[
            styles.bookHeader,
            descriptionExpanded && styles.bookHeaderExpanded
          ]}>
            <View style={styles.bookImageContainer}>
              {book.image ? (
                <Image source={{ uri: book.image }} style={styles.bookImage} />
              ) : (
                <View style={[styles.bookImage, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}
              {/* View on Store 버튼 - 책 표지 바로 아래 */}
              {book.link && (
                <TouchableOpacity
                  style={styles.viewStoreButton}
                  onPress={async () => {
                    try {
                      const canOpen = await Linking.canOpenURL(book.link);
                      if (canOpen) {
                        await Linking.openURL(book.link);
                      } else {
                        console.error('Cannot open URL:', book.link);
                      }
                    } catch (error) {
                      console.error('Error opening URL:', error);
                    }
                  }}
                >
                  <Text style={styles.viewStoreText} numberOfLines={1}>
                    {getTranslation('viewOnStore')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[
              styles.bookInfo,
              descriptionExpanded && styles.bookInfoExpanded
            ]}>
              <TouchableOpacity onPress={() => book.title && openWiki(book.title, 'title')}>
                <Text style={styles.title}>{book.title}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => book.author && openWiki(book.author, 'author')}>
                <Text style={styles.author}>{book.author || 'Unknown Author'}</Text>
              </TouchableOpacity>
              {!descriptionExpanded && (
                <View style={styles.descriptionContainer}>
                  <Text 
                    style={styles.description}
                    numberOfLines={3}
                  >
                    {details?.contents || details?.description || 
                      'A compelling story that captivates readers with its depth and insight.'}
                  </Text>
                  {((details?.contents || details?.description) && 
                    ((details.contents?.length > 150) || (details.description?.length > 150))) && (
                    <TouchableOpacity
                      onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                      style={styles.moreButton}
                    >
                      <Text style={styles.moreButtonText}>
                        See More
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
          {/* 확장된 설명 - View on Store 버튼 아래까지 확장 */}
          {descriptionExpanded && (
            <View style={styles.descriptionExpandedContainer}>
              <Text 
                style={[
                  styles.description,
                  styles.descriptionExpanded
                ]}
              >
                {details?.contents || details?.description || 
                  'A compelling story that captivates readers with its depth and insight.'}
              </Text>
              {((details?.contents || details?.description) && 
                ((details.contents?.length > 150) || (details.description?.length > 150))) && (
                <TouchableOpacity
                  onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                  style={styles.moreButton}
                >
                  <Text style={styles.moreButtonText}>
                    Show Less
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* 탭 네비게이션 - Author / About Book / More Info 순서 */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'author' && styles.activeTab]}
            onPress={() => setActiveTab('author')}
          >
            <Text style={[styles.tabText, activeTab === 'author' && styles.activeTabText]}>
              {getTabTitle('author')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'aboutBook' && styles.activeTab]}
            onPress={() => setActiveTab('aboutBook')}
          >
            <Text style={[styles.tabText, activeTab === 'aboutBook' && styles.activeTabText]}>
              {getTabTitle('aboutBook')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'moreInfo' && styles.activeTab]}
            onPress={() => setActiveTab('moreInfo')}
          >
            <Text style={[styles.tabText, activeTab === 'moreInfo' && styles.activeTabText]}>
              {getTabTitle('moreInfo')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 탭 컨텐츠 */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </ScrollView>

      {/* 위키 팝업 모달 - WebView 설치 후 주석 해제 필요 */}
      {wikiModalVisible && (
        <Modal
          visible={wikiModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setWikiModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {wikiType === 'title' ? book.title : book.author}
              </Text>
              <TouchableOpacity
                onPress={() => setWikiModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <CloseIcon size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {/* WebView 설치 후 주석 해제 */}
            {/* 
            <WebView
              source={{ uri: wikiUrl }}
              style={styles.webView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#4285F4" />
                </View>
              )}
            />
            */}
            {/* WebView가 없을 경우 임시로 외부 브라우저로 열기 */}
            <View style={styles.webView}>
              <Text style={styles.webViewPlaceholder}>
                WebView를 사용하려면 react-native-webview를 설치하세요.
              </Text>
              <TouchableOpacity
                style={styles.openBrowserButton}
                onPress={async () => {
                  try {
                    await Linking.openURL(wikiUrl);
                    setWikiModalVisible(false);
                  } catch (error) {
                    console.error('Error opening URL:', error);
                  }
                }}
              >
                <Text style={styles.openBrowserButtonText}>브라우저에서 열기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  bookHeaderContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bookHeader: {
    flexDirection: 'row',
  },
  bookHeaderExpanded: {
    marginBottom: 0,
  },
  bookImageContainer: {
    marginRight: 15,
  },
  bookImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookInfoExpanded: {
    paddingBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    lineHeight: 28,
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  descriptionContainer: {
    marginTop: 4,
  },
  descriptionContainerExpanded: {
    marginTop: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  descriptionExpandedContainer: {
    marginTop: 16,
    width: '100%',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  descriptionExpanded: {
    lineHeight: 22,
    letterSpacing: 0.2,
    width: '100%',
  },
  moreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  moreButtonText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
  },
  viewStoreButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
  },
  viewStoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
  },
  tab: {
    paddingBottom: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  tabContentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  tabContentSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  infoSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#666',
    marginTop: 10,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  webViewPlaceholder: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  openBrowserButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openBrowserButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

