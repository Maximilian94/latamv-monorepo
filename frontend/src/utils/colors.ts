// Tailwind CSS Colors as CSS Custom Properties
// These match the default Tailwind color palette

export const colors = {
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  // Rose scale (secondary color)
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48', // This is our secondary color
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  // Indigo scale (primary color)
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b', // This is our primary color
  },
  // Slate scale
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const;

// Helper function to get color value
export const getColor = (colorName: string): string => {
  const [color, shade] = colorName.split('-');
  return colors[color as keyof typeof colors]?.[shade as unknown as keyof typeof colors.gray] || colorName;
};

// CSS Custom Properties for use in Material-UI sx prop
export const cssColors = {
  // Gray scale
  'gray-50': 'var(--tw-gray-50)',
  'gray-100': 'var(--tw-gray-100)',
  'gray-200': 'var(--tw-gray-200)',
  'gray-300': 'var(--tw-gray-300)',
  'gray-400': 'var(--tw-gray-400)',
  'gray-500': 'var(--tw-gray-500)',
  'gray-600': 'var(--tw-gray-600)',
  'gray-700': 'var(--tw-gray-700)',
  'gray-800': 'var(--tw-gray-800)',
  'gray-900': 'var(--tw-gray-900)',
  'gray-950': 'var(--tw-gray-950)',
  
  // Rose scale
  'rose-50': 'var(--tw-rose-50)',
  'rose-100': 'var(--tw-rose-100)',
  'rose-200': 'var(--tw-rose-200)',
  'rose-300': 'var(--tw-rose-300)',
  'rose-400': 'var(--tw-rose-400)',
  'rose-500': 'var(--tw-rose-500)',
  'rose-600': 'var(--tw-rose-600)',
  'rose-700': 'var(--tw-rose-700)',
  'rose-800': 'var(--tw-rose-800)',
  'rose-900': 'var(--tw-rose-900)',
  'rose-950': 'var(--tw-rose-950)',
  
  // Indigo scale
  'indigo-50': 'var(--tw-indigo-50)',
  'indigo-100': 'var(--tw-indigo-100)',
  'indigo-200': 'var(--tw-indigo-200)',
  'indigo-300': 'var(--tw-indigo-300)',
  'indigo-400': 'var(--tw-indigo-400)',
  'indigo-500': 'var(--tw-indigo-500)',
  'indigo-600': 'var(--tw-indigo-600)',
  'indigo-700': 'var(--tw-indigo-700)',
  'indigo-800': 'var(--tw-indigo-800)',
  'indigo-900': 'var(--tw-indigo-900)',
  'indigo-950': 'var(--tw-indigo-950)',
  
  // Slate scale
  'slate-50': 'var(--tw-slate-50)',
  'slate-100': 'var(--tw-slate-100)',
  'slate-200': 'var(--tw-slate-200)',
  'slate-300': 'var(--tw-slate-300)',
  'slate-400': 'var(--tw-slate-400)',
  'slate-500': 'var(--tw-slate-500)',
  'slate-600': 'var(--tw-slate-600)',
  'slate-700': 'var(--tw-slate-700)',
  'slate-800': 'var(--tw-slate-800)',
  'slate-900': 'var(--tw-slate-900)',
  'slate-950': 'var(--tw-slate-950)',
} as const;
