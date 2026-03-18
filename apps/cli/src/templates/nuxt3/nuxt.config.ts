// https://nuxt.com/docs/api/configuration/nuxt-config
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  /*构建时启用类型检查*/
  typescript: {
    typeCheck: true
  },

  imports: {
    dirs: [
      // 扫描顶级模块
      'composables',
      // ... 或扫描带有特定名称和文件扩展名的一级嵌套模块
      'composables/*/index.{ts,js,mjs,mts}',
      // ... 或扫描给定目录中的所有模块
      'composables/**'
    ]
  },

  nitro: {
    /*接口代理配置*/
    routeRules: {
      '/api/proxy/**': {
        proxy: 'http://xxxx:7790/api/blog/**'
      }
    }
  },

  runtimeConfig: {
    /**私有密钥仅在服务器端可用*/
    apiSecret: '',

    /**对客户端暴露的公共密钥*/
    public: {
      apiBaseUrl: ''
    }
  },

  modules: ['@unocss/nuxt', '@nuxt/image', '@vueuse/nuxt'],

  srcDir: 'src/',

  vite: {
    ssr: {},
    css: {},
    plugins: [
      AutoImport({
        imports: []
      }),
      Components({
        resolvers: []
      })
    ]
  },

  devtools: { enabled: true }
})
