export function proxyDurable(durable: any, middlewareOptions?: {}): {
    get: (id: any, options?: {}) => any;
};
