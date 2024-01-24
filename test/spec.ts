import {App, createApp} from '@appolo/engine'
import {RedisModule} from "../index";
import {RedisProvider} from "../module/src/redisProvider";
import {Promises, Util} from "@appolo/utils";
import chai = require('chai');
import sinonChai = require("sinon-chai");
import show = Mocha.reporters.Base.cursor.show;

require('chai').should();
chai.use(sinonChai);

const should = chai.should();


let app: App;
let redisProvider: RedisProvider;

describe("redis module Spec", function () {

    if (!process.env.REDIS) {
        throw new Error(`please define process.env.REDIS`)
    }

    beforeEach(async () => {

        app = createApp({root: __dirname, environment: "production"});

        await app.module.use(RedisModule.for({
            connection: process.env.REDIS,
            fallbackConnections: [process.env.REDIS]
        }));

        await app.launch();

        redisProvider = app.injector.get<RedisProvider>("redisProvider");
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

    it("should get and delete redis", async () => {
        await redisProvider.set("redis_test", {test: 1});

        const result = await redisProvider.getAndDel<{ test: 1 }>("redis_test");

        result.test.should.be.eq(1);

        let result2 = await redisProvider.get<{ test: 1 }>("redis_test");

        should.not.exist(result2)


    });

    it("should load cache expire lua", async () => {
        await redisProvider.setWithExpire("redis_test", 1, 10000);

        const result = await redisProvider.getByExpire("redis_test", 2);

        result.value.should.be.eq(1);
        result.validExpire.should.be.ok;
    });

    it('should get hash keys and values', async () => {
        await redisProvider.setHash('h1', 'k1', {v: 1});
        await redisProvider.setHash('h1', 'k2', {v: 2});

        const result = await redisProvider.scanHash('h1');
        result.should.deep.equal({'k1': {v: 1}, 'k2': {v: 2}});
    });

    it('should get hash values only', async () => {
        await redisProvider.setHash('h1', 'k1', {v: 1});
        await redisProvider.setHash('h1', 'k2', {v: 2});

        const result = await redisProvider.scanHashValues('h1');
        result.should.deep.equal([{"v": 1}, {"v": 2}]);
    });

    it("should increment expire", async () => {

        await redisProvider.incrementExpire("redis_inc", 10, 2);
        let inc = await redisProvider.incrementExpire("redis_inc", 10, 3);

        inc.should.be.eq(5);

        let result = await redisProvider.get("redis_inc");

        result.should.be.eq(5);

    })

    it("should lock", async () => {

        let lock = await redisProvider.lock("redis_lock", 10);
        let lock2 = await redisProvider.lock("redis_lock", 10);

        lock.should.not.be.ok;
        lock2.should.be.ok
    });

    it("should wait for lock", async () => {

        await redisProvider.waitForLock({key: "redis_lock_wait", ttl: 10000});
        let [err] = await Promises.to(redisProvider.waitForLock({key: "redis_lock_wait", ttl: 50, retryCount: 1}));

        err.should.be.ok;
        err.message.should.be.eq("failed to get lock")

    });


    it('should del by pattern', async () => {
        await redisProvider.set('haa1', {v: 1});
        await redisProvider.set('haa2', {v: 2});

        let results = await redisProvider.scan('haa*');

        results.length.should.be.eq(2);

        await redisProvider.delPattern('haa*');

        results = await redisProvider.scan('haa*');

        results.length.should.be.eq(0)
    });

    it('should scan values pattern', async () => {
        await redisProvider.set('haa1', {v: 1});
        await redisProvider.set('haa2', {v: 2});

        let results = await redisProvider.scanValues('haa*');

        results.should.be.deep.equal([{v: 2}, {v: 1}]);

    });

    it('should scan keys values pattern', async () => {
        await redisProvider.set('haa1', {v: 1});
        await redisProvider.set('haa2', {v: 2});

        let results = await redisProvider.scanKeysValues('haa*');

        results.should.be.deep.equal({haa1: {v: 1}, haa2: {v: 2}});

    });

    it("should load cache expire lua with fallback", async () => {

        let test = await redisProvider.redis.quit();

        await Util.promises.delay(100);

        await redisProvider.setWithExpire("redis_test", 1, 10000);

        const result = await redisProvider.getByExpire("redis_test", 2);

        result.value.should.be.eq(1);
        result.validExpire.should.be.ok;
    });

    it("should exist in set", async () => {


        await redisProvider.addToSet("redis_test_set", "aaa", "bbb", "ccc");

        let result = await redisProvider.isExistsInSet({
            key: "redis_test_set",
            value: "asdfghjklbbbqwert",
            isPartial: true,
            partialMinLen: 3
        });

        result.should.be.ok;

        await redisProvider.removeFromSet("redis_test_set", "bbb");

        result = await redisProvider.isExistsInSet({
            key: "redis_test_set",
            value: "asdfghjklbbbqwert",
            isPartial: true,
            partialMinLen: 3
        });

        result.should.not.be.ok;

        result = await redisProvider.isExistsInSet({key: "redis_test_set", value: "aaa"});

        result.should.be.ok;

        await redisProvider.del("redis_test_set");


    });


});

describe("redis module connection error", function () {

    if (!process.env.REDIS) {
        throw new Error(`please define process.env.REDIS`)
    }

    beforeEach(async () => {

        app = createApp({root: __dirname, environment: "production"});

        await app.module.use(RedisModule.for({
            connection: process.env.REDIS.replace("13836", "13838"),
            connectOnError: true,
            logErrors: true,
            fallbackConnections: []
        }));

        await app.launch();

        redisProvider = app.injector.get<RedisProvider>("redisProvider");
    });

    afterEach(async () => {
        await app.reset();
    });


    it("should reconnect on error", async () => {

        try {
            await Promises.timeout(redisProvider.get("redis_test_set"), 1000);

        } catch (e) {
            e.message.should.contain("timeout")
        }


    });
});


