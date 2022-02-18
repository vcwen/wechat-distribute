import { Configuration, InjectEnv } from '@lurenjs/config'
@Configuration()
class Config {
  @InjectEnv('PORT', { default: 3000 })
  public port: number

  @InjectEnv('CONFIG_DIR')
  public configDir: string

  @InjectEnv('PUBLIC_PATH', { default: '/accounts/:appId' })
  public publicPath: string
}

const config = new Config()
export default config
