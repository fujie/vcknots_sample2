import { VcknotsContext } from '@trustknots/vcknots'
import { showRoutes } from 'hono/dev'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { createAuthzRouter } from './routes/authz.js'
import { createIssueRouter } from './routes/issue.js'
import { createVerifierRouter } from './routes/verify.js'

export const createApp = (context: VcknotsContext, baseUrl: string) => {
  const app = new Hono()

  // CORS: 全オリジンからのアクセスを許可
  app.use('*', cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    maxAge: 86400,
  }))

  app.route('/', createIssueRouter(context, baseUrl))
  app.route('/', createAuthzRouter(context, baseUrl))
  app.route('/', createVerifierRouter(context, baseUrl))

  app.notFound((c) => c.json({ error: 'Not Found' }, 404))
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    console.error(err)
    return c.json({ error: 'internal_server_error' }, 500)
  })

  showRoutes(app, { verbose: true })

  return app
}
