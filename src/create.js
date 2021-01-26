const axios = require('axios');
// const ora = require('ora');
const inquirer = require('inquirer');
const { promisify } = require('util')
let downloadGitRepo = require('download-git-repo')
downloadGitRepo = promisify(downloadGitRepo)
const { downloadDirectory } = require('./constant.js')

const fetchRepoList = async ()=>{
    const { data } = await axios.get('https://api.github.com/orgs/cgq-template/repos')
    return data
}
module.exports = async ()=>{
    try{
        // const spinner = ora('fetching template ...')
        // spinner.start()
        let repos = await fetchRepoList()
        // spinner.success();
        // repos = repos.map(item=> item.name)
        // const { repo } = await inquirer.prompt({
        //     name: 'repo',
        //     type: 'list',
        //     message: 'please choise a template to create project',
        //     choices: repos
        // })
        console.log(repos)
    }catch{
        console.log('出错了')
    }
}