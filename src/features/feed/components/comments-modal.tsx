import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/auth-provider';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { colors, radii, spacing } from '@/src/theme/tokens';
import type { FeedPost } from '../types';

type CommentsModalProps = {
  post: FeedPost;
  visible: boolean;
  onClose: () => void;
};

export function CommentsModal({ onClose, post, visible }: CommentsModalProps) {
  const router = useRouter();
  const { isConfigured, user } = useAuth();
  const insets = useSafeAreaInsets();
  const { addComment, commentsByPost, deleteComment, loadComments, syncStatus } = useRankingStore();
  const [draft, setDraft] = useState('');
  const comments = commentsByPost[post.id] ?? [];

  useEffect(() => {
    if (visible) void loadComments(post.id);
  }, [loadComments, post.id, visible]);

  const submit = () => {
    if (!draft.trim()) return;
    if (isConfigured && !user) {
      onClose();
      router.push('/sign-in');
      return;
    }
    void addComment(post.id, draft).catch(() => undefined);
    setDraft('');
  };

  const confirmDelete = (commentId: string) => {
    Alert.alert('Delete comment?', 'This removes your comment permanently.', [
      { style: 'cancel', text: 'Cancel' },
      { style: 'destructive', text: 'Delete', onPress: () => void deleteComment(post.id, commentId).catch(() => undefined) },
    ]);
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="overFullScreen" transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable accessibilityLabel="Close comments" onPress={onClose} style={styles.dismissArea} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Comments</Text>
              <Text numberOfLines={1} style={styles.subtitle}>{post.title}</Text>
            </View>
            <Pressable accessibilityLabel="Close comments" hitSlop={10} onPress={onClose}><Ionicons color={colors.foreground} name="close" size={25} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.comments} keyboardShouldPersistTaps="handled">
            {comments.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons color="#747781" name="chatbubbles-outline" size={32} />
                <Text style={styles.emptyTitle}>Start the conversation</Text>
                <Text style={styles.emptyText}>{syncStatus === 'synced' ? 'Be the first to add a synced comment.' : 'Your comments are saved on this device.'}</Text>
              </View>
            ) : comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{comment.avatarLabel ?? 'RF'}</Text></View>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.isOwn ? 'You' : comment.authorName ?? 'Rankfeed creator'}</Text>
                    {comment.isOwn ? <Pressable accessibilityLabel="Delete your comment" hitSlop={8} onPress={() => confirmDelete(comment.id)}><Ionicons color="#9EA1AA" name="trash-outline" size={16} /></Pressable> : null}
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Add a comment"
              maxLength={240}
              onChangeText={setDraft}
              onSubmitEditing={submit}
              placeholder="Add your take…"
              placeholderTextColor="#777A84"
              returnKeyType="send"
              style={styles.input}
              value={draft}
            />
            <Pressable accessibilityLabel="Post comment" disabled={!draft.trim()} onPress={submit} style={[styles.send, !draft.trim() && styles.sendDisabled]}>
              <Ionicons color="#13160D" name="arrow-up" size={20} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.58)', flex: 1, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheet: { backgroundColor: '#111319', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '72%', minHeight: '52%', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', backgroundColor: '#4A4D56', borderRadius: radii.pill, height: 4, marginBottom: spacing.lg, width: 42 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.foreground, fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#8F929C', fontSize: 12, marginTop: 2, maxWidth: 290 },
  comments: { flexGrow: 1, paddingVertical: spacing.lg },
  empty: { alignItems: 'center', justifyContent: 'center', minHeight: 190 },
  emptyTitle: { color: colors.foreground, fontSize: 16, fontWeight: '800', marginTop: spacing.sm },
  emptyText: { color: '#8F929C', fontSize: 12, marginTop: spacing.xs },
  comment: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  avatar: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  avatarText: { color: '#13160D', fontSize: 10, fontWeight: '900' },
  commentBody: { backgroundColor: '#1B1D24', borderRadius: radii.md, flex: 1, padding: spacing.md },
  commentHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  commentAuthor: { color: colors.foreground, fontSize: 12, fontWeight: '800' },
  commentText: { color: '#E1E2E5', fontSize: 14, lineHeight: 19, marginTop: 3 },
  composer: { alignItems: 'center', borderTopColor: '#292C34', borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md },
  input: { backgroundColor: '#1B1D24', borderRadius: radii.pill, color: colors.foreground, flex: 1, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.lg },
  send: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  sendDisabled: { opacity: 0.35 },
});
