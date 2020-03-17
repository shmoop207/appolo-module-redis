"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appolo_1 = require("appolo");
const index_1 = require("../index");
const chai = require("chai");
const sinonChai = require("sinon-chai");
require('chai').should();
chai.use(sinonChai);
let app;
let redisProvider;
describe("redis module Spec", function () {
    if (!process.env.REDIS) {
        throw new Error(`please define process.env.REDIS`);
    }
    beforeEach(async () => {
        app = appolo_1.createApp({ root: __dirname, environment: "production", port: 8181 });
        await app.module(new index_1.RedisModule({ connection: process.env.REDIS, fallbackConnections: [process.env.REDIS] }));
        await app.launch();
        redisProvider = app.injector.get("redisProvider");
    });
    afterEach(async () => {
        await app.reset();
    });
    it("should load redis", async () => {
        await redisProvider.set("redis_test", 1);
        const result = await redisProvider.get("redis_test");
        result.should.be.eq(1);
        redisProvider.redis.set.should.be.ok;
    });
    it("should load cache expire lua", async () => {
        await redisProvider.setWithExpire("redis_test", 1, 10000);
        const result = await redisProvider.getByExpire("redis_test", 2);
        result.value.should.be.eq(1);
        result.validExpire.should.be.ok;
    });
    it('should get hash keys and values', async () => {
        await redisProvider.setHash('h1', 'k1', { v: 1 });
        await redisProvider.setHash('h1', 'k2', { v: 2 });
        const result = await redisProvider.scanHash('h1');
        result.should.deep.equal({ 'k1': { v: 1 }, 'k2': { v: 2 } });
    });
    it('should get hash values only', async () => {
        await redisProvider.setHash('h1', 'k1', { v: 1 });
        await redisProvider.setHash('h1', 'k2', { v: 2 });
        const result = await redisProvider.scanHashValues('h1');
        result.should.deep.equal([{ "v": 1 }, { "v": 2 }]);
    });
    it("should increment expire", async () => {
        await redisProvider.incrementExpire("redis_inc", 10, 2);
        await redisProvider.incrementExpire("redis_inc", 10, 3);
        let result = await redisProvider.get("redis_inc");
        result.should.be.eq(5);
    });
    it("should lock", async () => {
        let lock = await redisProvider.lock("redis_lock", 10);
        let lock2 = await redisProvider.lock("redis_lock", 10);
        lock.should.not.be.ok;
        lock2.should.be.ok;
    });
    it('should del by pattern', async () => {
        await redisProvider.set('haa1', { v: 1 });
        await redisProvider.set('haa2', { v: 2 });
        let results = await redisProvider.scan('haa*');
        results.length.should.be.eq(2);
        await redisProvider.delPattern('haa*');
        results = await redisProvider.scan('haa*');
        results.length.should.be.eq(0);
    });
    it("should load cache expire lua with fallback", async () => {
        let test = await redisProvider.redis.quit();
        await appolo_1.Util.delay(100);
        await redisProvider.setWithExpire("redis_test", 1, 10000);
        const result = await redisProvider.getByExpire("redis_test", 2);
        result.value.should.be.eq(1);
        result.validExpire.should.be.ok;
    });
});
//# sourceMappingURL=spec.js.map