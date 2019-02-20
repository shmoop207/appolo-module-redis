"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = require("lodash");
const Q = require("bluebird");
const appolo_1 = require("appolo");
let RedisProvider = class RedisProvider {
    get redis() {
        return this.redisClient;
    }
    async get(key) {
        let result = await this.redisClient.get(key);
        if (_.isNull(result)) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async set(key, value) {
        await this.redisClient.set(key, JSON.stringify(value));
        return value;
    }
    async getAllHash(key) {
        let results = await this.redisClient.hgetall(key);
        let output = {};
        let keys = Object.keys(results || {});
        for (let i = 0, len = keys.length; i < len; i++) {
            output[keys[i]] = JSON.parse(results[keys[i]]);
        }
        return output;
    }
    async getHashKeys(key) {
        let results = await this.redisClient.hkeys(key);
        return results || [];
    }
    async getHashValues(key) {
        let output = [];
        let results = await this.redisClient.hvals(key);
        for (let i = 0, len = (results ? results.length : 0); i < len; i++) {
            output.push(JSON.parse(results[i]));
        }
        return output;
    }
    async getByExpire(key, expire) {
        let result = await this.runScript("get_by_expire", [key], [expire]);
        result = result ? { value: JSON.parse(result[0]), validExpire: result[1] == 1 } : null;
        return result;
    }
    async setHash(hashMap, key, value) {
        await this.redisClient.hset(hashMap, key, JSON.stringify(value));
        return value;
    }
    async getHash(hashMap, key) {
        let result = await this.redisClient.hget(hashMap, key);
        if (_.isNull(result)) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async delHash(hashMap, ...keys) {
        await this.redisClient.hdel(hashMap, ...keys);
    }
    async del(...keys) {
        await this.redisClient.del(...keys);
    }
    async delPattern(pattern) {
        let keys = await this.scan(pattern);
        await Q.map(_.chunk(keys, 100), chunk => this.del(...chunk), { concurrency: 1 });
    }
    async setWithExpire(key, value, seconds) {
        await this.redisClient.setex(key, seconds, JSON.stringify(value));
        return value;
    }
    async expire(key, seconds) {
        await this.redisClient.expire(key, seconds);
    }
    async scan(pattern, cursor = 0, accumulativeResults = []) {
        const [nextCursor, currentResults] = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
        accumulativeResults = [...accumulativeResults, ...currentResults];
        if (nextCursor !== '0') {
            return this.scan(pattern, parseInt(nextCursor), accumulativeResults);
        }
        return accumulativeResults;
    }
    async scanHash(key, pattern = '*', count = 1000) {
        const keysAndValues = await this.scanHashRecursive(key, pattern, count, 0, []);
        const output = {};
        // the result array of hscan is [key1, value1, key2, value2, ...]
        for (let i = 0, len = keysAndValues.length; i < len; i += 2) {
            output[keysAndValues[i]] = JSON.parse(keysAndValues[i + 1]);
        }
        return output;
    }
    async scanHashValues(key, pattern = '*', count = 1000) {
        const keysAndValues = await this.scanHashRecursive(key, pattern, count, 0, []);
        const output = [];
        // the result array of hscan is [key1, value1, key2, value2, ...] so if we want only values we need to filter the keys
        for (let i = 1, len = keysAndValues.length; i < len; i += 2) {
            output.push(JSON.parse(keysAndValues[i]));
        }
        return output;
    }
    async scanHashRecursive(key, pattern, count, cursor, accumulativeResults) {
        const [nextCursor, currentResults] = await this.redisClient.hscan(key, cursor, 'MATCH', pattern, 'COUNT', count.toString());
        accumulativeResults = [...accumulativeResults, ...currentResults];
        if (nextCursor !== '0') {
            return this.scanHashRecursive(key, pattern, count, nextCursor, accumulativeResults);
        }
        return accumulativeResults;
    }
    async ttl(key) {
        return this.redisClient.ttl(key);
    }
    async increment(key, count = 1) {
        await this.redisClient.incrby(key, count);
    }
    async incrementExpire(key, seconds, count = 1) {
        let multi = this.redisClient.multi();
        multi.incrby(key, count);
        multi.expire(key, seconds);
        await multi.exec();
    }
    async lock(key, seconds, updateLockTime = false) {
        let result = await this.runScript("lock", [key], [seconds, updateLockTime], false);
        return !!result;
    }
    async unlock(key) {
        let result = await this.del(key);
    }
    async runScript(name, keys, values, parse = true) {
        if (!this.redisClient[name]) {
            throw new Error(`failed to find script ${name}`);
        }
        let value = await this.redisClient[name](...keys, ...values);
        if (_.isNull(value)) {
            return null;
        }
        value = (parse && _.isString(value)) ? JSON.parse(value) : value;
        return value;
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], RedisProvider.prototype, "redisClient", void 0);
RedisProvider = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton()
], RedisProvider);
exports.RedisProvider = RedisProvider;
//# sourceMappingURL=redisProvider.js.map