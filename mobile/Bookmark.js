import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBookmark } from './BookmarkContext';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import translationsData from './assets/translations.json';

export default function Bookmark({ navigation }) {
  const { bookmarks, removeBookmark } = useBookmark();
  const [sortBy, setSortBy] = useState('new-old');
  const [showSortModal, setShowSortModal] = useState(false);
  const { colors, isDark } = useTheme();
  const { userLanguage } = useLanguage();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  
  // JSON 파일에서 번역 가져오기
  const bookmarkText = translationsData?.bookmark?.[userLanguage] || translationsData?.bookmark?.[1] || 'Bookmark';
  
  // 빈 북마크 메시지 (JSON에 없으므로 하드코딩, 나중에 JSON에 추가 가능)
  const emptyTexts = {
    0: '북마크한 책이 없습니다',
    1: 'No bookmarked books',
    2: 'ブックマークした本がありません',
    3: '没有已收藏的书籍',
    4: '沒有已收藏的書籍',
    5: 'Aucun livre enregistré',
    6: 'No hay libros marcados',
  };
  const emptySubtexts = {
    0: '책 목록에서 ☆를 눌러 북마크하세요',
    1: 'Tap ☆ on book list to bookmark',
    2: '本のリストで☆をタップしてブックマーク',
    3: '在书籍列表中点击☆进行收藏',
    4: '在書籍列表中點擊☆進行收藏',
    5: 'Appuyez sur ☆ dans la liste des livres pour marquer',
    6: 'Toca ☆ en la lista de libros para marcar',
  };
  const emptyText = emptyTexts[userLanguage] || emptyTexts[1];
  const emptySubtext = emptySubtexts[userLanguage] || emptySubtexts[1];

  // 정렬된 북마크 목록
  const sortedBookmarks = useMemo(() => {
    const sorted = [...bookmarks];
    
    switch (sortBy) {
      case 'new-old':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.bookmarkedAt || 0);
          const dateB = new Date(b.bookmarkedAt || 0);
          return dateB - dateA; // 최신순
        });
      case 'old-new':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.bookmarkedAt || 0);
          const dateB = new Date(b.bookmarkedAt || 0);
          return dateA - dateB; // 오래된순
        });
      case 'a-z':
        return sorted.sort((a, b) => {
          return (a.title || '').localeCompare(b.title || '');
        });
      case 'z-a':
        return sorted.sort((a, b) => {
          return (b.title || '').localeCompare(a.title || '');
        });
      case 'random':
        return sorted.sort(() => Math.random() - 0.5);
      default:
        return sorted;
    }
  }, [bookmarks, sortBy]);

  const sortOptions = [
    { value: 'new-old', label: 'New - Old' },
    { value: 'old-new', label: 'Old - New' },
    { value: 'a-z', label: 'A - Z' },
    { value: 'z-a', label: 'Z - A' },
    { value: 'random', label: 'Random' },
  ];

  const getSortLabel = () => {
    return sortOptions.find(opt => opt.value === sortBy)?.label || 'New - Old';
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.bookInfo}
        onPress={() => {
          const detailPage =
            item.country === 'KR'
              ? 'KrDetail'
              : item.country === 'JP'
              ? 'JpDetail'
              : item.country === 'TW'
              ? 'TwDetail'
              : item.country === 'FR'
              ? 'FrDetail'
              : item.country === 'UK'
              ? 'UkDetail'
              : 'UsDetail';

          navigation.navigate(detailPage, { book: item });
        }}
      >
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.image} />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.country}>
            {item.country === 'KR' 
              ? '🇰🇷' 
              : item.country === 'JP' 
              ? '🇯🇵' 
              : item.country === 'US' 
              ? '🇺🇸' 
              : item.country === 'TW' 
              ? '🇹🇼' 
              : item.country === 'FR' 
              ? '🇫🇷' 
              : item.country === 'UK'
              ? '🇬🇧'
              : '🇺🇸'}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {item.author}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeBookmark(item.id)}
      >
        <Icon name="delete-outline" size={24} color={colors.secondaryText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{bookmarkText}</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Icon name="sort" size={20} color={colors.link} />
          <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
          <Icon name="chevron-down" size={16} color={colors.link} />
        </TouchableOpacity>
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Text style={styles.emptySubText}>
            {emptySubtext}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedBookmarks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* 정렬 모달 */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort by</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortModal(false);
                }}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Icon name="check" size={20} color={colors.link} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const getStyles = (colors, isDark) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.secondaryBackground,
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.link,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.primaryBackground,
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: isDark ? colors.secondaryBackground : '#E3F2FD',
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.link,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  bookInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  image: {
    width: 80,
    height: 110,
    borderRadius: 8,
    marginRight: 15,
  },
  textContainer: { flex: 1 },
  country: { fontSize: 20, marginBottom: 5 },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  author: { color: colors.secondaryText, fontSize: 14 },
  deleteButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text,
    fontSize: 18,
    marginBottom: 10,
  },
  emptySubText: {
    color: colors.secondaryText,
    fontSize: 14,
  },
});
