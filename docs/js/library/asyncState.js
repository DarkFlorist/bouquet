import { useSignal } from '@preact/signals';
export function useAsyncState() {
    function getCaptureAndCancelOthers() {
        // delete previously captured signal so any pending async work will no-op when they resolve
        delete captureContainer.peek().result;
        // capture the signal in a new object so we can delete it later if it is interrupted
        captureContainer.value = { result };
        return captureContainer.peek();
    }
    async function activate(resolver) {
        const capture = getCaptureAndCancelOthers();
        // we need to read the property out of the capture every time we look at it, in case it is deleted asynchronously
        function setCapturedResult(newResult) {
            const result = capture.result;
            if (result === undefined)
                return;
            result.value = newResult;
        }
        try {
            const pendingState = { state: 'pending' };
            setCapturedResult(pendingState);
            const resolvedValue = await resolver();
            const resolvedState = { state: 'resolved', value: resolvedValue };
            setCapturedResult(resolvedState);
        }
        catch (unknownError) {
            const error = unknownError instanceof Error ? unknownError : typeof unknownError === 'string' ? new Error(unknownError) : new Error(`Unknown error occurred.\n${JSON.stringify(unknownError)}`);
            const rejectedState = { state: 'rejected', error };
            setCapturedResult(rejectedState);
        }
    }
    function reset() {
        const result = getCaptureAndCancelOthers().result;
        if (result === undefined)
            return;
        result.value = { state: 'inactive' };
    }
    const result = useSignal({ state: 'inactive' });
    const captureContainer = useSignal({});
    return { value: result, waitFor: resolver => activate(resolver), reset };
}
//# sourceMappingURL=asyncState.js.map