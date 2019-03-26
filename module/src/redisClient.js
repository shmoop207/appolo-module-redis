"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const appolo_1 = require("appolo");
const _ = require("lodash");
const url = require("url");
const Redis = require("ioredis");
let RedisClient = class RedisClient {
    constructor() {
        this.Defaults = { enableReadyCheck: true, lazyConnect: true, keepAlive: 1000 };
    }
    async get() {
        try {
            let urlParams = url.parse(this.moduleOptions.connection);
            let opts = _.defaults(this.moduleOptions.opts || {}, this.Defaults);
            opts.lazyConnect = true;
            if (urlParams.protocol == "rediss:") {
                opts.tls = true;
            }
            let redis = new Redis(this.moduleOptions.connection, opts);
            await redis.connect();
            return redis;
        }
        catch (e) {
            throw e;
        }
    }
};
tslib_1.__decorate([
    appolo_1.inject()
], RedisClient.prototype, "moduleOptions", void 0);
RedisClient = tslib_1.__decorate([
    appolo_1.define(),
    appolo_1.singleton(),
    appolo_1.factory()
], RedisClient);
exports.RedisClient = RedisClient;
//# sourceMappingURL=redisClient.js.map