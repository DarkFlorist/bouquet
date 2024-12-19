import { Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { Bundle } from '../types/types.js';
export declare const ImportModal: ({ display, bundle, clearError }: {
    display: Signal<boolean>;
    clearError: () => void;
    bundle: Signal<Bundle | undefined>;
}) => JSX.Element | null;
//# sourceMappingURL=ImportModal.d.ts.map