import { serve } from 'https://deno.land/std/http/server.ts';
import { User } from './User.ts';
import { Act, FileAdapter } from 'https://deno.land/x/actdb/mod.ts';

const { env, readAll } = Deno;
const db = new Act(new FileAdapter());

const users = await db.createStore<User>('users');

const server = serve({ port: parseInt(env.get('PORT') || '4000') });

for await (const req of server) {
  if (req.method === 'OPTIONS') {
    req.respond({
      status: 200,
      headers: new Headers([
        ['Access-Control-Allow-Origin', '*'],
        ['Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'],
        ['Access-Control-Allow-Headers', 'Content-Type']
      ]),
    });
  } else if (req.method === 'GET' && req.url.match(/\/user\/[0-9]+$/)) {
    const id = parseInt((req.url.match(/(?<=\/)[0-9]+$/) || [])[0]);

    req.respond({
      status: 200,
      headers: new Headers([
        ['Content-Type', 'application/json'],
        ['Access-Control-Allow-Origin', '*']
      ]),
      body: JSON.stringify((await users.get({ id }))[0] || {})
    });
  } else if (req.method === 'GET' && req.url.match(/\/users$/)) {
    req.respond({
      status: 200,
      headers: new Headers([
        ['Content-Type', 'application/json'],
        ['Access-Control-Allow-Origin', '*']
      ]),
      body: JSON.stringify(await users.get())
    });
  } else if (req.method === 'POST' && req.url.match(/\/user$/)) {
    const body = JSON.parse(new TextDecoder('utf-8').decode(await readAll(req.body))) as User;

    const [user,] = await users.insert([ body ]);

    req.respond({
      status: 200,
      headers: new Headers([
        ['Content-Type', 'application/json'],
        ['Access-Control-Allow-Origin', '*']
      ]),
      body: JSON.stringify(user[0] || {})
    });
  } else if (req.method === 'PUT' && req.url.match(/\/user\/[0-9]+$/)) {
    const id = parseInt((req.url.match(/(?<=\/)[0-9]+$/) || [])[0]);
    const body = JSON.parse(new TextDecoder('utf-8').decode(await readAll(req.body))) as User;

    const [user] = await users.update({ id }, body);

    req.respond({
      status: 200,
      headers: new Headers([
        ['Content-Type', 'application/json'],
        ['Access-Control-Allow-Origin', '*']
      ]),
      body: JSON.stringify(user)
    });
  } else if (req.method === 'DELETE' && req.url.match(/\/user\/[0-9]+$/)) {
    const id = parseInt((req.url.match(/(?<=\/)[0-9]+$/) || [])[0]);

    await users.remove({ id });

    req.respond({
      status: 200,
      headers: new Headers([
        ['Content-Type', 'application/json'],
        ['Access-Control-Allow-Origin', '*']
      ])
    });
  } else {
    req.respond({ status: 404 })
  }
}
