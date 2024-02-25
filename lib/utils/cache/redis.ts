import { config } from '@/config';
import Redis from 'ioredis';
import logger from '@/utils/logger';
import type CacheModule from './base';

let redisClient: Redis | undefined;

const status = { available: false };

const getCacheTtlKey = (key: string) => {
    if (key.startsWith('rsshub:cacheTtl:')) {
        throw new Error('"rsshub:cacheTtl:" prefix is reserved for the internal usage, please change your cache key'); // blocking any attempt to get/set the cacheTtl
    }
    return `rsshub:cacheTtl:${key}`;
};

export default {
    init: () => {
        redisClient = new Redis(config.redis.url);

        const status = { available: false };

        redisClient.on('error', (error) => {
            status.available = false;
            logger.error('Redis error: ', error);
        });
        redisClient.on('end', () => {
            status.available = false;
        });
        redisClient.on('connect', () => {
            status.available = true;
            logger.info('Redis connected.');
        });
    },
    get: async (key: string, refresh = true) => {
        if (key && status.available && redisClient) {
            const cacheTtlKey = getCacheTtlKey(key);
            let [value, cacheTtl] = await redisClient.mget(key, cacheTtlKey);
            if (value && refresh) {
                if (cacheTtl) {
                    redisClient.expire(cacheTtlKey, cacheTtl);
                } else {
                    // if cacheTtl is not set, that means the cache expire time is contentExpire
                    cacheTtl = config.cache.contentExpire + '';
                    // dont save cacheTtl to Redis, as it is the default value
                    // redisClient.set(cacheTtlKey, cacheTtl, 'EX', cacheTtl);
                }
                redisClient.expire(key, cacheTtl);
                value = value + '';
            }
            return value;
        }
    },
    set: (key: string, value?: string | Record<string, any>, maxAge = config.cache.contentExpire) => {
        if (!status.available || !redisClient) {
            return;
        }
        if (!value || value === 'undefined') {
            value = '';
        }
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        if (key) {
            if (maxAge !== config.cache.contentExpire) {
                // Only set cacheTtlKey if maxAge !== contentExpire
                redisClient.set(getCacheTtlKey(key), maxAge, 'EX', maxAge);
            }
            return redisClient.set(key, value, 'EX', maxAge); // setMode: https://redis.io/commands/set
        }
    },
    clients: { redisClient },
    status,
} as CacheModule;
