"use strict";
import {define, factory, IFactory, inject, singleton} from '@appolo/inject'
import {IOptions} from "../IOptions";
import * as url from "url";
import {Objects} from "@appolo/utils";
import {default as Redis, RedisOptions} from "ioredis";
import {ScriptsManager} from "./scriptsManager";

@define()
@singleton()
@factory()
export class RedisClients implements IFactory<Redis[]> {

    @inject() protected moduleOptions: IOptions;
    @inject() protected scriptsManager: ScriptsManager;

    private readonly Defaults = {enableReadyCheck: true, lazyConnect: true, keepAlive: 1000};

    public async get(): Promise<Redis[]> {
        let fallback = this.moduleOptions.fallbackConnections;

        let connections = [this.moduleOptions.connection]
            .concat(fallback && Array.isArray(fallback) ? fallback : []);

        let clients = await Promise.all(connections.map(conn => this.create(conn)))

        await this.scriptsManager.load(clients);

        return clients
    }

    public async create(connection: string): Promise<Redis> {

        try {

            let conn = new URL(connection);

            let opts:RedisOptions = Objects.defaults({},this.moduleOptions.opts || {}, this.Defaults);
            opts.lazyConnect = true;
            if (conn.protocol == "rediss:") {
                (opts as any).tls = true;
            }

            opts.host = conn.hostname;
            opts.port = parseInt(conn.port);
            opts.password = conn.password;

            let redis = new Redis(opts);

            await redis.connect();

            return redis;
        } catch (e) {
            throw e
        }


    }

}
