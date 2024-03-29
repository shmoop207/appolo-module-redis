"use strict";
var RedisProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisProvider = void 0;
const tslib_1 = require("tslib");
const inject_1 = require("@appolo/inject");
const utils_1 = require("@appolo/utils");
let RedisProvider = RedisProvider_1 = class RedisProvider {
    constructor(redisClient) {
        this._redisClient = redisClient;
    }
    get redis() {
        return this._redisClient || this.redisClientFactory.getClient();
    }
    async get(key) {
        let result = await this.redis.get(key);
        if (result === null) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async multiGet(keys) {
        let output = [];
        let results = await this.redis.mget(...keys);
        for (let i = 0, len = (results ? results.length : 0); i < len; i++) {
            output.push(JSON.parse(results[i]));
        }
        return output;
    }
    async set(key, value) {
        await this.redis.set(key, JSON.stringify(value));
        return value;
    }
    async getAllHash(key) {
        let results = await this.redis.hgetall(key);
        let output = {};
        let keys = Object.keys(results || {});
        for (let i = 0, len = keys.length; i < len; i++) {
            output[keys[i]] = JSON.parse(results[keys[i]]);
        }
        return output;
    }
    async getHashKeys(key) {
        let results = await this.redis.hkeys(key);
        return results || [];
    }
    async getHashValues(key) {
        let output = [];
        let results = await this.redis.hvals(key);
        for (let i = 0, len = (results ? results.length : 0); i < len; i++) {
            output.push(JSON.parse(results[i]));
        }
        return output;
    }
    async getByExpire(key, expire, refresh) {
        let result = await this.runScript("get_by_expire", [key], [expire, refresh || (expire / 2)]);
        result = result ? { value: JSON.parse(result[0]), validExpire: result[1] == 1 } : null;
        return result;
    }
    async setHash(hashMap, key, value) {
        await this.redis.hset(hashMap, key, JSON.stringify(value));
        return value;
    }
    async setHashWithExpire(hashMap, key, value, seconds) {
        let multi = this.redis.multi();
        multi.hset(hashMap, key, JSON.stringify(value));
        multi.expire(hashMap, seconds);
        await multi.exec();
        return value;
    }
    async getHash(hashMap, key) {
        let result = await this.redis.hget(hashMap, key);
        if (result === null) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async getMultiHash(hKey, keys) {
        let values = await this.redis.hmget(hKey, ...keys);
        return utils_1.Arrays.map(values, value => JSON.parse(value));
    }
    async setMultiHash(hKey, keys, values) {
        let arr = utils_1.Arrays.map(values, value => JSON.stringify(value));
        let zip = utils_1.Arrays.zip(keys, arr);
        let data = utils_1.Arrays.flat(zip);
        if (data.length) {
            await this.redis.hmset(hKey, ...data);
        }
    }
    async delHash(hashMap, ...keys) {
        await this.redis.hdel(hashMap, ...keys);
    }
    async del(...keys) {
        await this.redis.del(...keys);
    }
    async delPattern(pattern, count = 1000) {
        let keys = await this.scan(pattern, count);
        await utils_1.Promises.map(keys, key => this.del(key), { concurrency: count });
    }
    async setWithExpire(key, value, seconds) {
        await this.redis.setex(key, seconds, JSON.stringify(value));
        return value;
    }
    async expire(key, seconds) {
        await this.redis.expire(key, seconds);
    }
    async scan(pattern = '*', count = 1000) {
        const keys = await this._scanRecursive(pattern, count, 0, []);
        return keys;
    }
    async scanValues(pattern = '*', count = 1000) {
        const keys = await this._scanRecursive(pattern, count, 0, []);
        let results = await utils_1.Promises.map(keys, key => this.get(key), { concurrency: count });
        return results;
    }
    async scanKeysValues(pattern = '*', count = 1000) {
        const keys = await this._scanRecursive(pattern, count, 0, []);
        let dto = {};
        let results = await utils_1.Promises.map(keys, async (key) => {
            let value = await this.get(key);
            dto[key] = value;
        }, { concurrency: count });
        return dto;
    }
    async _scanRecursive(pattern, count, cursor, accumulativeResults) {
        const [nextCursor, currentResults] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);
        accumulativeResults = [...accumulativeResults, ...currentResults];
        if (nextCursor !== '0') {
            return this._scanRecursive(pattern, count, parseInt(nextCursor), accumulativeResults);
        }
        return accumulativeResults;
    }
    async scanHash(key, pattern = '*', count = 1000) {
        const keysAndValues = await this._scanHashRecursive(key, pattern, count, 0, []);
        const output = {};
        // the result array of hscan is [key1, value1, key2, value2, ...]
        for (let i = 0, len = keysAndValues.length; i < len; i += 2) {
            output[keysAndValues[i]] = JSON.parse(keysAndValues[i + 1]);
        }
        return output;
    }
    async scanHashValues(key, pattern = '*', count = 1000) {
        const keysAndValues = await this._scanHashRecursive(key, pattern, count, 0, []);
        const output = [];
        // the result array of hscan is [key1, value1, key2, value2, ...] so if we want only values we need to filter the keys
        for (let i = 1, len = keysAndValues.length; i < len; i += 2) {
            output.push(JSON.parse(keysAndValues[i]));
        }
        return output;
    }
    async _scanHashRecursive(key, pattern, count, cursor, accumulativeResults) {
        const [nextCursor, currentResults] = await this.redis.hscan(key, cursor, 'MATCH', pattern, 'COUNT', count.toString());
        accumulativeResults = [...accumulativeResults, ...currentResults];
        if (nextCursor !== '0') {
            return this._scanHashRecursive(key, pattern, count, nextCursor, accumulativeResults);
        }
        return accumulativeResults;
    }
    async ttl(key) {
        return this.redis.ttl(key);
    }
    async increment(key, count = 1) {
        let result = await this.redis.incrby(key, count);
        return result;
    }
    async incrementExpire(key, seconds, count = 1) {
        let multi = this.redis.multi();
        multi.incrby(key, count);
        multi.expire(key, seconds);
        let result = await multi.exec();
        return result[0][1];
    }
    async getAndDel(key) {
        let multi = this.redis.multi();
        multi.get(key);
        multi.del(key);
        let result = await multi.exec();
        let resultGet = result[0][1];
        if (resultGet === null) {
            return null;
        }
        let value = JSON.parse(resultGet);
        return value;
    }
    async getHashAndDel(hash, key) {
        let multi = this.redis.multi();
        multi.hget(hash, key);
        multi.hdel(hash, key);
        let result = await multi.exec();
        let resultGet = result[0][1];
        if (resultGet === null) {
            return null;
        }
        let value = JSON.parse(resultGet);
        return value;
    }
    async lock(key, seconds, updateLockTime = false) {
        let result = await this.lockMs(key, seconds * 1000, updateLockTime);
        return !!result;
    }
    async lockMs(key, ttl, updateLockTime = false) {
        let values = [ttl];
        if (updateLockTime) {
            values.push(true);
        }
        let result = await this.runScript("lock", [key], values, false);
        return !!result;
    }
    async waitForLock(params) {
        let { key, ttl, retryCount = 10, retryDelay = 1000, retryJitter = 200 } = params;
        let fn = async () => {
            let isLocked = await this.lockMs(key, ttl);
            if (isLocked) {
                throw new Error("failed to get lock");
            }
        };
        await utils_1.Promises.create(fn)
            .retry({ retires: retryCount, linear: retryDelay, random: retryJitter })
            .run();
    }
    async extendLock(key, ttl) {
        let result = await utils_1.Promises.create(() => this.lockMs(key, ttl, true))
            .retry(3)
            .run();
    }
    async isLocked(key) {
        let result = await this.get(key);
        return !!result;
    }
    async unlock(key) {
        await utils_1.Promises.create(() => this.del(key))
            .retry(3)
            .run();
    }
    async listPush(key, value) {
        let length = await this.redis.rpush(key, JSON.stringify(value));
        return length;
    }
    async listPop(key) {
        let result = await this.redis.rpop(key);
        if (result === null) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async listUnshift(key, value) {
        let length = await this.redis.lpush(key, JSON.stringify(value));
        return length;
    }
    async listShift(key) {
        let result = await this.redis.lpop(key);
        if (result === null) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async listRange(key, start = 0, end = 0) {
        let values = await this.redis.lrange(key, start, end);
        return utils_1.Arrays.map(values, value => JSON.parse(value));
    }
    async listTrim(key, start = 0, end = 0) {
        await this.redis.ltrim(key, start, end);
    }
    async listLen(key) {
        let value = await this.redis.llen(key);
        return value;
    }
    async runScript(name, keys, values, parse = true) {
        if (!this.redis[name]) {
            throw new Error(`failed to find script ${name}`);
        }
        let value = await this.redis[name](...keys, ...values);
        if (value === null) {
            return null;
        }
        value = (parse && utils_1.Strings.isString(value)) ? JSON.parse(value) : value;
        return value;
    }
    async addToSet(key, ...value) {
        await this.redis.sadd(key, value);
    }
    async removeFromSet(key, ...value) {
        await this.redis.srem(key, value);
    }
    async isExistsInSet(params) {
        let { key, value, isPartial = false, partialMinLen = 3 } = params;
        let members = isPartial ? utils_1.Strings.partialCombinations({ value, minLen: partialMinLen }) : [value];
        let result = await this.redis.smismember(key, members);
        return (result || []).some(value => value === 1);
    }
    get status() {
        return this.redis.status;
    }
    get isReady() {
        return this.redis.status == "ready";
    }
    get cluster() {
        return {
            hash: (key) => new RedisProvider_1(this.redisClientFactory.getClientHash(key)),
            random: () => new RedisProvider_1(this.redisClientFactory.getClientRandom()),
            all: () => this.redisClientFactory.getAllClients().map(client => new RedisProvider_1(client)),
            ready: () => this.redisClientFactory.getReadyClients().map(client => new RedisProvider_1(client)),
        };
    }
};
tslib_1.__decorate([
    (0, inject_1.inject)()
], RedisProvider.prototype, "redisClientFactory", void 0);
RedisProvider = RedisProvider_1 = tslib_1.__decorate([
    (0, inject_1.define)(),
    (0, inject_1.singleton)()
], RedisProvider);
exports.RedisProvider = RedisProvider;
//# sourceMappingURL=redisProvider.js.map