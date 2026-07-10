import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// UI-only editor state. Server data lives in TanStack Query.

export type SelectedNode =
  | { type: 'phase'; id: number }
  | { type: 'subphase'; id: number }
  | { type: 'item'; id: number }
  | { type: 'event'; id: string }
  | null;

interface ProcedureEditorState {
  aircraftModelCode: string;
  selectedNode: SelectedNode;
  selectedEventId: string | null;
  expandedNodes: Record<string, boolean>;
  advancedExpr: boolean;

  setAircraftModelCode: (code: string) => void;
  selectNode: (node: SelectedNode) => void;
  selectEvent: (id: string | null) => void;
  toggleNode: (key: string) => void;
  setExpanded: (key: string, open: boolean) => void;
  setAdvancedExpr: (value: boolean) => void;
  reset: () => void;
}

export const useProcedureStore = create<ProcedureEditorState>()(
  devtools(
    (set) => ({
      aircraftModelCode: 'A320',
      selectedNode: null,
      selectedEventId: null,
      expandedNodes: {},
      advancedExpr: false,

      setAircraftModelCode: (code) =>
        set({ aircraftModelCode: code }, false, 'setAircraftModelCode'),

      selectNode: (node) => set({ selectedNode: node }, false, 'selectNode'),

      selectEvent: (id) =>
        set(
          {
            selectedEventId: id,
            selectedNode: id ? { type: 'event', id } : null,
          },
          false,
          'selectEvent'
        ),

      toggleNode: (key) =>
        set(
          (state) => ({
            expandedNodes: {
              ...state.expandedNodes,
              [key]: !state.expandedNodes[key],
            },
          }),
          false,
          'toggleNode'
        ),

      setExpanded: (key, open) =>
        set(
          (state) => ({
            expandedNodes: { ...state.expandedNodes, [key]: open },
          }),
          false,
          'setExpanded'
        ),

      setAdvancedExpr: (value) =>
        set({ advancedExpr: value }, false, 'setAdvancedExpr'),

      reset: () =>
        set(
          {
            selectedNode: null,
            selectedEventId: null,
            expandedNodes: {},
            advancedExpr: false,
          },
          false,
          'reset'
        ),
    }),
    { name: 'procedure-store' }
  )
);
