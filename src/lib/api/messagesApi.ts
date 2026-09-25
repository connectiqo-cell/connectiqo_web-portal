import { createClient } from "@/lib/supabase/client";
import { getSupabaseErrorMessage } from "@/lib/supabase/errorHandler";

export interface ConversationRow {
  id: string;
  mentor_id: string;
  learner_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  mentor_last_read_at: string | null;
  learner_last_read_at: string | null;
  mentor: { id: string; name: string | null; avatar_url: string | null } | null;
  learner: { id: string; name: string | null; avatar_url: string | null } | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_label: boolean;
  created_at: string;
}

export interface ConversationLabel {
  id: string;
  role: "learner" | "mentor";
  label: string;
  sort_order: number;
}

const CONVERSATION_SELECT =
  "id, mentor_id, learner_id, last_message_at, last_message_preview, mentor_last_read_at, learner_last_read_at, mentor:mentor_id ( id, name, avatar_url ), learner:learner_id ( id, name, avatar_url )";

export const messagesApi = {
  /** All conversations for the current user, either side, newest first. */
  getConversations: async (userId: string): Promise<ConversationRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(CONVERSATION_SELECT)
        .or(`mentor_id.eq.${userId},learner_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as ConversationRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getConversation: async (conversationId: string): Promise<ConversationRow | null> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(CONVERSATION_SELECT)
        .eq("id", conversationId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ConversationRow | null;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Finds the (mentor, learner) conversation, creating it if this is their first contact. */
  getOrCreateConversation: async ({
    mentorId,
    learnerId,
  }: {
    mentorId: string;
    learnerId: string;
  }): Promise<string> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        p_mentor_id: mentorId,
        p_learner_id: learnerId,
      });
      if (error) throw error;
      return data as string;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getMessages: async (conversationId: string): Promise<MessageRow[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, is_label, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown as MessageRow[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Server-enforces the learner label-only rule — see send_message() in the migration. */
  sendMessage: async ({ conversationId, body }: { conversationId: string; body: string }): Promise<void> => {
    const supabase = createClient();
    try {
      const { error } = await supabase.rpc("send_message", {
        p_conversation_id: conversationId,
        p_body: body,
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  getLabels: async (role: "learner" | "mentor"): Promise<ConversationLabel[]> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("conversation_labels")
        .select("id, role, label, sort_order")
        .eq("role", role)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as ConversationLabel[]) || [];
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Whether the learner can currently free-type to this mentor (an active, non-completed/cancelled booking exists). */
  hasActiveBooking: async ({ mentorId, learnerId }: { mentorId: string; learnerId: string }): Promise<boolean> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("has_active_booking", {
        p_mentor_id: mentorId,
        p_learner_id: learnerId,
      });
      if (error) throw error;
      return Boolean(data);
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  /** Count of conversations with a message newer than this user's own last-read mark, for the sidebar badge. */
  getUnreadConversationCount: async (userId: string): Promise<number> => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("mentor_id, learner_id, last_message_at, mentor_last_read_at, learner_last_read_at")
        .or(`mentor_id.eq.${userId},learner_id.eq.${userId}`);
      if (error) throw error;
      return (data || []).filter((c) => {
        const isMentor = c.mentor_id === userId;
        const lastReadAt = isMentor ? c.mentor_last_read_at : c.learner_last_read_at;
        return !lastReadAt || new Date(lastReadAt) < new Date(c.last_message_at);
      }).length;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },

  markRead: async ({
    conversationId,
    userId,
    isMentor,
  }: {
    conversationId: string;
    userId: string;
    isMentor: boolean;
  }): Promise<void> => {
    const supabase = createClient();
    try {
      const column = isMentor ? "mentor_last_read_at" : "learner_last_read_at";
      const { error } = await supabase
        .from("conversations")
        .update({ [column]: new Date().toISOString() })
        .eq("id", conversationId)
        .eq(isMentor ? "mentor_id" : "learner_id", userId);
      if (error) throw error;
    } catch (error) {
      throw new Error(getSupabaseErrorMessage(error));
    }
  },
};
