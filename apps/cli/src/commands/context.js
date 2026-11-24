const { select } = require('@inquirer/prompts')
const { getWorkspaces, getProjects } = require('../api/workspaces')
const { readConfig, updateConfig } = require('../utils/config')

const asWorkspaceSelection = (workspace) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
})

const asProjectSelection = (project) => ({
    id: project.id,
    name: project.name,
    identifier: project.identifier,
})

const chooseWorkspace = async ({ forcePrompt = false } = {}) => {
    const workspaces = await getWorkspaces()
    const config = readConfig()
    const active = workspaces.find((workspace) => workspace.slug === config.activeWorkspace?.slug)

    if (!workspaces.length) {
        updateConfig({ activeWorkspace: null, activeProject: null })
        console.log('No workspaces found for this account.')
        return null
    }

    let workspace = active
    if (forcePrompt || !workspace) {
        if (workspaces.length === 1 && !forcePrompt) {
            workspace = workspaces[0]
        } else {
            const slug = await select({
                message: 'Select a workspace:',
                choices: workspaces.map((item) => ({
                    name: `${item.name} (${item.slug})${item.slug === active?.slug ? ' [active]' : ''}`,
                    value: item.slug,
                })),
            })
            workspace = workspaces.find((item) => item.slug === slug)
        }
    }

    const nextWorkspace = asWorkspaceSelection(workspace)
    if (config.activeWorkspace?.slug !== nextWorkspace.slug) {
        updateConfig({ activeWorkspace: nextWorkspace, activeProject: null })
    } else {
        updateConfig({ activeWorkspace: nextWorkspace })
    }
    return nextWorkspace
}

const chooseProject = async ({ forcePrompt = false } = {}) => {
    const { activeWorkspace, activeProject } = readConfig()
    if (!activeWorkspace?.slug) {
        console.log('Select a workspace first with `meridian workspace`.')
        return null
    }

    const projects = await getProjects(activeWorkspace.slug)
    const active = projects.find((project) => project.id === activeProject?.id)

    if (!projects.length) {
        updateConfig({ activeProject: null })
        console.log(`No projects found in ${activeWorkspace.name}.`)
        return null
    }

    let project = active
    if (forcePrompt || !project) {
        if (projects.length === 1 && !forcePrompt) {
            project = projects[0]
        } else {
            const projectId = await select({
                message: `Select a project in ${activeWorkspace.name}:`,
                choices: projects.map((item) => ({
                    name: `${item.identifier}  ${item.name}${item.id === active?.id ? ' [active]' : ''}`,
                    value: item.id,
                })),
            })
            project = projects.find((item) => item.id === projectId)
        }
    }

    const nextProject = asProjectSelection(project)
    updateConfig({ activeProject: nextProject })
    return nextProject
}

const configureContext = async () => {
    const workspace = await chooseWorkspace()
    if (workspace) {
        await chooseProject()
    }
}

const workspaceAction = async () => {
    try {
        const workspace = await chooseWorkspace({ forcePrompt: true })
        if (workspace) {
            console.log(`Active workspace: ${workspace.name} (${workspace.slug})`)
        }
    } catch (error) {
        console.error(`Could not select workspace: ${error.response?.data?.error || error.message || error}`)
    }
}

const projectAction = async () => {
    try {
        const project = await chooseProject({ forcePrompt: true })
        if (project) {
            console.log(`Active project: ${project.identifier} ${project.name}`)
        }
    } catch (error) {
        console.error(`Could not select project: ${error.response?.data?.error || error.message || error}`)
    }
}

const contextAction = () => {
    const { activeWorkspace, activeProject, user } = readConfig()
    console.log(`User: ${user?.displayName || user?.email || 'Not logged in'}`)
    console.log(`Workspace: ${activeWorkspace ? `${activeWorkspace.name} (${activeWorkspace.slug})` : 'Not selected'}`)
    console.log(`Project: ${activeProject ? `${activeProject.identifier} ${activeProject.name}` : 'Not selected'}`)
}

module.exports = { configureContext, chooseWorkspace, workspaceAction, projectAction, contextAction }