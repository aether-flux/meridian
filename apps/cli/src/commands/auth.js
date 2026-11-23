const { input, password } = require('@inquirer/prompts')
const { loginApi } = require('../api/auth')
const { updateConfig, getConfigPath } = require('../utils/config')
const { configureContext } = require('./context')
const ora = require('ora')

const loginAction = async () => {
    const email = await input({
        message: 'Email:',
        validate: (v) => {
            const trimmed = v.trim()
            if (!trimmed) {
                return "Email is required"
            }
            if (!trimmed.includes('@')) {
                return "Invalid email format"
            }
            return true
        }
    })
    const pswd = await password({
        message: 'Password:',
        mask: '*',
        validate: (v) => {
            const trimmed = v.trim()
            if (!trimmed) {
                return "Password is required"
            }
            if (trimmed.length < 8) {
                return "Password must be at least 8 characters long"
            }
            return true
        }
    })

    const spinner = ora({
        text: 'Authenticating...',
        spinner: 'dots',
    }).start()

    let res
    try {
        res = await loginApi(email.trim(), pswd.trim())
    } catch (e) {
        spinner.fail('Could not reach Meridian API.')
        console.error(e.message || e)
        return
    }

    if (!res || res.error) {
        spinner.fail('Login failed.')
        console.error(` ${res?.error || 'Unknown error'}`)
        res.details ? console.error('   Details:', res.details) : null
        return
    }

    updateConfig({ accessToken: res.token, user: res.user })
    const displayName = res.user?.displayName || res.user?.email || 'Unknown user'
    spinner.succeed(`Logged in as ${displayName}`)

    try {
        await configureContext()
    } catch (e) {
        console.error(`  Could not load workspace settings: ${e.message || e}`)
    }

    console.log('')
    console.log(`  Welcome back, ${displayName}!`)
    console.log(`  Session saved to : ${getConfigPath()}`)
}

module.exports = { loginAction }