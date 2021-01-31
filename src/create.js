const fs = require('fs')
const path = require('path')
const axios = require('axios');
const ora = require('ora');
const inquirer = require('inquirer');
const {
    promisify
} = require('util')
let downloadGitRepo = require('download-git-repo')
downloadGitRepo = promisify(downloadGitRepo)
let ncp = require('ncp');
ncp = promisify(ncp);
const {
    downloadDirectory
} = require('./constant.js')
const MetalSmith = require('metalsmith')
let {
    render
} = require('consolidate').ejs
render = promisify(render)


const fetchRepoList = async () => {
    const {
        data
    } = await axios.get('https://api.github.com/orgs/cgq-cli/repos')
    return data
}
const fetchTagList = async (repo) => {
    const {
        data
    } = await axios.get(`http://api.github.com/repos/cgq-cli/${repo}/tags`)
    return data
}
// 加载方法封装，函数柯里化
const waitLoading = (fn, msg) => async (...args) => {
    const spinner = ora(msg)
    try {
        spinner.start()
        const result = await fn(...args)
        spinner.succeed();
        return result
    } catch {
        spinner.stop()
        console.log('出错了')
    }
}

const download = async (repo, tag) => {
    let api = `cgq-cli/${repo}`
    if (tag) {
        api += `#${tag}`
    }
    const dest = `${downloadDirectory}/${repo}`
    await downloadGitRepo(api, dest)
    return dest
}

module.exports = async (projectName) => {
    //获取项目模板
    let repos = await waitLoading(fetchRepoList, 'fetching template ...')()
    console.log('repos', repos)
    repos = repos.map(item => item.name)
    const {
        repo
    } = await inquirer.prompt({
        name: 'repo',
        type: 'list',
        message: 'please choise a template to create project',
        choices: repos
    })
    //获取版本号 tag
    let tags = await waitLoading(fetchTagList, 'fetching tags ......')(repo)
    tags = tags.map(item => item.name)
    const {
        tag
    } = await inquirer.prompt({
        name: 'tag',
        type: 'list',
        message: 'please choise a template to create project',
        choices: tags
    })
    //下载
    const target = await waitLoading(download, 'download template')(repo, tag)
    //判断临时目录中是否存在ask文件
    if (!fs.existsSync(path.join(target, 'ask.js'))) {
        console.log('简单模板')
        await ncp(target, path.join(path.resolve(), projectName))
    } else {
        console.log('复杂模板')
        // 复杂的需要模版渲染 渲染后在拷贝
        // 把git上的项目下载下来 如果有ask 文件就是一个复杂的模版,
        // 我们需要用户选择, 选择后编译模版
        // 1.让用户填信息
        
        await new Promise((resolve, reject) => {
            MetalSmith(__dirname) // 如果你传入路径 他默认会遍历当前路径下的src文件夹
                .source(target)
                .destination(path.resolve(projectName))
                .use(async (files, metal, down) => {
                    const args = require(path.join(target, 'ask.js'))
                    const obj = await inquirer.prompt(args)
                    const meta = metal.metadata()
                    Object.assign(meta, obj)
                    delete files['ask.js']
                    done()
                })
                .use((files, metal, done) => {
                    // 2.让用户天填写的信息去渲染模版
                    // metalsmith 只要是模版编译 都需要这个模块
                    const obj = metal.metadata()
                    Reflect.ownKeys(files).forEach(async (file) => {
                        if (file.includes('js') || file.includes('json')) {
                            let content = files[file].contents.toString()
                            if (content.includes('<%')) {
                                content = await render(content, obj)
                                files[file].contents = Buffer.from(content)
                            }
                        }
                    })
                    await ncp(result, path.resolve(projectName));
                    done()
                })
                .build(err => {
                    if (err) {
                        reject()
                    } else {
                        resolve()
                    }
                })
        })
    }
}