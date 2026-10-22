import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { servidor } from '../server.js';

let porta;
await new Promise((ok) => servidor.listen(0, ok));
porta = servidor.address().port;
after(() => servidor.close());

const get = (caminho) => fetch(`http://localhost:${porta}${caminho}`);

test('GET / entrega a página inicial', async () => {
  const r = await get('/');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
  assert.match(await r.text(), /DP Assistente/);
});

test('arquivos JavaScript têm o tipo correto', async () => {
  const r = await get('/js/custo.js');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /javascript/);
});

test('arquivo inexistente retorna 404', async () => {
  assert.equal((await get('/nao-existe.html')).status, 404);
});

test('tentativa de sair da pasta public é bloqueada', async () => {
  const r = await get('/..%2fpackage.json');
  assert.notEqual(r.status, 200);
});
