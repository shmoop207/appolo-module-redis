import redis = require("ioredis");


export interface IScript {
    name: string,
    path?: string
    lua?: string
    args?: number
}

export interface IOptions {
    id?: string;
    connection?: string
    fallbackConnections?: string[]
    clusterConnections?: string[]
    opts?: redis.RedisOptions
    scripts?: IScript[]
    connectTimeout?: number,
    connectOnError?: boolean
    logErrors?: boolean
}
