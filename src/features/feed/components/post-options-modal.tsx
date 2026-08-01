import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/features/auth/auth-provider';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import type { ReportReason } from '@/src/features/rankings/types';
import { colors, radii, spacing } from '@/src/theme/tokens';
import type { FeedPost } from '../types';

const reasons: readonly { label: string; value: ReportReason }[] = [
  { label: 'Spam or misleading', value: 'spam' },
  { label: 'Harassment or bullying', value: 'harassment' },
  { label: 'Hateful content', value: 'hate' },
  { label: 'Sexual content', value: 'sexual-content' },
  { label: 'Violence or threats', value: 'violence' },
  { label: 'Copyright issue', value: 'copyright' },
  { label: 'Something else', value: 'other' },
];

type PostOptionsModalProps = {
  onClose: () => void;
  post: FeedPost;
  visible: boolean;
};

export function PostOptionsModal({ onClose, post, visible }: PostOptionsModalProps) {
  const router = useRouter();
  const { isConfigured, user } = useAuth();
  const { blockCreator, reportPost, reportedPostIds } = useRankingStore();
  const [view, setView] = useState<'actions' | 'reasons' | 'reported'>('actions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const alreadyReported = reportedPostIds.includes(post.id);
  const ownPost = post.creator.id === user?.id || post.creator.id === 'creator-you';

  const requireAccount = () => {
    if (!isConfigured || user) return false;
    onClose();
    router.push('/sign-in');
    return true;
  };

  const close = () => {
    setView('actions');
    setError(undefined);
    onClose();
  };

  const submitReport = async (reason: ReportReason) => {
    if (requireAccount() || isSubmitting) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await reportPost(post.id, reason);
      setView('reported');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The report could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const block = async () => {
    if (requireAccount() || isSubmitting) return;
    setIsSubmitting(true);
    setError(undefined);
    try {
      await blockCreator(post.creator.id);
      close();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The creator could not be blocked.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable accessibilityLabel="Close post options" onPress={close} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {view === 'reported' ? (
            <View style={styles.confirmation}>
              <View style={styles.confirmationIcon}><Ionicons color="#13160D" name="checkmark" size={24} /></View>
              <Text style={styles.title}>Report received</Text>
              <Text style={styles.copy}>Thanks for helping keep RankFeed safe. The post has been added to the moderation queue.</Text>
              <Pressable onPress={close} style={styles.doneButton}><Text style={styles.doneText}>Done</Text></Pressable>
            </View>
          ) : view === 'reasons' ? (
            <>
              <View style={styles.headingRow}>
                <Pressable accessibilityLabel="Back" onPress={() => setView('actions')}><Ionicons color={colors.foreground} name="arrow-back" size={22} /></Pressable>
                <View style={styles.headingCopy}><Text style={styles.title}>Why are you reporting this?</Text><Text style={styles.copy}>Reports are private. Choose the closest reason.</Text></View>
              </View>
              {reasons.map((reason) => (
                <Pressable disabled={isSubmitting} key={reason.value} onPress={() => void submitReport(reason.value)} style={({ pressed }) => [styles.reasonRow, pressed && styles.pressed]}>
                  <Text style={styles.reasonText}>{reason.label}</Text>
                  <Ionicons color="#777A84" name="chevron-forward" size={18} />
                </Pressable>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.title}>Post options</Text>
              <Text numberOfLines={1} style={styles.copy}>{post.title}</Text>
              <Pressable onPress={() => setView(alreadyReported ? 'reported' : 'reasons')} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
                <View style={styles.actionIcon}><Ionicons color="#FFCB6B" name="flag-outline" size={22} /></View>
                <View style={styles.actionCopy}><Text style={styles.actionTitle}>{alreadyReported ? 'Post reported' : 'Report post'}</Text><Text style={styles.actionHint}>{alreadyReported ? 'This post is already in the moderation queue' : 'Tell us about unsafe or inappropriate content'}</Text></View>
                <Ionicons color="#777A84" name="chevron-forward" size={18} />
              </Pressable>
              {!ownPost ? (
                <Pressable disabled={isSubmitting} onPress={() => void block()} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
                  <View style={[styles.actionIcon, styles.blockIcon]}><Ionicons color="#FF879A" name="ban-outline" size={22} /></View>
                  <View style={styles.actionCopy}><Text style={styles.actionTitle}>Block {post.creator.displayName}</Text><Text style={styles.actionHint}>Hide their posts; unblock anytime from Profile</Text></View>
                  <Ionicons color="#777A84" name="chevron-forward" size={18} />
                </Pressable>
              ) : null}
            </>
          )}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.62)' },
  sheet: { backgroundColor: '#111319', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', backgroundColor: '#454852', borderRadius: 2, height: 4, marginBottom: spacing.lg, width: 42 },
  headingRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  headingCopy: { flex: 1 },
  title: { color: colors.foreground, fontSize: 19, fontWeight: '900' },
  copy: { color: '#92959F', fontSize: 12, lineHeight: 18, marginTop: 4 },
  actionRow: { alignItems: 'center', borderBottomColor: '#292C34', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 76 },
  actionIcon: { alignItems: 'center', backgroundColor: 'rgba(255, 203, 107, 0.1)', borderRadius: 16, height: 42, justifyContent: 'center', width: 42 },
  blockIcon: { backgroundColor: 'rgba(255, 135, 154, 0.1)' },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  actionHint: { color: '#858893', fontSize: 11, marginTop: 3 },
  reasonRow: { alignItems: 'center', borderBottomColor: '#292C34', borderBottomWidth: 1, flexDirection: 'row', minHeight: 52 },
  reasonText: { color: colors.foreground, flex: 1, fontSize: 14, fontWeight: '700' },
  confirmation: { alignItems: 'center', paddingBottom: spacing.lg },
  confirmationIcon: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 24, height: 48, justifyContent: 'center', marginBottom: spacing.md, width: 48 },
  doneButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#C8FF64', borderRadius: radii.pill, justifyContent: 'center', marginTop: spacing.xl, minHeight: 48 },
  doneText: { color: '#13160D', fontSize: 14, fontWeight: '900' },
  error: { color: '#FF879A', fontSize: 12, marginTop: spacing.md },
  pressed: { opacity: 0.68 },
});
