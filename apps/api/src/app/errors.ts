// The web translates `errors.<code>` with `values`, the message stays for the CLI and the logs
export const coded = (code: string, message: string, values?: Record<string, unknown>) => ({ code, message, ...(values ? { values } : {}) })
