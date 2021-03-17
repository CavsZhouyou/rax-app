const chalk = require('chalk');
const babelMerge = require('babel-merge');

const defaultOptions = {
  // 是否启用 jsx+
  jsxPlus: !process.env.DISABLE_JSX_PLUS,
  // 是否将样式转换为内联样式
  styleSheet: false,
  // 是否将 es6 模块转换为其他模块形式
  modules: false,
};

// log flag
let logOnce = true;

module.exports = (userOptions = {}) => {
  const options = Object.assign({}, defaultOptions, userOptions);
  const {
    // 是否将样式转换为内联样式
    styleSheet,
    // 是否启用 jsx+
    jsxPlus = true,
    // 是否将 jsx 转换为 html，ssr 时使用
    jsxToHtml,
    // 使用禁用 generator 函数
    disableRegenerator = false,
    // preset-env modules options
    // 是否将 es6 模块转换为其他模块形式
    modules,
  } = options;

  const baseConfig = {
    presets: [
      // flow 的 preset ，为什么要加一个 flow 的配置？是为了和 preset-react 兼容？
      require.resolve('@babel/preset-flow'),
      [
        require.resolve('@babel/preset-env'),
        {
          // 设置为松散模式，降低代码复杂度，个人理解是为了提升代码性能
          loose: true,
          // 设置是否将 es6 模块转换为其他模块形式
          modules,
          include: [
            // 计算属性插件
            'transform-computed-properties',
          ],
          // 禁用 generator 时，exclude transform-regenerator 插件
          exclude: disableRegenerator ? ['transform-regenerator'] : [],
        },
      ],
      [
        require.resolve('@babel/preset-react'), {
          pragma: 'createElement',
          pragmaFrag: 'Fragment',
          // 为了 jsx+ 兼容，避免 xml namespace 报错抛出
          throwIfNamespace: false,
        },
      ],
    ],
    // 添加一些提案中的新特性
    plugins: [
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      // Stage 0
      require.resolve('@babel/plugin-proposal-function-bind'),
      // Stage 1
      require.resolve('@babel/plugin-proposal-export-default-from'),
      [
        require.resolve('@babel/plugin-proposal-optional-chaining'),
        { loose: true },
      ],
      [
        require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
        { loose: true },
      ],
      // Stage 2
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      require.resolve('@babel/plugin-proposal-export-namespace-from'),
      // Stage 3
      [
        require.resolve('@babel/plugin-proposal-class-properties'),
        { loose: true },
      ],
      require.resolve('babel-plugin-minify-dead-code-elimination-while-loop-fixed'),
    ],
  };

  const configArr = [baseConfig];

  // ssr 时将 jsx 先转换为 html string，提升性能
  if (jsxToHtml) {
    // Must transform before other jsx transformer
    configArr.push({
      plugins: [
        require.resolve('babel-plugin-transform-jsx-to-html'),
      ],
    });
  }

  // Enable jsx plus default.
  if (jsxPlus) {
    configArr.push({
      plugins: [
        require.resolve('babel-plugin-transform-jsx-list'),
        require.resolve('babel-plugin-transform-jsx-condition'),
        require.resolve('babel-plugin-transform-jsx-memo'),
        require.resolve('babel-plugin-transform-jsx-slot'),
        [require.resolve('babel-plugin-transform-jsx-fragment'), { moduleName: 'rax' }],
        require.resolve('babel-plugin-transform-jsx-class'),
      ],
    });

    if (logOnce) {
      console.log(chalk.green('JSX+ enabled, documentation: https://rax.js.org/docs/guide/jsxplus'));
      logOnce = false;
    }
  }

  if (styleSheet) {
    configArr.push({
      plugins: [
        [require.resolve('babel-plugin-transform-jsx-stylesheet'), { retainClassName: true }],
      ],
    });
  }

  const result = babelMerge.all(configArr);

  return result;
};
