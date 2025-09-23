// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Vercel适配器配置
		adapter: adapter({
			// Vercel运行时配置
			runtime: 'nodejs18.x',
			// 部署区域（可选，新加坡区域）
			regions: ['sin1'],
			// 最大执行时间（秒）
			maxDuration: 300,
			// 内存限制
			memory: 1024,
			// 是否启用边缘运行时（可选）
			// runtime: 'edge'
		}),

		// 预渲染配置 - 重点修复部分
		prerender: {
			// 处理HTTP错误的方式
			handleHttpError: ({ path, referrer, message }) => {
				// 对于特定路径，将错误降级为警告
				if (path === '/version.json' || 
					path.startsWith('/api/') || 
					path.includes('version')) {
					console.warn(`预渲染警告 [${path}]: ${message}`);
					return; // 不抛出错误，继续预渲染
				}
				
				// 对于其他路径，仍然抛出错误
				throw new Error(`预渲染错误 [${path}]: ${message}`);
			},

			// 处理缺失ID的情况
			handleMissingId: ({ path, id }) => {
				console.warn(`缺少ID警告: ${path}#${id}`);
			},

			// 处理入口缺失的情况
			handleEntryGeneratorMismatch: ({ expected, actual, generatedByFallback }) => {
				console.warn(`入口不匹配警告: expected ${expected}, actual ${actual}`);
			},

			// 指定要预渲染的页面
			entries: [
				'*', // 预渲染所有发现的页面
				// 排除动态API路由和问题路由
				'!/api/*',
				'!/version.json',
				'!/health',
				// 如果有其他问题路由，也可以排除
				// '!/some-problematic-route'
			],

			// 并发请求数量
			concurrency: 1,

			// 爬取页面时是否等待
			crawl: true,

			// 预渲染时是否启用JavaScript
			enabled: true,

			// 预渲染时的来源
			origin: 'https://localhost:5173'
		},

		// 别名配置（如果项目使用了别名）
		alias: {
			'$lib': './src/lib',
			'$components': './src/components'
		},

		// 路径配置
		paths: {
			// 如果部署在子路径下（通常Vercel不需要）
			// base: '/cobalt',
			// assets: ''
		},

		// 环境变量配置
		env: {
			// 公共环境变量前缀
			publicPrefix: 'PUBLIC_',
			// 私有环境变量（服务端）
			privatePrefix: 'PRIVATE_'
		},

		// CSP配置（内容安全策略）
		csp: {
			mode: 'auto',
			directives: {
				'script-src': ['self', 'unsafe-inline'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https:'],
				'connect-src': ['self', 'https://api.github.com']
			}
		},

		// 服务工作者配置
		serviceWorker: {
			register: false // 在Vercel上通常不需要
		}
	},

	// Vite配置扩展
	vite: {
		// 开发服务器配置
		server: {
			fs: {
				allow: ['..']
			}
		},
		// 构建配置
		build: {
			// 目标浏览器
			target: 'esnext',
			// Sourcemap配置
			sourcemap: false
		},
		// 环境变量配置
		define: {
			// 在构建时替换的全局常量
			__VERSION__: JSON.stringify(process.env.npm_package_version || 'dev'),
			__BUILD_TIME__: JSON.stringify(new Date().toISOString())
		}
	}
};

export default config;
