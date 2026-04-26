import { create } from "zustand";

export interface MatchWithLastMessage {
  id: string;
  user1: string;
  user2: string;
  matched_at: string;
  lastMessage?: {
    text: string;
    sentAt: string;
    isRead: boolean;
    senderIsMe: boolean;
  };
  otherUserName?: string;
  otherUserImage?: string;
  otherUserId?: string;
}

interface MatchState {
  matches: MatchWithLastMessage[];
  setMatches: (matches: MatchWithLastMessage[]) => void;
  updateLastMessage: (
    matchId: string,
    message: string,
    sentAt: string,
    isRead: boolean,
    senderIsMe: boolean,
  ) => void;
  deleteMatch: (matchId: string) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],

  setMatches: (matches) => set({ matches }),

  updateLastMessage: (matchId, message, sentAt, isRead, senderIsMe) => {
    set((state) => ({
      matches: state.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              lastMessage: {
                text: message,
                sentAt,
                isRead,
                senderIsMe,
              },
            }
          : match,
      ),
    }));
  },

  deleteMatch: (matchId) => {
    set((state) => ({
      matches: state.matches.filter((match) => match.id !== matchId),
    }));
  },
}));
