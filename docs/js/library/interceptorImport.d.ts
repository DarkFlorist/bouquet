import { TransactionList } from '../types/bouquetTypes.js';
import { GetSimulationStackReply } from '../types/interceptorTypes.js';
export declare function requestInterceptorStackAfterConnection<T>(connectProvider: () => Promise<unknown>, requestStack: () => Promise<T>): Promise<T>;
export declare function simulationStackRequestError(error: unknown): Error;
export declare function convertInterceptorTransactions(transactions: GetSimulationStackReply): TransactionList;
export declare function markSyntheticFunding(transactions: TransactionList): TransactionList;
//# sourceMappingURL=interceptorImport.d.ts.map