import http from 'node:http';
import https from 'node:https';
import logger from '@/utils/logger';
import { config } from '@/config';
import proxy from '@/utils/proxy';

type Get = typeof http.get | typeof https.get | typeof http.request | typeof https.request;

const getWrappedGet: <T extends Get>(origin: T) => T = (origin) =>
    function (this: any, ...args: Parameters<typeof origin>) {
        let url: URL;
        let options: http.RequestOptions = {};
        let callback: ((res: http.IncomingMessage) => void) | undefined;
        if (typeof args[0] === 'string' || args[0] instanceof URL) {
            url = new URL(args[0]);
            if (typeof args[1] === 'object') {
                options = args[1];
                callback = args[2];
            } else if (typeof args[1] === 'function') {
                options = {};
                callback = args[1];
            }
        } else {
            options = args[0];
            url = new URL(options.href || `${options.protocol}//${options.hostname || options.host}${options.path}${options.search || (options.query ? `?${options.query}` : '')}`);
            if (typeof args[1] === 'function') {
                callback = args[1];
            }
        }

        logger.debug(`Outgoing request: ${options.method || 'GET'} ${url}`);

        options.headers = options.headers || {};
        const headersLowerCaseKeys = new Set(Object.keys(options.headers).map((key) => key.toLowerCase()));

        // ua
        if (!headersLowerCaseKeys.has('user-agent')) {
            options.headers['user-agent'] = config.ua;
        }

        // Accept
        if (!headersLowerCaseKeys.has('accept')) {
            options.headers.accept = '*/*';
        }

        // referer
        if (!headersLowerCaseKeys.has('referer')) {
            options.headers.referer = url.origin;
        }

        // proxy
        if (!options.agent && proxy.agent) {
            const proxyRegex = new RegExp(proxy.proxyObj.url_regex);

            if (proxyRegex.test(url.toString()) && url.protocol.startsWith('http') && url.host !== proxy.proxyUrlHandler?.host) {
                options.agent = proxy.agent;
                if (proxy.proxyObj.auth) {
                    options.headers['Proxy-Authorization'] = `Basic ${proxy.proxyObj.auth}`;
                }
            }
        }

        return Reflect.apply(origin, this, [url, options, callback]) as ReturnType<typeof origin>;
    };

export default getWrappedGet;
