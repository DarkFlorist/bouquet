export type ImportPayload = {
  transactions: { from: string, to: string, data: string, value: string }[]
}

export function isImportPayload(obj: any) {
  try {
    const data = obj as ImportPayload
    if (!('transactions' in data)) return false
    let failed = data.transactions.filter(x =>
      !('from' in x && typeof x.from === 'string' && 'to' in x && typeof x.to === 'string' && 'data' in x && typeof x.data === 'string' && 'value' in x && typeof x.value === 'string')
    )
    return failed.length === 0
  } catch (error) {
    console.log("Type error", error)
    return false;
  }
}
