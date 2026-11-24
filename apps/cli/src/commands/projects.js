const Table = require('cli-table3')
const { getWorkspaces, getAllProjects, getProjects, createProject, updateProject } = require('../api/workspaces')
const { chooseWorkspace } = require('./context')
const { readConfig, updateConfig } = require('../utils/config')

const getErrorMessage = (error) => error.response?.data?.details || error.response?.data?.error || error.message || String(error)

const resolveWorkspace = async (slug) => {
    if (slug) {
        const workspaces = await getWorkspaces()
        const workspace = workspaces.find((item) => item.slug === slug)
        if (!workspace) throw new Error(`Workspace not found: ${slug}`)
        return workspace
    }

    const workspace = await chooseWorkspace()
    if (!workspace) throw new Error('Select or create a workspace before managing projects.')
    return workspace
}

const listAction = async (options) => {
    try {
        const workspace = await resolveWorkspace(options.workspace)
        const projects = await getProjects(workspace.slug)
        if (!projects.length) {
            console.log(`No projects found in ${workspace.name}.`)
            return
        }

        const activeProjectId = readConfig().activeProject?.id
        const table = new Table({ head: ['Active', 'Icon', 'Identifier', 'Name', 'Status', 'Tasks'] })
        for (const project of projects) {
            table.push([
                project.id === activeProjectId ? '*' : '',
                project.icon || '',
                project.identifier,
                project.name,
                project.status,
                project._count?.tasks ?? 0,
            ])
        }
        console.log(`Projects in ${workspace.name} (${workspace.slug})`)
        console.log(table.toString())
    } catch (error) {
        console.error(`Could not list projects: ${getErrorMessage(error)}`)
    }
}

const createAction = async (options) => {
    try {
        const workspace = await resolveWorkspace(options.workspace)
        const data = { name: options.name }
        if (options.description !== undefined) data.description = options.description
        if (options.icon !== undefined) data.icon = options.icon
        if (options.identifier !== undefined) data.identifier = options.identifier

        const project = await createProject(workspace.slug, data)
        updateConfig({
            activeWorkspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
            activeProject: { id: project.id, name: project.name, identifier: project.identifier },
        })
        console.log(`Created ${project.identifier} ${project.name} in ${workspace.name}.`)
        console.log('It is now the active project.')
    } catch (error) {
        console.error(`Could not create project:`)
        console.error(getErrorMessage(error));
    }
}

const resolveProject = async (reference, workspaceSlug) => {
    const projects = workspaceSlug ? await getProjects(workspaceSlug) : await getAllProjects()
    const normalizedReference = reference.toLowerCase()
    let matches = projects.filter((project) =>
        project.id === reference || project.identifier?.toLowerCase() === normalizedReference,
    )

    if (!workspaceSlug && matches.length > 1) {
        const activeSlug = readConfig().activeWorkspace?.slug
        const activeMatches = matches.filter((project) => project.workspace?.slug === activeSlug)
        if (activeMatches.length) matches = activeMatches
    }

    if (!matches.length) throw new Error(`No project matches "${reference}". Use its ID or identifier from "meridian project list".`)
    if (matches.length > 1) throw new Error(`"${reference}" matches projects in multiple workspaces; pass --workspace <slug>.`)
    return matches[0]
}

const editAction = async (reference, options) => {
    try {
        reference = reference || options.id
        if (!reference) throw new Error('Provide a project ID or identifier as an argument or with --id.')

        const data = {}
        if (options.name !== undefined) data.name = options.name
        if (options.description !== undefined) data.description = options.description
        if (options.icon !== undefined) data.icon = options.icon
        if (options.clearDescription) data.description = null
        if (options.clearIcon) data.icon = null
        if (!Object.keys(data).length) {
            throw new Error('Provide at least one of --name, --description, --icon, --clear-description, or --clear-icon.')
        }

        const project = await resolveProject(reference, options.workspace)
        const updated = await updateProject(project.id, data)
        const activeProject = readConfig().activeProject
        if (activeProject?.id === updated.id) {
            updateConfig({ activeProject: { id: updated.id, name: updated.name, identifier: updated.identifier } })
        }
        console.log(`Updated ${updated.identifier} ${updated.name}.`)
    } catch (error) {
        console.error(`Could not update project: ${getErrorMessage(error)}`)
    }
}

module.exports = { listAction, createAction, editAction }