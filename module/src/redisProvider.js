"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _ = require("lodash");
const Q = require("bluebird");
const appolo_1 = require("appolo");
let RedisProvider = class RedisProvider {
    get redis() {
        return this.redisClientFactory.getClient();
    }
    async get(key) {
        let result = await this.redis.get(key);
        if (_.isNull(result)) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async multiGet(keys) {
        let output = [];
        let results = await this.redisClientFactory.getClient().mget(...keys);
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
    async getByExpire(key, expire) {
        let result = await this.runScript("get_by_expire", [key], [expire]);
        result = result ? { value: JSON.parse(result[0]), validExpire: result[1] == 1 } : null;
        return result;
    }
    async setHash(hashMap, key, value) {
        await this.redis.hset(hashMap, key, JSON.stringify(value));
        return value;
    }
    async getHash(hashMap, key) {
        let result = await this.redis.hget(hashMap, key);
        if (_.isNull(result)) {
            return null;
        }
        let value = JSON.parse(result);
        return value;
    }
    async getMultiHash(hKey, keys) {
        let values = await this.redis.hmget(hKey, ...keys);
        return _.map(values, value => JSON.parse(value));
    }
    async setMultiHash(hKey, keys, values) {
        let data = _.flatten(_.zip(keys, _.map(values, value => JSON.stringify(value))));
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
    async delPattern(pattern) {
        let keys = await this.scan(pattern);
        await Q.map(_.chunk(keys, 100), chunk => this.del(...chunk), { concurrency: 1 });
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
        let results = await Q.map(keys, key => this.get(key), { concurrency: count });
        return results;
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
        await this.redis.incrby(key, count);
    }
    async incrementExpire(key, seconds, count = 1) {
        let multi = this.redis.multi();
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
        if (!this.redis[name]) {
            throw new Error(`failed to find script ${name}`);
        }
        let value = await this.redis[name](...keys, ...values);
        if (_.isNull(value)) {
            return null;
        }
        value = (parse && _.isString(value)) ? JSON.parse(value) : value;
        return value;
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], RedisProvider.prototype, "redisClientFactory", void 0);
RedisProvider = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton()
], RedisProvider);
exports.RedisProvider = RedisProvider;
//# sourceMappingURL=redisProvider.js.map