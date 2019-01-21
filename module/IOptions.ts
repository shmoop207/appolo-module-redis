import {IModuleOptions} from 'appolo';
import redis = require("ioredis");


export interface IScript {
    name: string,
    path?: string
    lua?: string
    args?: number
}

export interface IOptions extends IModuleOptions {
    id?: string;
    connection: string
    opts?: redis.RedisOptions
    exportProvider?: boolean
    providerId?: string
    scripts?: IScript[]
}