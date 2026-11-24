const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const getConfigDir = () => {
    const appName = 'meridian'
    
    if (process.platform === "win32") {
        const baseDir = process.env.APPDATA || process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
        return path.join(baseDir, appName)
    }

    if (process.env.XDG_CONFIG_HOME) {
        return path.join(process.env.XDG_CONFIG_HOME, appName)
    }

    return path.join(os.homedir(), '.config', appName)
}

const getConfigPath = () => {
    return path.join(getConfigDir(), 'config.json')
}

const readConfig = () => {
    const configPath = getConfigPath()
    if (!fs.existsSync(configPath)) {
        return {}
    }

    try {
        const raw = fs.readFileSync(configPath, 'utf-8')
        return JSON.parse(raw)
    } catch {
        return {}
    }
}

const writeConfig = (nextData) => {
    const dir = getConfigDir()
    const configPath = getConfigPath()
    const tempPath = path.join(dir, `.config.json.${process.pid}.tmp`)

    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })

    const payload = JSON.stringify(nextData, null, 2) + '\n'
    fs.writeFileSync(tempPath, payload, { encoding: 'utf-8', mode: 0o600 })
    fs.renameSync(tempPath, configPath)
}

const updateConfig = (partial) => {
    const curConf = readConfig()
    const nextConf = { ...curConf, ...partial }
    writeConfig(nextConf)
    return nextConf
}

const clearAuthConfig = () => {
    const config = readConfig()
    const removeTokens = (value) => {
        if (!value || typeof value !== 'object') return
        for (const key of Object.keys(value)) {
            if (/token/i.test(key)) {
                delete value[key]
            } else {
                removeTokens(value[key])
            }
        }
    }

    removeTokens(config)
    delete config.user
    delete config.activeWorkspace
    delete config.activeProject
    writeConfig(config)
}

module.exports = { getConfigDir, getConfigPath, readConfig, writeConfig, updateConfig, clearAuthConfig }