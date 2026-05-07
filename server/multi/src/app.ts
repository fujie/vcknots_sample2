import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { VcknotsContext } from '@trustknots/vcknots'

import { createVerifierRouter } from './routes/verify.js'
import { createIssueRouter } from './routes/issue.js'
import { createAuthzRouter } from './routes/authz.js'
import { createMoldRouter } from './routes/mold.js'

export const createApp = (context: VcknotsContext, baseUrl: string) => {
  const app = new Hono()

  app.route('/issuers', createIssueRouter(context, baseUrl))
  app.route('/authorizations', createAuthzRouter(context, baseUrl))
  app.route('/verifiers', createVerifierRouter(context, baseUrl))
  app.route('/', createMoldRouter(context, baseUrl))

  app.notFound((c) => c.json({ error: 'Not Found' }, 404))
  app.onError((err, c) => {
    if (err instanceof HTTPException) return err.getResponse()
    return c.json({ error: err.message }, 500)
  })

  return app
}
