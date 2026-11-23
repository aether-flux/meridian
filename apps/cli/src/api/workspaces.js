const axios = require('axios')
const { API_URL } = require('./var')
const { readConfig } = require('../utils/config')

const getAuthHeaders = () => {
    const { accessToken } = readConfig()
    if (!accessToken) {
        throw new Error('You are not logged in. Run `meridian login` first.')
    }
    return { Authorization: `Bearer ${accessToken}` }
}

const getWorkspaces = async () => {
    const res = await axios.get(`${API_URL}/api/v1/workspaces`, {
        headers: getAuthHeaders(),
    })
    return res.data.workspaces || []
}

const getProjects = async (workspaceSlug) => {
    const res = await axios.get(
        `${API_URL}/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects`,
        { headers: getAuthHeaders() },
    )
    return res.data.projects || []
}

module.exports = { getWorkspaces, getProjects }