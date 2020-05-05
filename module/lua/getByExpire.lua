local hash = KEYS[1]
local expire = tonumber(ARGV[1])
local refresh = tonumber(ARGV[2])


local value = redis.call('GET', hash)

if (not value) then
    return nil
end

local ttl = redis.call('TTL', hash)

if (ttl < refresh) then
    redis.call('EXPIRE', hash, expire)
    return { value, 0, ttl }
else
    return { value, 1, ttl }
end


