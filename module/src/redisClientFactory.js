"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("appolo/index");
let RedisClientFactory = class RedisClientFactory {
    constructor() {
        this._clients = [];
    }
    async initialize() {
        let fallback = this.moduleOptions.fallbackConnections;
        let connections = [this.moduleOptions.connection]
            .concat(fallback && Array.isArray(fallback) ? fallback : []);
        await Promise.all(connections.map(conn => this._createConnection(conn)));
    }
    async _createConnection(connection) {
        let client = await this.redisClientCreator.create(connection);
        this._clients.push(client);
    }
    getClient() {
        let client = this._clients[0];
        for (let i = 0; i < this._clients.length; i++) {
            if (this._clients[i].status === "ready") {
                return this._clients[i];
            }
        }
        return client;
    }
    defineCommand(script, lua) {
        for (let i = 0; i < this._clients.length; i++) {
            let client = this._clients[i];
            if (client[script.name]) {
                continue;
            }
            client.defineCommand(script.name, {
                numberOfKeys: script.args,
                lua: lua
            });
        }
    }
};
tslib_1.__decorate([
    index_1.inject()
], RedisClientFactory.prototype, "moduleOptions", void 0);
tslib_1.__decorate([
    index_1.inject()
], RedisClientFactory.prototype, "redisClientCreator", void 0);
RedisClientFactory = tslib_1.__decorate([
    index_1.define(),
    index_1.singleton()
], RedisClientFactory);
exports.RedisClientFactory = RedisClientFactory;
//# sourceMappingURL=redisClientFactory.js.map