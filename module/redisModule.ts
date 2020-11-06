import {module, Module,IModuleParams} from "@appolo/engine";
import {IOptions} from "./IOptions";
import {RedisProvider} from "./src/redisProvider";

@module()
export class RedisModule extends Module<IOptions> {



    protected readonly Defaults: Partial<IOptions> = {id: "redisProvider"};

    public get exports() {
        return [{id: this.moduleOptions.id, type: RedisProvider}];
    }

    public static for(options?: IOptions): IModuleParams {
        return {type:RedisModule,options};
    }

}
