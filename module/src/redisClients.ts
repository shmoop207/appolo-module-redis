"use strict";
import {define, factory, IFactory, inject, singleton} from '@appolo/inject'
import {IOptions} from "../IOptions";
import * as url from "url";
import {Objects} from "@appolo/utils";
import Redis = require("ioredis");
import {ScriptsManager} from "./scriptsManager";

@define()
@singleton()
@factory()
export class RedisClients implements IFactory<Redis.Redis[]> {

    @inject() protected moduleOptions: IOptions;
    @inject() protected scriptsManager: ScriptsManager;

    private readonly Defaults = {enableReadyCheck: true, lazyConnect: true, keepAlive: 1000};

    public async get(): Promise<Redis.Redis[]> {
        let fallback = this.moduleOptions.fallbackConnections;

        let connections = [this.moduleOptions.connection]
            .concat(fallback && Array.isArray(fallback) ? fallback : []);

        let clients = await Promise.all(connections.map(conn => this.create(conn)))

        await this.scriptsManager.load(clients);

        return clients
    }

    public async create(connection: string): Promise<Redis.Redis> {

        try {

            let urlParams = url.parse(connection);

            let opts = Objects.defaults(this.moduleOptions.opts || {}, this.Defaults);
            opts.lazyConnect = true;

            if (urlParams.protocol == "rediss:") {
                (opts as any).tls = true;
            }

            let redis = new Redis(this.moduleOptions.connection, opts);

            await redis.connect();

            return redis;
        } catch (e) {
            throw e
        }


    }

}
