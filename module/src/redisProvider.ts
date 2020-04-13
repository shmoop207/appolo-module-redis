import    _ = require('lodash');
import Redis = require("ioredis");
import Q = require("bluebird");
import {define, inject, singleton} from 'appolo'
import {RedisClientFactory} from "./redisClientFactory";

@define()
@singleton()
export class RedisProvider {
    @inject() protected redisClientFactory: RedisClientFactory;

    public get redis(): Redis.Redis {
        return this.redisClientFactory.getClient();
    }

    public async get<T>(key: string): Promise<T> {

        let result = await this.redis.get(key);

        if (_.isNull(result)) {
            return null;
        }

        let value = JSON.parse(result);

        return value;
    }

    public async multiGet<T>(keys: string[]): Promise<T[]> {

        let output: T[] = [];

        let results = await this.redisClientFactory.getClient().mget(...keys);

        for (let i = 0, len = (results ? results.length : 0); i < len; i++) {
            output.push(JSON.parse(results[i]));
        }

        return output;
    }

    public async set<T>(key: string, value: T): Promise<T> {

        await this.redis.set(key, JSON.stringify(value));
        return value
    }

    public async getAllHash<T>(key: string): Promise<{ [index: string]: T }> {

        let results = await this.redis.hgetall(key);

        let output: { [index: string]: T } = {};

        let keys = Object.keys(results || {});

        for (let i = 0, len = keys.length; i < len; i++) {
            output[keys[i]] = JSON.parse(results[keys[i]])
        }

        return output;
    }

    public async getHashKeys<T>(key: string): Promise<string[]> {

        let results = await this.redis.hkeys(key);

        return results || [];
    }

    public async getHashValues<T>(key: string): Promise<T[]> {

        let output: T[] = [];

        let results = await this.redis.hvals(key);

        for (let i = 0, len = (results ? results.length : 0); i < len; i++) {
            output.push(JSON.parse(results[i]));
        }

        return output;
    }

    public async getByExpire<T>(key: string, expire: number): Promise<{ value: T, validExpire: boolean }> {

        let result = await this.runScript<any>("get_by_expire", [key], [expire]);

        result = result ? {value: JSON.parse(result[0]), validExpire: result[1] == 1} : null;

        return result;

    }

    public async setHash<T>(hashMap: string, key: string, value: T): Promise<T> {

        await this.redis.hset(hashMap, key, JSON.stringify(value));
        return value

    }

    public async getHash<T>(hashMap: string, key: string): Promise<T> {

        let result = await this.redis.hget(hashMap, key);

        if (_.isNull(result)) {
            return null;
        }

        let value = JSON.parse(result);

        return value;
    }

    public async getMultiHash<T>(hKey: string, keys: string[]): Promise<T[]> {

        let values = await this.redis.hmget(hKey, ...keys);

        return _.map<string, T>(values, value => JSON.parse(value));
    }

    public async setMultiHash<T>(hKey: string, keys: string[], values: T[]): Promise<void> {

        let data = _.flatten(_.zip(keys, _.map(values, value => JSON.stringify(value))));

        if (data.length) {
            await this.redis.hmset(hKey, ...data);
        }
    }

    public async delHash(hashMap: string, ...keys: string[]): Promise<void> {

        await this.redis.hdel(hashMap, ...keys)
    }

    public async del(...keys: string[]): Promise<void> {

        await this.redis.del(...keys);
    }

    public async delPattern(pattern: string): Promise<void> {

        let keys = await this.scan(pattern);

        await Q.map(_.chunk(keys, 100), chunk => this.del(...chunk), {concurrency: 1});
    }

    public async setWithExpire<T>(key: string, value: T, seconds: number): Promise<T> {

        await this.redis.setex(key, seconds, JSON.stringify(value));
        return value;

    }

    public async expire(key: string, seconds: number): Promise<void> {

        await this.redis.expire(key, seconds);
    }

    public async scan(pattern: string = '*', count: number = 1000): Promise<string[]> {

        const keys = await this._scanRecursive(pattern, count, 0, []);

        return keys;
    }

    public async scanValues<T>(pattern: string = '*', count: number = 1000): Promise<T[]> {

        const keys = await this._scanRecursive(pattern, count, 0, []);

        let results = await Q.map(keys, key => this.get<T>(key), {concurrency: count});

        return results;
    }

    private async _scanRecursive(pattern: string, count: number, cursor: number, accumulativeResults: string[]): Promise<string[]> {

        const [nextCursor, currentResults] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', count);

        accumulativeResults = [...accumulativeResults, ...currentResults];

        if (nextCursor !== '0') {
            return this._scanRecursive(pattern, count, parseInt(nextCursor), accumulativeResults);
        }

        return accumulativeResults;
    }

    public async scanHash<T>(key: string, pattern: string = '*', count: number = 1000): Promise<{ [index: string]: T }> {
        const keysAndValues = await this._scanHashRecursive(key, pattern, count, 0, []);

        const output: { [index: string]: T } = {};

        // the result array of hscan is [key1, value1, key2, value2, ...]
        for (let i = 0, len = keysAndValues.length; i < len; i += 2) {
            output[keysAndValues[i]] = JSON.parse(keysAndValues[i + 1]);
        }

        return output;
    }

    public async scanHashValues<T>(key: string, pattern: string = '*', count: number = 1000): Promise<T[]> {
        const keysAndValues = await this._scanHashRecursive(key, pattern, count, 0, []);

        const output = [];

        // the result array of hscan is [key1, value1, key2, value2, ...] so if we want only values we need to filter the keys
        for (let i = 1, len = keysAndValues.length; i < len; i += 2) {
            output.push(JSON.parse(keysAndValues[i]));
        }

        return output;
    }

    private async _scanHashRecursive(key: string, pattern: string, count: number, cursor: number | string, accumulativeResults: string[]) {

        const [nextCursor, currentResults] = await this.redis.hscan(key, cursor as number, 'MATCH', pattern, 'COUNT', count.toString());

        accumulativeResults = [...accumulativeResults, ...currentResults];

        if (nextCursor !== '0') {
            return this._scanHashRecursive(key, pattern, count, nextCursor, accumulativeResults);
        }

        return accumulativeResults;
    }

    public async ttl(key: string): Promise<number> {

        return this.redis.ttl(key);
    }

    public async increment(key: string, count: number = 1): Promise<void> {

        await this.redis.incrby(key, count);
    }

    public async incrementExpire(key: string, seconds: number, count: number = 1): Promise<void> {

        let multi = this.redis.multi();
        multi.incrby(key, count);
        multi.expire(key, seconds);

        await multi.exec();

    }


    public async lock(key: string, seconds: number, updateLockTime: boolean = false): Promise<boolean> {
        let result = await this.runScript<number>("lock", [key], [seconds, updateLockTime], false);

        return !!result;
    }

    public async unlock(key: string): Promise<void> {
        let result = await this.del(key);
    }


    public async runScript<T>(name: string, keys: string[], values: any[], parse: boolean = true): Promise<T> {


        if (!this.redis[name]) {
            throw new Error(`failed to find script ${name}`)
        }

        let value = await this.redis[name](...keys, ...values);

        if (_.isNull(value)) {
            return null;
        }

        value = (parse && _.isString(value)) ? JSON.parse(value) : value;

        return value;
    }

}
