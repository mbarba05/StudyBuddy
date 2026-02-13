type SupabaseResult<T = any> = { data: T | null; error: any };
type Call = { method: string; args: any[] };

type Builder = {
    __calls: Call[];
    __setResult: (result: SupabaseResult) => Builder;
    __getCalls: () => Call[];
};

function createThenableBuilder(): Builder {
    let nextResult: SupabaseResult = { data: null, error: null };
    const calls: Call[] = [];

    const core: any = {
        __calls: calls,
        __setResult(result: SupabaseResult) {
            nextResult = result;
            return proxy;
        },
        __getCalls() {
            return calls;
        },
        then(onFulfilled: any, onRejected: any) {
            try {
                return Promise.resolve(onFulfilled(nextResult));
            } catch (e) {
                return Promise.resolve(onRejected ? onRejected(e) : e);
            }
        },
    };

    const proxy = new Proxy(core, {
        get(target, prop: string) {
            if (prop in target) return (target as any)[prop];

            (target as any)[prop] = jest.fn((...args: any[]) => {
                calls.push({ method: prop, args });
                return proxy;
            });

            return (target as any)[prop];
        },
    });

    return proxy as Builder;
}

export function createMockSupabaseClient() {
    const fromQueue: SupabaseResult[] = [];
    const rpcQueue: SupabaseResult[] = [];

    const from = jest.fn((_table: string) => {
        const b = createThenableBuilder();
        const next = fromQueue.shift();
        if (next) b.__setResult(next);
        return b;
    });

    const rpc = jest.fn((_fn: string, _args?: any) => {
        const b = createThenableBuilder();
        const next = rpcQueue.shift();
        if (next) b.__setResult(next);
        return b;
    });

    const auth = {
        getUser: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
    };

    return {
        from,
        rpc,
        auth,

        // helpers for tests
        __queueFromResult: (result: SupabaseResult) => fromQueue.push(result),
        __queueRpcResult: (result: SupabaseResult) => rpcQueue.push(result),
    };
}
