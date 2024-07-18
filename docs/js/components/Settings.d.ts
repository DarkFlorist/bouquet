import { Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { AppSettings } from '../types/types.js';
export declare const SettingsIcon: () => JSX.Element;
export declare const SettingsModal: ({ display, appSettings }: {
    display: Signal<boolean>;
    appSettings: Signal<AppSettings>;
}) => JSX.Element | null;
//# sourceMappingURL=Settings.d.ts.map