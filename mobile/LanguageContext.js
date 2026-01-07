import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiConfig from './config/api';

const LanguageContext = createContext();

const TRANSLATION_URL =
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=0&range=A1:F31';

// 백엔드 API 엔드포인트 (Google Sheets 대신 사용)
const DATA_API_ENDPOINTS = [
  apiConfig.endpoints.krBooks, // Korea
  apiConfig.endpoints.usBooks, // US
  apiConfig.endpoints.jpBooks, // JAPAN
  apiConfig.endpoints.ukBooks, // UK
  apiConfig.endpoints.chBooks, // CHINA
  apiConfig.endpoints.twBooks, // TAIWAN
  apiConfig.endpoints.frBooks, // FRANCE
  apiConfig.endpoints.esBooks, // SPAIN
];

// Google Sheets URL (폴백용)
const DATA_SHEETS = [
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=161667220&range=A1:AQ32', // Korea
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=638692902&range=A1:AQ32', // US
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=1994696482&range=A1:AQ32', // JAPAN
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=1872205236&range=A1:AQ32', // UK
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=225038494&range=A1:AQ32', // CHINA
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=287677657&range=A1:AQ32', // TAIWAN
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=460284331&range=A1:AQ32', // FRANCE
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=806262731&range=A1:AQ32', // SPAIN
];

const parseTSV = text =>
  text
    .trim()
    .split('\n')
    .map(line => line.split('\t').map(cell => cell.trim()));

const filterColumns = (rows, startIndex) =>
  rows.map(row => {
    const image = row[1] ?? ''; // B행: 이미지 URL
    const link = row[2] ?? ''; // C행: View on Store URL
    const slice = row.slice(startIndex, startIndex + 5);
    while (slice.length < 5) {
      slice.push('');
    }
    return [image, link, ...slice]; // [이미지, 링크, 제목, 작가, 작가정보, 책에 대해, 더 많은 정보]
  });

// 백엔드 API에서 데이터 가져오기 (JSON 형식)
// 백엔드 API는 Google Sheets에서 데이터를 읽어서 제공합니다
const fetchFromAPI = async (endpoint, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`[LanguageContext] Fetching from API: ${endpoint}`);
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    
    const json = await response.json();
    
    // 백엔드 API 응답 형식: { books: [{image, link, title, author, ...}, ...] }
    // 백엔드 API는 Google Sheets에서 데이터를 읽어서 제공합니다 (server/services/cache.js 참고)
    // 이를 TSV 파싱 결과와 동일한 형식으로 변환
    // TSV 형식은 헤더 행이 필요하므로 헤더를 추가합니다
    // LanguageContext는 다음 구조를 기대합니다:
    // [0]: 언어 그룹 행 (Original, Korean, etc.)
    // [1]: 헤더 행 (Ranking, Image URL, Title, etc.)
    // [2+]: 데이터 행들
    if (json.books && Array.isArray(json.books)) {
      // 헤더 행 생성 (TSV의 헤더와 동일한 형식)
      // 실제로는 LanguageContext에서 사용하는 헤더 형식에 맞춰야 함
      const headerRow = [
        '', // A: Ranking (사용 안 함)
        'Image URL', // B: 이미지
        'View on Store URL', // C: 링크
        'Title', // D: 제목
        'Author', // E: 작가
        'Author Info', // F: 작가 정보
        'Description', // G: 책에 대해
        'More Info', // H: 더 많은 정보
      ];
      
      // 데이터 행들을 TSV 형식으로 변환
      // 백엔드 API는 B3:M102 범위를 읽으므로, B가 첫 번째 컬럼
      // 하지만 LanguageContext는 row[1]이 이미지, row[2]가 링크로 기대하므로
      // [이미지, 링크, 제목, 작가, 작가정보, 책에 대해, 더 많은 정보] 형식으로 변환
      const dataRows = json.books.map(book => [
        '', // A: Ranking (사용 안 함)
        book.image || '', // B: 이미지
        book.link || '', // C: 링크
        book.title || '', // D: 제목
        book.author || '', // E: 작가
        book.authorInfo || '', // F: 작가 정보
        book.description || '', // G: 책에 대해
        book.moreInfo || '', // H: 더 많은 정보
      ]);
      
      // 언어 그룹 행 (임시로 빈 배열, 실제로는 LanguageContext에서 처리)
      const languageGroupRow = [];
      
      return [languageGroupRow, headerRow, ...dataRows];
    }
    
    // 만약 다른 형식이면 빈 배열 반환
    console.warn('[LanguageContext] Unexpected API response format:', json);
    return [];
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    console.error('[LanguageContext] API fetch failed:', error);
    throw error;
  }
};

// Google Sheets에서 데이터 가져오기 (폴백용)
const fetchSheet = async (url, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    console.log(`[LanguageContext] Fetching from Sheets: ${url}`);
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    return parseTSV(text);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    console.error('[LanguageContext] Sheets fetch failed:', error);
    throw error;
  }
};

export const LanguageProvider = ({ children }) => {
  const [userLanguage, setUserLanguage] = useState(0);
  const [language, setLanguage] = useState(0);
  const [country, setCountry] = useState(0);
  const [translations, setTranslations] = useState([]);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [languageLabels, setLanguageLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dataCache = React.useRef({});
  const preloadStarted = React.useRef(false);
  
  // 로컬 캐시 TTL: 24시간 (데이터가 일주일마다 업데이트되므로 24시간 캐싱이 적절)
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

  const sheetUrl = useMemo(
    () => DATA_SHEETS[country] ?? DATA_SHEETS[0],
    [country],
  );
  
  const apiEndpoint = useMemo(
    () => DATA_API_ENDPOINTS[country] ?? DATA_API_ENDPOINTS[0],
    [country],
  );

  // 1. Fetch Translations (Once)
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        // 로컬 캐시 확인
        const cacheKey = 'translations_data';
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData) {
          const { data: cachedRows, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // 캐시가 유효한 경우 (1시간 이내)
          if (now - timestamp < 60 * 60 * 1000) {
            console.log('[LanguageContext] Using cached translations');
            setTranslations(cachedRows);
            const labelsRow = cachedRows[22] ?? [];
            setLanguageLabels(labelsRow);
            return;
          }
        }
        
        // 네트워크에서 가져오기
        const rows = await fetchSheet(TRANSLATION_URL);
        setTranslations(rows);

        const labelsRow = rows[22] ?? [];
        setLanguageLabels(labelsRow);
        
        // 로컬 스토리지에 저장
        try {
          const cacheData = {
            data: rows,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (storageError) {
          console.warn('[LanguageContext] Translation cache write error:', storageError);
        }
      } catch (err) {
        console.error('[Language] Failed to load translations:', err.message);
      }
    };
    loadTranslations();
  }, []);

  // 2. Fetch Data (When country/sheetUrl changes)
  const fetchSheets = useCallback(async (forceUrl = null, forceApiEndpoint = null) => {
    const targetUrl = forceUrl || sheetUrl;
    const targetApiEndpoint = forceApiEndpoint || apiEndpoint;
    const cacheKey = `sheet_data_${targetUrl}`;
    
    // 1. 메모리 캐시 확인 (가장 빠름) - 즉시 반환
    if (dataCache.current[targetUrl]) {
      if (!forceUrl) { // 현재 선택된 국가만 UI 업데이트
        setData(dataCache.current[targetUrl]);
        setLoading(false);
      }
      // 캐시가 있어도 백그라운드에서 업데이트 시도
      if (!forceUrl) {
        fetchSheetsInBackground(targetUrl, targetApiEndpoint, cacheKey);
      }
      return;
    }

    // 2. 로컬 스토리지 캐시 확인 - 캐시 우선 전략
    let cachedRows = null;
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data: rows, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        
        // 캐시가 유효한 경우 (24시간 이내)
        if (now - timestamp < CACHE_TTL) {
          console.log('[LanguageContext] Using cached data from AsyncStorage (instant)');
          cachedRows = rows;
          dataCache.current[targetUrl] = rows; // 메모리 캐시에도 저장
          
          if (!forceUrl) { // 현재 선택된 국가만 UI 업데이트
            setData(rows);
            setLoading(false);
          }
          
          // 캐시를 사용하더라도 백그라운드에서 최신 데이터 확인
          if (!forceUrl) {
            fetchSheetsInBackground(targetUrl, targetApiEndpoint, cacheKey);
          }
          return;
        } else {
          console.log('[LanguageContext] Cache expired (24h), fetching new data');
        }
      }
    } catch (cacheError) {
      console.warn('[LanguageContext] Cache read error:', cacheError);
    }

    // 3. 네트워크에서 데이터 가져오기 (캐시가 없거나 만료된 경우)
    if (!forceUrl) {
      setLoading(true);
      setError(null);
    }
    
    try {
      let rows;
      
      // 먼저 백엔드 API 시도 (더 빠름)
      try {
        rows = await fetchFromAPI(targetApiEndpoint, 5000);
        console.log('[LanguageContext] Successfully fetched from API');
      } catch (apiError) {
        console.warn('[LanguageContext] API failed, falling back to Sheets:', apiError);
        // API 실패 시 Google Sheets로 폴백
        rows = await fetchSheet(targetUrl, 5000);
      }
      
      // 메모리 캐시에 저장
      dataCache.current[targetUrl] = rows;
      
      // 로컬 스토리지에 저장
      try {
        const cacheData = {
          data: rows,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`[LanguageContext] Data cached to AsyncStorage${forceUrl ? ' (background)' : ''}`);
      } catch (storageError) {
        console.warn('[LanguageContext] Cache write error, attempting cleanup:', storageError);
        
        // 저장 실패 시 오래된 캐시 정리 후 재시도
        if (storageError.message?.includes('SQLITE_FULL') || storageError.message?.includes('full')) {
          try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith('sheet_data_'));
            const now = Date.now();
            const CACHE_TTL = 24 * 60 * 60 * 1000;
            
            // 가장 오래된 캐시 2개 삭제
            const cacheEntries = [];
            for (const key of cacheKeys) {
              try {
                const cached = await AsyncStorage.getItem(key);
                if (cached) {
                  const { timestamp } = JSON.parse(cached);
                  cacheEntries.push({ key, timestamp });
                }
              } catch (e) {
                cacheEntries.push({ key, timestamp: 0 });
              }
            }
            cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
            
            let deleted = 0;
            for (let i = 0; i < Math.min(2, cacheEntries.length); i++) {
              try {
                await AsyncStorage.removeItem(cacheEntries[i].key);
                deleted++;
              } catch (e) {
                // ignore
              }
            }
            
            if (deleted > 0) {
              console.log(`[LanguageContext] Deleted ${deleted} old cache entries, retrying save...`);
              // 재시도
              try {
                const cacheData = {
                  data: rows,
                  timestamp: Date.now(),
                };
                await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
                console.log(`[LanguageContext] Successfully cached after cleanup`);
              } catch (retryError) {
                console.warn('[LanguageContext] Cache write still failed after cleanup:', retryError);
              }
            }
          } catch (cleanupError) {
            console.warn('[LanguageContext] Cleanup failed:', cleanupError);
          }
        }
      }
      
      if (!forceUrl) { // 현재 선택된 국가만 UI 업데이트
        setData(rows);
      }
    } catch (err) {
      console.error('[LanguageContext] fetchSheets error:', err);
      
      // 네트워크 실패 시 만료된 캐시라도 사용
      if (cachedRows && !forceUrl) {
        console.log('[LanguageContext] Using expired cache due to network error');
        setData(cachedRows);
        setLoading(false);
      } else if (!forceUrl) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!forceUrl) {
        setLoading(false);
      }
    }
  }, [sheetUrl, apiEndpoint]);
  
  // 백그라운드에서 데이터 업데이트 (캐시가 있어도 최신 데이터 확인)
  const fetchSheetsInBackground = useCallback(async (targetUrl, targetApiEndpoint, cacheKey) => {
    try {
      let rows;
      
      // 백엔드 API 시도
      try {
        rows = await fetchFromAPI(targetApiEndpoint, 3000);
      } catch (apiError) {
        // API 실패 시 Google Sheets로 폴백
        rows = await fetchSheet(targetUrl, 3000);
      }
      
      // 캐시 업데이트
      dataCache.current[targetUrl] = rows;
      const cacheData = {
        data: rows,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('[LanguageContext] Background data update completed');
      
      // 현재 선택된 국가라면 데이터 업데이트
      if (targetUrl === sheetUrl) {
        setData(rows);
      }
    } catch (err) {
      console.warn('[LanguageContext] Background update failed (non-critical):', err);
      // 백그라운드 업데이트 실패는 무시 (캐시가 있으므로)
    }
  }, [sheetUrl]);

  // 백그라운드에서 나머지 국가 데이터 프리로딩
  const preloadOtherCountries = useCallback(async (currentCountryIndex = 0) => {
    console.log('[LanguageContext] Starting background preload of other countries');
    
    // 현재 국가를 제외한 나머지 국가들
    const countriesToPreload = DATA_SHEETS.map((url, index) => ({ 
      url, 
      apiEndpoint: DATA_API_ENDPOINTS[index],
      index 
    })).filter(({ index }) => index !== currentCountryIndex);
    
    // 병렬로 프리로딩 (최대 3개씩)
    const BATCH_SIZE = 3;
    for (let i = 0; i < countriesToPreload.length; i += BATCH_SIZE) {
      const batch = countriesToPreload.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(
        batch.map(async ({ url, apiEndpoint, index }) => {
          try {
            // 이미 캐시에 있으면 스킵
            if (dataCache.current[url]) {
              console.log(`[LanguageContext] Country ${index} already cached, skipping`);
              return;
            }
            
            // 로컬 스토리지 캐시 확인
            try {
              const cacheKey = `sheet_data_${url}`;
              const cachedData = await AsyncStorage.getItem(cacheKey);
              
              if (cachedData) {
                const { data: cachedRows, timestamp } = JSON.parse(cachedData);
                const now = Date.now();
                
                // 캐시가 유효한 경우 (24시간 이내)
                if (now - timestamp < CACHE_TTL) {
                  console.log(`[LanguageContext] Country ${index} already in AsyncStorage cache`);
                  dataCache.current[url] = cachedRows;
                  return;
                }
              }
            } catch (cacheError) {
              console.warn('[LanguageContext] Cache read error during preload:', cacheError);
            }
            
            console.log(`[LanguageContext] Preloading country ${index} in background`);
            let rows;
            
            // 백엔드 API 시도
            try {
              rows = await fetchFromAPI(apiEndpoint, 3000);
            } catch (apiError) {
              // API 실패 시 Google Sheets로 폴백
              rows = await fetchSheet(url, 3000);
            }
            
            // 메모리 캐시에 저장
            dataCache.current[url] = rows;
            
            // 로컬 스토리지에 저장
            try {
              const cacheKey = `sheet_data_${url}`;
              const cacheData = {
                data: rows,
                timestamp: Date.now(),
              };
              await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
              console.log(`[LanguageContext] Country ${index} cached to AsyncStorage (background)`);
            } catch (storageError) {
              // 프리로딩 중 저장 실패는 무시 (메모리 캐시만 사용)
              console.warn('[LanguageContext] Cache write error during preload (ignored, using memory cache only):', storageError.message || storageError);
            }
          } catch (error) {
            console.warn(`[LanguageContext] Failed to preload country ${index}:`, error);
            // 프리로딩 실패해도 계속 진행
          }
        })
      );
    }
    
    console.log('[LanguageContext] Background preload completed');
  }, []);

  // 현재 선택된 국가 데이터 로드 (country 변경 시)
  useEffect(() => {
    fetchSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]); // country가 변경되면 새로운 데이터 로드

  // 초기 로드 완료 후 백그라운드 프리로딩 시작 (한 번만 실행)
  useEffect(() => {
    if (!loading && !preloadStarted.current && data.length > 0) {
      preloadStarted.current = true;
      // 기본 국가 데이터 로드가 완료되면 백그라운드에서 나머지 국가 프리로딩 시작
      setTimeout(() => {
        preloadOtherCountries(country);
      }, 500); // 약간의 딜레이를 두어 UI 반응성을 유지
    }
  }, [loading, data.length, country, preloadOtherCountries]);

  // 3. Process Data (When data or language changes)
  useEffect(() => {
    if (!data.length) return;

    const blockIndex = language;
    const startIndex = 3 + blockIndex * 5;

    const rawHeaderRow = data[1] ?? [];
    const headerSlice = rawHeaderRow.slice(startIndex, startIndex + 5);
    const headerRow = [rawHeaderRow[1] ?? '', rawHeaderRow[2] ?? '', ...headerSlice]; // [이미지, 링크, 제목, 작가, 작가정보, 책에 대해, 더 많은 정보]
    while (headerRow.length < 7) {
      headerRow.push('');
    }
    setColumnHeaders(headerRow);

    // Slice from index 2 to skip:
    // Index 0: Language grouping row (Original, Korean, etc.)
    // Index 1: Header row (Ranking, Image URL, Title, etc.)
    const rowsWithoutHeader = data.slice(2);
    const filtered = filterColumns(rowsWithoutHeader, startIndex);
    setFilteredData(filtered);
  }, [data, language]);

  const contextValue = useMemo(
    () => ({
      userLanguage,
      setUserLanguage,
      language,
      setLanguage,
      country,
      setCountry,
      translations,
      data,
      filteredData,
      columnHeaders,
      languageLabels,
      originalLangs: languageLabels,
      loading,
      error,
      fetchSheets,
    }),
    [
      userLanguage,
      setUserLanguage,
      language,
      country,
      translations,
      data,
      filteredData,
      columnHeaders,
      languageLabels,
      loading,
      error,
      fetchSheets,
    ],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
