const axios = require('axios')
const { API_URL } = require('./var')
const { readConfig, updateConfig } = require('../utils/config')
const { authenticate } = require('../utils/login')

const isExpiredTokenResponse = (error) => {
    const status = error.response?.status
    const message = error.response?.data?.error || ''
    return status === 401 || (status === 403 && /invalid or expired token/i.test(message))
}

const sendRequest = async (method, path, options = {}) => {
    const { accessToken } = readConfig()
    if (!accessToken) {
        throw new Error('You are not logged in. Run `meridian login` first.')
    }

    return axios.request({
        method,
        url: `${API_URL}${path}`,
        data: options.data,
        params: options.params,
        headers: { Authorization: `Bearer ${accessToken}` },
    })
}

const apiRequest = async (method, path, options) => {
    try {
        return await sendRequest(method, path, options)
    } catch (error) {
        if (!isExpiredTokenResponse(error)) throw error

        updateConfig({ accessToken: null })
        await authenticate()
        return sendRequest(method, path, options)
    }
}

module.exports = { apiRequest }