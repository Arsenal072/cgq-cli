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


const fetchRepoList = async () => {
    const {
        data
    } = await axios.get('https://api.github.com/orgs/cgq-cli/repos')
    return data
}
const fetchTagList = async (repo) => {
    const { data } = await axios.get(`http://api.github.com/repos/cgq-cli/${repo}/tags`)
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
    if(tag){
        api += `#${tag}`
    }
    const dest = `${downloadDirectory}/${repo}`
    await downloadGitRepo(api, dest)
    return dest
}

module.exports = async (projectName) => {
    //获取项目模板
    let repos = await waitLoading(fetchRepoList, 'fetching template ...')()
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
    await ncp(target, path.join(path.resolve(), projectName))
}