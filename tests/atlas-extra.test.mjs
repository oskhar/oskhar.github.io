import assert from 'node:assert/strict';
import {labDefinitions,createLabState,labAction,labToggle,stepLab,labMetrics} from '../src/space/atlas-simulation.js';
const make=key=>createLabState(labDefinitions.findIndex(d=>d.key===key));
const advance=(s,seconds=20)=>{for(let i=0;i<seconds*20;i++)stepLab(s,.05);return s;};
for(let i=7;i<labDefinitions.length;i++){
 const s=createLabState(i);labToggle(s);labAction(s);advance(s);
 for(const id of [false,true])assert.ok(labMetrics(s,id).length>=2);
 assert.ok(Number.isFinite(s.processed));assert.ok(s.queue>=0);
}
const cache=make('cache');labToggle(cache);labAction(cache);advance(cache,3);assert.ok(cache.hits>0);assert.ok(cache.reads<cache.processed);
advance(cache,5);labAction(cache);const reads=cache.reads;advance(cache,1);assert.ok(cache.reads>reads,'TTL expiry must require a database read');
const limit=make('limit');limit.params.limit=1;labToggle(limit);labAction(limit);advance(limit);assert.ok(limit.rejected>0);assert.equal(limit.processed+limit.rejected,12);
const dedup=make('dedup');labToggle(dedup);labAction(dedup);advance(dedup);assert.equal(dedup.processed,4);assert.equal(dedup.duplicate,8);
const retry=make('retry');retry.params.fault=100;labToggle(retry);labAction(retry);advance(retry,40);assert.equal(retry.rejected,12);assert.equal(retry.attempts,48);
const replica=make('replica');labToggle(replica);labAction(replica);advance(replica,10);assert.equal(replica.version,12);assert.equal(replica.readVersion,0);labToggle(replica);advance(replica,1);assert.equal(replica.readVersion,12);
const shard=make('shard');labAction(shard);advance(shard);assert.deepEqual(shard.bins.slice(0,3),[4,4,4]);
const batch=make('batch'),single=make('batch');labToggle(batch);labAction(batch);labAction(single);advance(batch);advance(single);assert.equal(batch.processed,single.processed);assert.ok(batch.rounds<single.rounds);
const pool=make('pool'),serial=make('pool');labToggle(pool);labAction(pool);labAction(serial);advance(pool,3);advance(serial,3);assert.ok(pool.processed>serial.processed);
const priority=make('priority');labAction(priority);priority.jobs.reverse();labToggle(priority);advance(priority,.5);assert.equal(priority.hits,priority.processed);
const dlq=make('dlq');dlq.params.poison=100;labToggle(dlq);labAction(dlq);advance(dlq,20);assert.equal(dlq.rejected,12);assert.equal(dlq.jobs.length,0);
console.log('10 additional Atlas experiments: TTL, rate limits, bounded retries, idempotency, replication, sharding, batching, pooling, priority, and DLQ passed.');
