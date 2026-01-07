import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

const TRANSLATION_URL =
  'https://docs.google.com/spreadsheets/d/1GoeMU5HbM7g2jujoO5vBI6Z1BH_EjUtnVmV9zWAKpHs/export?format=tsv&gid=0&range=A1:F31';
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

const fetchSheet = async url => {
  try {
    console.log(`[LanguageContext] Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    return parseTSV(text);
  } catch (error) {
    console.error('[LanguageContext] Fetch failed:', error);
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
        // 번역 로드 실패 시에도 앱이 계속 실행되도록 빈 배열로 설정
        setTranslations([]);
        setLanguageLabels([]);
      }
    };
    loadTranslations();
  }, []);

  // 2. Fetch Data (When country/sheetUrl changes)
  const fetchSheets = useCallback(async (forceUrl = null) => {
    const targetUrl = forceUrl || sheetUrl;
    
    // 1. 메모리 캐시 확인 (가장 빠름)
    if (dataCache.current[targetUrl]) {
      if (!forceUrl) { // 현재 선택된 국가만 UI 업데이트
        setData(dataCache.current[targetUrl]);
        setLoading(false);
      }
      return;
    }

    // 2. 로컬 스토리지 캐시 확인
    try {
      const cacheKey = `sheet_data_${targetUrl}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data: cachedRows, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        
        // 캐시가 유효한 경우 (24시간 이내)
        if (now - timestamp < CACHE_TTL) {
          console.log('[LanguageContext] Using cached data from AsyncStorage');
          dataCache.current[targetUrl] = cachedRows; // 메모리 캐시에도 저장
          if (!forceUrl) { // 현재 선택된 국가만 UI 업데이트
            setData(cachedRows);
            setLoading(false);
          }
          return;
        } else {
          console.log('[LanguageContext] Cache expired (24h), fetching new data');
        }
      }
    } catch (cacheError) {
      console.warn('[LanguageContext] Cache read error:', cacheError);
    }

    // 3. 네트워크에서 데이터 가져오기
    if (!forceUrl) {
      setLoading(true);
      setError(null);
    }
    try {
      const rows = await fetchSheet(targetUrl);
      
      // 메모리 캐시에 저장
      dataCache.current[targetUrl] = rows;
      
      // 로컬 스토리지에 저장
      try {
        const cacheKey = `sheet_data_${targetUrl}`;
        const cacheData = {
          data: rows,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`[LanguageContext] Data cached to AsyncStorage${forceUrl ? ' (background)' : ''}`);
      } catch (storageError) {
        console.warn('[LanguageContext] Cache write error:', storageError);
      }
      
      if (!forceUrl) { // 현재 선택된 국가만 UI 업데이트
        setData(rows);
      }
    } catch (err) {
      console.error('[LanguageContext] fetchSheets error:', err);
      if (!forceUrl) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!forceUrl) {
        setLoading(false);
      }
    }
  }, [sheetUrl]);

  // 백그라운드에서 나머지 국가 데이터 프리로딩
  const preloadOtherCountries = useCallback(async (currentCountryIndex = 0) => {
    console.log('[LanguageContext] Starting background preload of other countries');
    
    // 현재 국가를 제외한 나머지 국가들
    const countriesToPreload = DATA_SHEETS.map((url, index) => ({ url, index }))
      .filter(({ index }) => index !== currentCountryIndex);
    
    // 순차적으로 프리로딩 (병렬로 하면 네트워크 부하가 클 수 있음)
    for (const { url, index } of countriesToPreload) {
      try {
        // 이미 캐시에 있으면 스킵
        if (dataCache.current[url]) {
          console.log(`[LanguageContext] Country ${index} already cached, skipping`);
          continue;
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
              continue;
            }
          }
        } catch (cacheError) {
          console.warn('[LanguageContext] Cache read error during preload:', cacheError);
        }
        
        console.log(`[LanguageContext] Preloading country ${index} in background`);
        const rows = await fetchSheet(url);
        
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
          console.warn('[LanguageContext] Cache write error during preload:', storageError);
        }
      } catch (error) {
        console.warn(`[LanguageContext] Failed to preload country ${index}:`, error);
        // 프리로딩 실패해도 계속 진행
      }
    }
    
    console.log('[LanguageContext] Background preload completed');
  }, []);

  // 현재 선택된 국가 데이터 로드 (country 변경 시)
  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

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
