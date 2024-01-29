import { serve } from '@hono/node-server'
import logger from '@/utils/logger'
import { config } from '@/config'
import app from '@/app'

const port = config.connect.port

logger.info(`🎉 RSSHub is running on port ${port}! Cheers!`)
logger.info('💖 Can you help keep this open source project alive? Please sponsor 👉 https://docs.rsshub.app/support');

serve({
  fetch: app.fetch,
  port
})

export default app
