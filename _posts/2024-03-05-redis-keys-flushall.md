---
title: "KEYS와 FLUSHALL 명령어를 쓰지 말아야되는 이유"
last_modified_at: 2024-03-05T00:00:00-00:00
categories:
- redis
tags:
- redis
- keys
toc: true
toc_sticky: true
---

Redis를 사용하다 보면 의도하지 않은 장애가 발생하거나 성능이 저하되는 경우가 있습니다.
이들은 모두 Redis가 싱글 스레드라는 것을 잊어 버리거나 모르고 있기 때문에 발생하는 문제입니다.

Redis는 싱글 스레드이기 때문에, 태생적으로 하나의 명령이 오랜 시간을 소모하는 작업에는 적합하지 않습니다.
그러나 이러한 특성을 이해하지 못하는 경우 장애가 발생하게 됩니다.

이번 글에서는 `KEYS`와 `FLUSHALL` 명령어가 왜 장애의 원인될 수 있는지 알아보겠습니다.

# 서버에서 KEYS 명령를 쓰지 말자

`KEYS` 명령어는 특정 패턴에 매칭되는 키를 찾아주는 명령어입니다.
예를 들어, `KEYS *`는 모든 키를 찾아주고, `KEYS user:*`는 `user:`로 시작하는 모든 키를 찾아줍니다.

```bash
redis 127.0.0.1:6379> keys user:*
  1) "user"
  2) "user:1h"
  3) "user:2h"
```

지원하는 glob-style 패턴을 살펴보면 다음과 같습니다.

| 패턴 | 설명 |
|---|---|
| h?llo |matches hello, hallo and hxllo|
| h*llo |matches hllo and heeeello|
| h[ae]llo |matches hello and hallo, but not hillo|
| h[^e]llo |matches hallo, hbllo, ... but not hello|
| h[a-b]llo |matches hallo and hbllo|

여기까지 살펴보면 `KEYS` 명령어는 특정 패턴에 매칭되는 키를 찾아주는 강력한 명령어라는 것을 알 수 있습니다.
하지만 실제 서비스에서 해당 명령을 사용하면 장애로 이어질 가능성이 높습니다.

[Redis 매뉴얼](https://redis.io/commands/keys/)에서도 다음과 같이 해당 명령은 실제 제품에서는 쓰지말라고 권고하고 있습니다.

> Warning: consider KEYS as a command that should only be used in production environments with extreme care. 
> It may ruin performance when it is executed against large databases. 
> This command is intended for debugging and special operations, such as changing your keyspace layout. 
> Don't use KEYS in your regular application code. 
> If you're looking for a way to find keys in a subset of your keyspace, consider using SCAN or sets.
 
왜 그렇다면 `KEYS` 명령어를 사용하면 안된다고 권고 할까요? 
소스코드를 보면 이해할 수 있습니다.

```c
void keysCommand(client *c) {
    dictEntry *de;
    sds pattern = c->argv[1]->ptr;
    int plen = sdslen(pattern), allkeys, pslot = -1;
    unsigned long numkeys = 0;
    void *replylen = addReplyDeferredLen(c);
    allkeys = (pattern[0] == '*' && plen == 1);
    if (server.cluster_enabled && !allkeys) {
        pslot = patternHashSlot(pattern, plen);
    }
    kvstoreDictIterator *kvs_di = NULL;
    kvstoreIterator *kvs_it = NULL;
    if (pslot != -1) {
        if (!kvstoreDictSize(c->db->keys, pslot)) {
            /* Requested slot is empty */
            setDeferredArrayLen(c,replylen,0);
            return;
        }
        kvs_di = kvstoreGetDictSafeIterator(c->db->keys, pslot);
    } else {
        kvs_it = kvstoreIteratorInit(c->db->keys);
    }
    robj keyobj;
    while ((de = kvs_di ? kvstoreDictIteratorNext(kvs_di) : kvstoreIteratorNext(kvs_it)) != NULL) {
        sds key = dictGetKey(de);

        if (allkeys || stringmatchlen(pattern,plen,key,sdslen(key),0)) {
            initStaticStringObject(keyobj, key);
            if (!keyIsExpired(c->db, &keyobj)) {
                addReplyBulkCBuffer(c, key, sdslen(key));
                numkeys++;
            }
        }
        if (c->flags & CLIENT_CLOSE_ASAP)
            break;
    }
    if (kvs_di)
        kvstoreReleaseDictIterator(kvs_di);
    if (kvs_it)
        kvstoreIteratorRelease(kvs_it);
    setDeferredArrayLen(c,replylen,numkeys);
}
```

소스 코드를 살펴보면, 현재 설정된 db의 모든 키를 모두 순회하며 stringmatchlen 함수를 통해 패턴에 매칭되는 키를 찾아주는 것을 알 수 있습니다.
이러한 방식으로 동작하기 때문에, 만약 Redis에 수십만개 이상의 키가 존재한다면, 해당 명령어를 실행하는 동안 다른 명령어들이 블로킹되어 성능이 저하될 수 있습니다.
그렇다면 어떻게 해야 할까요?

## SCAN 명령어를 사용하자

`SCAN` 명령어는 `KEYS` 명령어와 비슷하게 동작하지만, 키를 순회하는 방식이 다릅니다.
SCAN 명령어는 요청을 여러 개의 작은 요청으로 분할하여 처리하므로, 대규모 데이터셋에서도 실시간으로 요청을 처리할 수 있습니다.

또한 Redis 클러스터에서는 KEYS 명령어를 사용할 수 없습니다. 
대신 SCAN 명령어를 사용하여 클러스터 전체에서 키를 검색할 수 있습니다.

```bash
127.0.0.1:6379> SCAN 0 MATCH user:*
  1) "user"
  2) "user:1h"
  3) "user:2h"
```

# 서버에서 FLUSHALL 명령을 쓰지 말자

모든 데이터를 삭제하는 명령어인 'FLUSHALL/FLUSHDB'라는 명령어가 존재합니다.
Redis는 db라는 가상의 공간을 분리할 수 있는 개념을 제공하고, select 명령으로 이동할 수 있습니다.
이를 통해 같은 키라도 db '0번'이나 '1번' 등으로 나누어 여러개의 데이터를 저장할 수 있습니다.
이런 db 하나의 내용을 통째로 지우는 것이 'FLUSHDB' 명령입니다.
(따로 select 명령어로 db 지정하지 않을 시 0번을 사용합니다.)
또한, 모든 db의 내용을 지우는 것이 'FLUSHALL' 명령입니다.

간단히 예를 들어 살펴 보겠습니다.
아래는 db 0번과 1번에 각각 'young'이라는 키를 생성하고 '123', '456'이라는 값을 할당하였습니다.
이때 select 명령어로 db를 변경하여 각각의 db에 키를 가져올 수 있습니다.

```bash
127.0.0.1:6379> select 0
OK
127.0.0.1:6379> set name 'young'
OK
127.0.0.1:6379> get name
"young"
127.0.0.1:6379> select 1
OK
127.0.0.1:6379[1]> set firstname 'hwang'
OK
127.0.0.1:6379[1]> get firstname
"hwang"
```

flushdb를 사용하여 하나의 db를 선택하여 지우거나 flushall로 전체 db를 지울 때 주의를 해야합니다.
flushall 명령은 전체 데이터를 다 지우며, keys 명령처럼 많은 시간이 필요합니다.

fushall을 이용해서 데이터를 지우는 속도를 측정해보면 아이템 개수에 비례하여 시간이 걸립니다.

다음 소스 코드를 통해 flushall 명령에 대해 살펴 보겠습니다.

> /src/db.c

```c++
/* FLUSHALL [ASYNC]
 *
 * Flushes the whole server data set. */
void flushallCommand(client *c) {
    int flags;
    if (getFlushCommandFlags(c,&flags) == C_ERR) return;
    /* flushall should not flush the functions */
    flushAllDataAndResetRDB(flags | EMPTYDB_NOFUNCTIONS); 

    /* Without the forceCommandPropagation, when DBs were already empty,
     * FLUSHALL will not be replicated nor put into the AOF. */
    forceCommandPropagation(c, PROPAGATE_REPL | PROPAGATE_AOF);

    addReply(c,shared.ok);
}
```

flushallCommand 함수는 FLUSHALL 명령을 처리하는 함수 입니다.
getFlushCommandFlags 함수를 통해 동기적으로 실행되어야 하는지, 아니면 비동기로 실행되어야 하는지 결정합니다.
flushAllDataAndResetRDB 함수를 통해 실제 데이터를 지우는 작업을 수행합니다.

> /src/db.c

```c++
/* Flushes the whole server data set. */
void flushAllDataAndResetRDB(int flags) {
    server.dirty += emptyData(-1,flags,NULL);
    if (server.child_type == CHILD_TYPE_RDB) killRDBChild();
    if (server.saveparamslen > 0) {
        rdbSaveInfo rsi, *rsiptr;
        rsiptr = rdbPopulateSaveInfo(&rsi);
        rdbSave(SLAVE_REQ_NONE,server.rdb_filename,rsiptr,RDBFLAGS_NONE);
    }

#if defined(USE_JEMALLOC)
    /* jemalloc 5 doesn't release pages back to the OS when there's no traffic.
     * for large databases, flushdb blocks for long anyway, so a bit more won't
     * harm and this way the flush and purge will be synchronous. */
    if (!(flags & EMPTYDB_ASYNC))
        jemalloc_purge();
#endif
}
```

emptyData 함수를 호출하여 모든 데이터를 비웁니다.
첫번째 인자로 -1을 넘겨주면 모든 db를 비우게 됩니다.

> /src/db.c

```c++
/* Remove all data (keys and functions) from all the databases in a
 * Redis server. If callback is given the function is called from
 * time to time to signal that work is in progress.
 *
 * The dbnum can be -1 if all the DBs should be flushed, or the specified
 * DB number if we want to flush only a single Redis database number.
 *
 * Flags are be EMPTYDB_NO_FLAGS if no special flags are specified or
 * EMPTYDB_ASYNC if we want the memory to be freed in a different thread
 * and the function to return ASAP. EMPTYDB_NOFUNCTIONS can also be set
 * to specify that we do not want to delete the functions.
 *
 * On success the function returns the number of keys removed from the
 * database(s). Otherwise -1 is returned in the specific case the
 * DB number is out of range, and errno is set to EINVAL. */
long long emptyData(int dbnum, int flags, void(callback)(dict*)) {
    int async = (flags & EMPTYDB_ASYNC);
    int with_functions = !(flags & EMPTYDB_NOFUNCTIONS);
    RedisModuleFlushInfoV1 fi = {REDISMODULE_FLUSHINFO_VERSION,!async,dbnum};
    long long removed = 0;

    if (dbnum < -1 || dbnum >= server.dbnum) {
        errno = EINVAL;
        return -1;
    }

    /* Fire the flushdb modules event. */
    moduleFireServerEvent(REDISMODULE_EVENT_FLUSHDB,
                          REDISMODULE_SUBEVENT_FLUSHDB_START,
                          &fi);

    /* Make sure the WATCHed keys are affected by the FLUSH* commands.
     * Note that we need to call the function while the keys are still
     * there. */
    signalFlushedDb(dbnum, async);

    /* Empty redis database structure. */
    removed = emptyDbStructure(server.db, dbnum, async, callback);

    if (dbnum == -1) flushSlaveKeysWithExpireList();

    if (with_functions) {
        serverAssert(dbnum == -1);
        functionsLibCtxClearCurrent(async);
    }

    /* Also fire the end event. Note that this event will fire almost
     * immediately after the start event if the flush is asynchronous. */
    moduleFireServerEvent(REDISMODULE_EVENT_FLUSHDB,
                          REDISMODULE_SUBEVENT_FLUSHDB_END,
                          &fi);

    return removed;
}
```

emptyDbStructure 함수를 호출하여 실제로 데이터베이스 구조를 비웁니다.

> /src/db.c

```c++
/* Remove all keys from the database(s) structure. The dbarray argument
 * may not be the server main DBs (could be a temporary DB).
 *
 * The dbnum can be -1 if all the DBs should be emptied, or the specified
 * DB index if we want to empty only a single database.
 * The function returns the number of keys removed from the database(s). */
long long emptyDbStructure(redisDb *dbarray, int dbnum, int async,
                           void(callback)(dict*))
{
    long long removed = 0;
    int startdb, enddb;

    if (dbnum == -1) {
        startdb = 0;
        enddb = server.dbnum-1;
    } else {
        startdb = enddb = dbnum;
    }

    for (int j = startdb; j <= enddb; j++) {
        removed += kvstoreSize(dbarray[j].keys);
        if (async) {
            emptyDbAsync(&dbarray[j]);
        } else {
            kvstoreEmpty(dbarray[j].keys, callback);
            kvstoreEmpty(dbarray[j].expires, callback);
        }
        /* Because all keys of database are removed, reset average ttl. */
        dbarray[j].avg_ttl = 0;
        dbarray[j].expires_cursor = 0;
    }

    return removed;
}
```

kvstoreSize 함수를 호출하여 최종적으로 비워진 키의 수를 나타냅니다.
kvstoreEmpty 함수를 호출하여 데이터를 비웁니다.

> /src/kvstore.c

```c++
void kvstoreEmpty(kvstore *kvs, void(callback)(dict*)) {
    for (int didx = 0; didx < kvs->num_dicts; didx++) {
        dict *d = kvstoreGetDict(kvs, didx);
        if (!d)
            continue;
        kvstoreDictMetadata *metadata = (kvstoreDictMetadata *)dictMetadata(d);
        if (metadata->rehashing_node)
            metadata->rehashing_node = NULL;
        dictEmpty(d, callback);
        freeDictIfNeeded(kvs, didx);
    }

    listEmpty(kvs->rehashing);

    kvs->key_count = 0;
    kvs->non_empty_dicts = 0;
    kvs->resize_cursor = 0;
    kvs->bucket_count = 0;
    if (kvs->dict_size_index)
        memset(kvs->dict_size_index, 0, sizeof(unsigned long long) * (kvs->num_dicts + 1));
    kvs->overhead_hashtable_lut = 0;
    kvs->overhead_hashtable_rehashing = 0;
}
```

kvstoreGetDict 함수를 호출하여 kvstore의 dict를 가져옵니다.
dictEmpty 함수를 호출하여 딕셔너리를 비웁니다.

> /src/dict.c

```c++
void dictEmpty(dict *d, void(callback)(dict*)) {
    _dictClear(d,0,callback);
    _dictClear(d,1,callback);
    d->rehashidx = -1;
    d->pauserehash = 0;
    d->pauseAutoResize = 0;
}
```

주어진 딕셔너리의 모든 항목을 비우는 역할을 합니다.
_dictClear 함수를 두 번 호출하여 딕셔너리의 두 해시 테이블을 비웁니다.
_dictClear 함수는 딕셔너리의 해시 테이블에서 모든 항목을 제거합니다.
_dictClear(d, 0, callback) 은 첫 번째 해시 테이블을, _dictClear(d, 1, callback) 는 두 번째 해시 테이블을 비웁니다.

> /src/dict.c

```c++
/* Destroy an entire dictionary */
int _dictClear(dict *d, int htidx, void(callback)(dict*)) {
    unsigned long i;

    /* Free all the elements */
    for (i = 0; i < DICTHT_SIZE(d->ht_size_exp[htidx]) && d->ht_used[htidx] > 0; i++) {
        dictEntry *he, *nextHe;

        if (callback && (i & 65535) == 0) callback(d);

        if ((he = d->ht_table[htidx][i]) == NULL) continue;
        while(he) {
            nextHe = dictGetNext(he);
            dictFreeKey(d, he);
            dictFreeVal(d, he);
            if (!entryIsKey(he)) zfree(decodeMaskedPtr(he));
            d->ht_used[htidx]--;
            he = nextHe;
        }
    }
    /* Free the table and the allocated cache structure */
    zfree(d->ht_table[htidx]);
    /* Re-initialize the table */
    _dictReset(d, htidx);
    return DICT_OK; /* never fails */
}
```

주어진 딕셔너리의 모든 항목을 제거하는 역할을 합니다.
먼저 해시 DICTHT_SIZE(d->ht_size_exp[htidx])로 테이블 크기와 d->ht_used[htidx] 로 해시 테이블에 사용된 항목 수를 확인 합니다.
dictEntry *he를 사용하여 현재 항목을 가져옵니다.
dictGetNext(he)를 사용하여 다음 항목을 가져옵니다.
dictFreeKey와 dictFreeVal 함수를 사용하여 키와 값을 제거합니다.
이처럼 실제 데이터를 일일이 삭제하는 것을 확인 할 수 있습니다.
따라서 지우는 속도가 O(n)이기 때문에 데이터 양에 영향을 받게 됩니다.

