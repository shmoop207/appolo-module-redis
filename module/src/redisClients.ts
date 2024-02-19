"use strict";
import {define, factory, IFactory, inject, singleton} from '@appolo/inject'
import {IOptions} from "../IOptions";
import * as url from "url";
import {Objects, Promises} from "@appolo/utils";
import {ILogger} from "@appolo/logger";
import {default as Redis, RedisOptions} from "ioredis";
import {ScriptsManager} from "./scriptsManager";

@define()
@singleton()
@factory()
export class RedisClients implements IFactory<Redis[]> {

    @inject() protected moduleOptions: IOptions;
    @inject() protected logger: ILogger;
    @inject() protected scriptsManager: ScriptsManager;

    private readonly Defaults = {enableReadyCheck: true, lazyConnect: true, keepAlive: 1000};

    public async get(): Promise<Redis[]> {


        let connections: string[] = [];

        if (this.moduleOptions.connection) {
            connections.push(this.moduleOptions.connection);
        }

        if (this.moduleOptions.clusterConnections?.length) {

            connections.push(...this.moduleOptions.clusterConnections)

        } else if (this.moduleOptions.fallbackConnections.length) {

            connections.push(...this.moduleOptions.fallbackConnections)
        }

        let clients = await Promise.all(connections.map(conn => this.create(conn)))

        await this.scriptsManager.load(clients);

        return clients
    }

    public async create(connection: string): Promise<Redis> {
        let redis: Redis;
        try {

            let conn = new URL(connection);

            let opts: RedisOptions = Objects.defaults({}, this.moduleOptions.opts || {}, this.Defaults);
            opts.lazyConnect = true;
            if (conn.protocol == "rediss:") {
                (opts as any).tls = true;
            }

            opts.host = conn.hostname;
            opts.port = parseInt(conn.port);
            opts.password = conn.password;

            redis = new Redis(opts);

            redis.on("error", (e) => {
                this.moduleOptions.logErrors && this.logger.error("redis error", {e, id: this.moduleOptions.id})
            })

            let promise = redis.connect()

            if (this.moduleOptions.connectTimeout) {
                promise = Promises.timeout(promise, this.moduleOptions.connectTimeout)
            }

            await promise

            return redis;
        } catch (e) {

            if (redis && this.moduleOptions.connectOnError) {
                return redis;
            }

            throw e
        }


    }

}
