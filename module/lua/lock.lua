local hash = KEYS[1]
local expire = tonumber(ARGV[1])
local update = ARGV[2]

local value = redis.call('GET', hash)


if (value) then
    if(update) then
        redis.call('PEXPIRE', hash, expire)
    end
    return 1
else
    redis.call('SET', hash, 1)
    redis.call('PEXPIRE', hash, expire)
    return 0
end



