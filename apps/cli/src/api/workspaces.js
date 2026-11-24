const { apiRequest } = require('./client')

const getWorkspaces = async () => {
    const res = await apiRequest('get', '/api/v1/workspaces')
    return res.data.workspaces || []
}

const getProjects = async (workspaceSlug) => {
    const res = await apiRequest('get', `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects`)
    return res.data.projects || []
}

const getAllProjects = async () => {
    const res = await apiRequest('get', '/api/v1/projects')
    return res.data.projects || []
}

const createProject = async (workspaceSlug, data) => {
    const res = await apiRequest(
        'post',
        `/api/v1/workspaces/${encodeURIComponent(workspaceSlug)}/projects`,
        { data },
    )
    return res.data.project
}

const updateProject = async (projectId, data) => {
    const res = await apiRequest('patch', `/api/v1/projects/${encodeURIComponent(projectId)}`, { data })
    return res.data.project
}

module.exports = { getWorkspaces, getProjects, getAllProjects, createProject, updateProject }