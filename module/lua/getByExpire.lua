local hash = KEYS[1]
local expire = tonumber(ARGV[1])


local value = redis.call('GET', hash)

if (not value) then
    return nil
end

local ttl = redis.call('TTL', hash)

if (ttl < expire / 2) then
    redis.call('EXPIRE', hash, expire)
    return { value, 0, ttl }
else
    return { value, 1, ttl }
end


