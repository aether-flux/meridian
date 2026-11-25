const { apiRequest } = require('./client')

const getTasks = async (projectId, filters = {}) => {
    const res = await apiRequest('get', '/api/v1/tasks', {
        params: { projectId, ...filters },
    })
    return res.data.tasks || []
}

const getTask = async (taskId) => {
    const res = await apiRequest('get', `/api/v1/tasks/${encodeURIComponent(taskId)}`)
    return res.data.task
}

const createTask = async (projectId, data) => {
    const res = await apiRequest('post', '/api/v1/tasks', {
        data: { ...data, projectId },
    })
    return res.data.task
}

const updateTask = async (taskId, data) => {
    const res = await apiRequest('patch', `/api/v1/tasks/${encodeURIComponent(taskId)}`, { data })
    return res.data.task
}

const createTaskComment = async (taskId, body) => {
    const res = await apiRequest('post', `/api/v1/tasks/${encodeURIComponent(taskId)}/comments`, {
        data: { body },
    })
    return res.data.comment
}

module.exports = { getTasks, getTask, createTask, updateTask, createTaskComment }