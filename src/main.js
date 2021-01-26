const program = require('commander')
const path = require('path')

program.version(require('../package.json').version, '-v, --version')

// 配置3个指令命令
const mapActions = {
    create: {
        alias: 'c',
        description: 'create a project',
        examples: [
            'cgq-cli create <project-name>',
        ],
    },
    config: {
        alias: 'conf',
        description: 'config project variable',
        examples: [
            'cgq-cli config set <k><v>',
            'cgq-cli config get <k>',
        ],
    },
    '*': {
        alias: '',
        description: 'command not found',
        examples: [],
    },
};
Reflect.ownKeys(mapActions).forEach((action)=>{
    program.command(action)
    .alias(mapActions[action].alias)
    .description(mapActions[action].description)
    .action(()=>{
        if(action=='*'){
            console.log(mapActions[action].description)
        }else{
            console.log(...process.argv.slice(3))
            require(path.resolve(__dirname, action))(...process.argv.slice(3))
        }
    })
})
program.on('--help', ()=>{
    console.log('\nExamples:');
    Reflect.ownKeys(mapActions).forEach((action)=>{
        mapActions[action].examples.forEach((example)=>{
            console.log(example)
        })
    })
})
program.parse(process.argv)