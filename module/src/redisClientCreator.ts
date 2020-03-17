"use strict";
import {define, factory, IFactory, inject, singleton} from 'appolo'
import {IOptions} from "../IOptions";
import * as url from "url";
import {Objects} from "appolo-utils";
import Redis = require("ioredis");

@define()
@singleton()
export class RedisClientCreator {

    @inject() protected moduleOptions: IOptions;

    private readonly Defaults = {enableReadyCheck: true, lazyConnect: true, keepAlive: 1000};


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
