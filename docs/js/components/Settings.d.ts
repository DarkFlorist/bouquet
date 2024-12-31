import { ReadonlySignal, Signal } from '@preact/signals';
import { JSX } from 'preact/jsx-runtime';
import { BouquetNetwork, BouquetSettings } from '../types/bouquetTypes.js';
export declare const SettingsIcon: () => JSX.Element;
export declare const SettingsModal: ({ display, bouquetNetwork, bouquetSettings }: {
    display: Signal<boolean>;
    bouquetNetwork: ReadonlySignal<BouquetNetwork>;
    bouquetSettings: Signal<BouquetSettings>;
}) => JSX.Element | null;
//# sourceMappingURL=Settings.d.ts.map