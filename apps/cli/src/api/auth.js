const axios = require('axios')
const { API_URL } = require('./var')

const loginApi = async (email, password) => {
    let body = {
        email, password
    }

    try {
        const res = await axios.post(`${API_URL}/api/v1/auth/login`, body)
        return res.data
    } catch (e) {
        return {
            error: e.response?.data?.error || e.message || 'Unable to reach Meridian API',
            details: e.response?.data?.details || null,
        }
    }
}

module.exports = { loginApi }