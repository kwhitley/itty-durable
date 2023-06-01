declare const _exports: {
    proxyDurable: (durable: any, middlewareOptions?: {}) => {
        get: (id: any, options?: {}) => any;
    };
    withDurables: (options?: {}) => (request: any, env: any) => void;
    createDurable: (options?: {}) => {
        new (state?: {}, env?: {}): {
            state: {
                defaultState: any;
                initialized: boolean;
                router: import("itty-router").RouterType<import("itty-router").Route, any[]>;
                env: {};
            };
            destroy(options?: {}): Promise<never>;
            getAlarm(): any;
            setAlarm(expiration: any): any;
            fetch(request: any, ...args: any[]): Promise<any>;
            getPersistable(): Omit<any, "fetch" | "state" | "destroy" | "getAlarm" | "setAlarm" | "getPersistable" | "loadFromStorage" | "onDestroy" | "onLoad" | "optionallyReturnThis" | "persist" | "reset" | "toJSON">;
            loadFromStorage(): Promise<void>;
            onDestroy(): Promise<void>;
            onLoad(): Promise<void>;
            optionallyReturnThis(): Response;
            persist(): Promise<void>;
            reset(): Promise<void>;
            toJSON(): Omit<any, "fetch" | "state" | "destroy" | "getAlarm" | "setAlarm" | "getPersistable" | "loadFromStorage" | "onDestroy" | "onLoad" | "optionallyReturnThis" | "persist" | "reset" | "toJSON">;
        };
    };
};
export = _exports;
