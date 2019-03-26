"use strict";
import {define, factory, IFactory, inject, singleton} from 'appolo'
import {IOptions} from "../IOptions";
import * as _ from "lodash";
import * as url from "url";
import Redis = require("ioredis");

@define()
@singleton()
@factory()
export class RedisClient implements IFactory<Redis.Redis> {

    @inject() protected moduleOptions: IOptions;

    private readonly Defaults = {enableReadyCheck: true, lazyConnect: true, keepAlive: 1000};


    public async get(): Promise<Redis.Redis> {

        try {

            let urlParams = url.parse(this.moduleOptions.connection)

            let opts = _.defaults(this.moduleOptions.opts || {}, this.Defaults);
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
