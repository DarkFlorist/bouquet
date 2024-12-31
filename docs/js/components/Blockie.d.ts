import { JSX } from 'preact/jsx-runtime';
import { ReadonlySignal, Signal } from '@preact/signals';
interface BlockieProps {
    address: Signal<bigint> | ReadonlySignal<bigint>;
    scale?: Signal<number>;
    style?: JSX.CSSProperties;
}
export declare function Blockie(props: BlockieProps): JSX.Element;
export {};
//# sourceMappingURL=Blockie.d.ts.map