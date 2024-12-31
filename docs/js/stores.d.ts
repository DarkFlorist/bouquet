import { ProviderStore } from './library/provider.js';
import { BlockInfo, Bundle, Signers } from './types/types.js';
export declare function fetchSettingsFromStorage(): readonly {
    chainId: bigint;
    networkName: string;
    relayMode: "relay" | "mempool";
    mempoolSubmitRpcEndpoint: string | undefined;
    mempoolSimulationRpcEndpoint: string | undefined;
    blocksInFuture: bigint;
    priorityFee: bigint;
    blockExplorerApi: string | undefined;
    blockExplorer: string | undefined;
    simulationRelayEndpoint: string | undefined;
    submissionRelayEndpoint: string | undefined;
}[];
export declare function createGlobalState(): {
    provider: import("@preact/signals-core").Signal<ProviderStore | undefined>;
    blockInfo: import("@preact/signals-core").Signal<BlockInfo>;
    bundle: import("@preact/signals-core").Signal<Bundle | undefined>;
    bouquetSettings: import("@preact/signals-core").Signal<readonly {
        chainId: bigint;
        networkName: string;
        relayMode: "relay" | "mempool";
        mempoolSubmitRpcEndpoint: string | undefined;
        mempoolSimulationRpcEndpoint: string | undefined;
        blocksInFuture: bigint;
        priorityFee: bigint;
        blockExplorerApi: string | undefined;
        blockExplorer: string | undefined;
        simulationRelayEndpoint: string | undefined;
        submissionRelayEndpoint: string | undefined;
    }[]>;
    signers: import("@preact/signals-core").Signal<Signers>;
    fundingAmountMin: import("@preact/signals-core").ReadonlySignal<bigint>;
};
//# sourceMappingURL=stores.d.ts.map