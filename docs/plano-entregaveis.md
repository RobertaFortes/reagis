# Plano de entregáveis (worktrees)

> Estado em 2026-09-29. WT-A e parte do WT-B já feitos na branch `claude/logo-logout-test-coverage-05efbc`.
> Pendências herdadas: 3 testes BE desatualizados (`sessionController.test` startSession; `joinHandler.test` draft/active — o mock não cobre `Question.find` → CastError); erro TS pré-existente em `JoinPage.tsx:102` (title recebe JSX); `@vitest/coverage-v8` não instalado.

## Roadmap de entregáveis compartilháveis (1 worktree ≈ 1 branch ≈ 1 PR)

| WT | Branch sugerida | Escopo | Depende de | Risco |
|----|-----------------|--------|-----------|-------|
| A | `fix/logo-auth-guard` | D1 + D2 (acima) | — | baixo |
| B | `test/foundation-coverage` | D3: alias back, coverage-v8, scripts, (opcional) workflow GitHub Actions `typecheck + test` | — | baixo |
| C | `test/be-auth-and-controllers` | testes `authenticateToken`, `authenticateParticipant`, `auth.routes` (supertest + mongodb-memory-server ou mocks), `questionController`, `voteController` | B | baixo |
| D | `test/be-sockets` | `voteHandler`, `presenterHandler`, `reactionHandler` | B | baixo |
| E | `test/fe-api-store-pages` | `sessionApi/questionApi/authApi` (fetch mock), slices restantes, `socketMiddleware`, LoginPage, JoinPage | B, A | baixo |
| F | `fix/be-auth-guards` | `authenticateToken` em `POST /sessions` e rotas de `questions`; checar `session.presenter === req.user.userId` em `questionController`; CORS sem fallback `*`; rate-limit no login | C (testes primeiro) | **médio** (muda contrato — alinhar com FE) |
| G | `chore/fe-hardening` | ErrorBoundary + rota `*`(404), `Suspense` fallback estilizado, try/catch em `JSON.parse`, remover comentários mortos, corrigir docs `sidebar.css` | A | baixo |

Ordem recomendada: **A ∥ B** (independentes) → **C ∥ D ∥ E** → **F** → **G**. Como faltam poucos dias para a entrega, priorizar A, B, F (segurança) e deixar E/G como "se sobrar tempo". Cada linha da tabela é auto-contida para ser copiada como prompt em outro worktree; o plano também será salvo em `docs/plano-entregaveis.md` (versionado, compartilhável).

