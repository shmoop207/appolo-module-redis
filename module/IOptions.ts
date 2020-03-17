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
    fallbackConnections?: string[]
    opts?: redis.RedisOptions
    scripts?: IScript[]
}
