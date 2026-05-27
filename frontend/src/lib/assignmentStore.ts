import { create } from "zustand";
import type { Assignment, GeneratedPaper } from "@/types";
import * as api from "@/lib/api";

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  currentResult: GeneratedPaper | null;
  loading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  createAssignment: (payload: Parameters<typeof api.createAssignment>[0]) => Promise<string>;
  deleteAssignment: (id: string) => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  setResult: (result: GeneratedPaper | null) => void;
  fetchResult: (id: string) => Promise<GeneratedPaper | null>;
  regenerate: (id: string) => Promise<void>;
  subscribeToAssignment: (
    assignmentId: string,
    onDone: () => void,
    onFailed: (error: string) => void
  ) => () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  currentResult: null,
  loading: false,
  error: null,

  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const assignments = await api.fetchAssignments();
      set({ assignments, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load",
      });
    }
  },

  createAssignment: async (payload) => {
    set({ loading: true, error: null });
    const { assignmentId, assignment } = await api.createAssignment(payload);
    set((s) => ({
      assignments: [assignment, ...s.assignments],
      currentAssignment: assignment,
      loading: false,
    }));
    return assignmentId;
  },

  deleteAssignment: async (id) => {
    await api.deleteAssignment(id);
    set((s) => ({ assignments: s.assignments.filter((a) => a._id !== id) }));
  },

  fetchAssignment: async (id) => {
    const assignment = await api.fetchAssignment(id);
    set({ currentAssignment: assignment });
  },

  setResult: (result) => set({ currentResult: result }),

  fetchResult: async (id) => {
    const result = await api.fetchResult(id);
    set({ currentResult: result });
    return result;
  },

  regenerate: async (id) => {
    set({ currentResult: null, error: null });
    await api.regenerateAssignment(id);
    set((s) => ({
      currentAssignment: s.currentAssignment
        ? { ...s.currentAssignment, status: "processing", failureReason: undefined }
        : null,
    }));
  },

  /** Poll assignment status (works on Vercel; no WebSocket required). */
  subscribeToAssignment: (assignmentId, onDone, onFailed) => {
    const poll = async () => {
      try {
        const assignment = await api.fetchAssignment(assignmentId);
        set({ currentAssignment: assignment });

        if (assignment.status === "done") {
          await get().fetchResult(assignmentId);
          onDone();
          return true;
        }
        if (assignment.status === "failed") {
          onFailed(assignment.failureReason || "Generation failed");
          set({ error: assignment.failureReason || "Generation failed" });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    void poll();
    const interval = setInterval(async () => {
      const finished = await poll();
      if (finished) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  },
}));
