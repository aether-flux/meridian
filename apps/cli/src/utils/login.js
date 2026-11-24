const { input, password } = require('@inquirer/prompts')
const { loginApi } = require('../api/auth')
const { updateConfig } = require('./config')

const authenticate = async () => {
    const email = await input({
        message: 'Email:',
        validate: (value) => {
            const trimmed = value.trim()
            if (!trimmed) return 'Email is required'
            if (!trimmed.includes('@')) return 'Invalid email format'
            return true
        },
    })
    const userPassword = await password({
        message: 'Password:',
        mask: '*',
        validate: (value) => value.trim() ? true : 'Password is required',
    })

    const result = await loginApi(email.trim(), userPassword)
    if (!result?.token || result.error) {
        const error = new Error(result?.error || 'Login failed')
        error.details = result?.details
        throw error
    }

    updateConfig({ accessToken: result.token, user: result.user })
    return { user: result.user }
}

module.exports = { authenticate }