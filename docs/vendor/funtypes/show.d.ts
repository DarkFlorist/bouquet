import { RuntypeBase } from './runtype';
export declare const parenthesize: (s: string, needsParens: boolean) => string;
declare const show: (runtype: RuntypeBase<unknown>, needsParens?: boolean) => string;
export default show;
