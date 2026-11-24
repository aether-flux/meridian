const { authenticate } = require('../utils/login')
const { clearAuthConfig, getConfigPath, readConfig } = require('../utils/config')
const { configureContext } = require('./context')

const loginAction = async () => {
    try {
        const { user } = await authenticate()
        const displayName = user?.displayName || user?.email || 'Unknown user'
        console.log(`Logged in as ${displayName}`)
        console.log(`Session saved to: ${getConfigPath()}`)

        try {
            await configureContext()
        } catch (error) {
            console.error(`Could not configure workspace context: ${error.message || error}`)
        }
    } catch (e) {
        console.error(`Login failed: ${e.message || e}`)
        if (e.details) console.error('Details:', e.details)
    }
}

const logoutAction = () => {
    const config = readConfig()
    const wasLoggedIn = Boolean(config.accessToken || config.token || config.refreshToken)
    clearAuthConfig()
    console.log(wasLoggedIn ? 'Logged out. Saved tokens and account context were cleared.' : 'No saved session found.')
}

module.exports = { loginAction, logoutAction }