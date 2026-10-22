// Servidor estático mínimo (sem dependências). Uso: npm start -> http://localhost:3000
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('./public', import.meta.url)));
const PORTA = process.env.PORT || 3000;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

export const servidor = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const caminho = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const arquivo = join(RAIZ, normalize(caminho));
    if (!arquivo.startsWith(RAIZ)) {
      res.writeHead(403).end('Acesso negado');
      return;
    }
    const dados = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(arquivo)] || 'application/octet-stream' });
    res.end(dados);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  servidor.listen(PORTA, () => console.log(`DP Assistente rodando em http://localhost:${PORTA}`));
}
