const Table = require('cli-table3')
const { getTasks, getTask, createTask, updateTask, createTaskComment } = require('../api/tasks')
const { getAllProjects } = require('../api/workspaces')
const { getWorkspace } = require('../api/workspaces')
const { readConfig } = require('../utils/config')

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']
const TASK_PRIORITIES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const errorMessage = (error) => error.response?.data?.error || error.message || String(error)

const normalizeEnum = (value, allowed, label) => {
	const normalized = value.toUpperCase().replace(/[- ]/g, '_')
	if (!allowed.includes(normalized)) {
		throw new Error(`${label} must be one of: ${allowed.join(', ')}.`)
	}
	return normalized
}

const normalizeDueDate = (value) => {
	const dueDate = new Date(value)
	if (Number.isNaN(dueDate.getTime())) {
		throw new Error('Due date must be a valid date, for example 2026-12-31.')
	}
	return dueDate.toISOString()
}

const resolveProject = async (reference) => {
	const { activeWorkspace, activeProject } = readConfig()
	const projects = await getAllProjects()

	if (!reference && activeProject?.id) {
		const active = projects.find((project) => project.id === activeProject.id)
		if (active) return active
	}
	if (!reference) {
		throw new Error('No active project. Select one with `meridian project use` or pass --project.')
	}

	const normalized = reference.toLowerCase()
	let matches = projects.filter((project) =>
		project.id === reference || project.identifier?.toLowerCase() === normalized,
	)
	if (matches.length > 1 && activeWorkspace?.slug) {
		const inActiveWorkspace = matches.filter((project) => project.workspace?.slug === activeWorkspace.slug)
		if (inActiveWorkspace.length) matches = inActiveWorkspace
	}
	if (!matches.length) throw new Error(`Project not found: ${reference}`)
	if (matches.length > 1) throw new Error(`Project identifier "${reference}" is ambiguous; use its project ID.`)
	return matches[0]
}

const resolveTask = async (reference, projectReference) => {
	if (UUID_PATTERN.test(reference)) return getTask(reference)

	const { activeProject } = readConfig()
	const projects = projectReference
		? [await resolveProject(projectReference)]
		: activeProject?.id
			? [await resolveProject(activeProject.id)]
			: await getAllProjects()

	const matches = []
	for (const project of projects) {
		const tasks = await getTasks(project.id)
		const match = tasks.find((task) =>
			task.key?.toLowerCase() === reference.toLowerCase() ||
			task.formattedIdentifier?.toLowerCase() === reference.toLowerCase(),
		)
		if (match) matches.push(match)
	}

	if (!matches.length) throw new Error(`Task not found: ${reference}`)
	if (matches.length > 1) throw new Error(`Task key "${reference}" is ambiguous; pass --project.`)
	return getTask(matches[0].id)
}

const resolveMemberId = async (workspaceSlug, reference) => {
	if (UUID_PATTERN.test(reference)) return reference

	const workspace = await getWorkspace(workspaceSlug)
	const normalized = reference.trim().toLowerCase()
	const members = workspace.members || []
	const matches = members.filter(({ user }) => {
		const email = user?.email?.toLowerCase()
		const displayName = user?.displayName?.toLowerCase()
		const username = email?.split('@')[0]
		return email === normalized || displayName === normalized || username === normalized
	})

	if (!matches.length) throw new Error(`No workspace member matches "${reference}".`)
	if (matches.length > 1) throw new Error(`"${reference}" matches multiple workspace members; use their email or user ID.`)
	return matches[0].userId
}

const listAction = async (options = {}) => {
	try {
		const project = await resolveProject(options.project)
		const filters = {}
		if (options.status) filters.status = normalizeEnum(options.status, TASK_STATUSES, 'Status')
		if (options.assignee) {
			const workspaceSlug = project.workspace?.slug || readConfig().activeWorkspace?.slug
			if (!workspaceSlug) throw new Error('Could not determine the project workspace to resolve this assignee.')
			filters.assigneeId = await resolveMemberId(workspaceSlug, options.assignee)
		}

		const tasks = await getTasks(project.id, filters)
		if (!tasks.length) {
			console.log(`No tasks found in ${project.identifier}${options.status ? ` with status ${filters.status}` : ''}.`)
			return
		}

		const table = new Table({ head: ['Key', 'Status', 'Priority', 'Title', 'Assignee'] })
		for (const task of tasks) {
			table.push([
				task.key,
				task.status,
				task.priority,
				task.title,
				(task.assignees || []).map(({ user }) => user.displayName || user.email).join(', ') || '-',
			])
		}
		console.log(`Tasks in ${project.identifier} ${project.name}`)
		console.log(table.toString())
	} catch (error) {
		console.error(`Could not list tasks: ${errorMessage(error)}`)
	}
}

const createAction = async (options) => {
	try {
		const parent = options.parent ? await resolveTask(options.parent, options.project) : null
		const project = parent
			? parent.project
			: await resolveProject(options.project)
		if (parent && options.project) {
			const requestedProject = await resolveProject(options.project)
			if (requestedProject.id !== parent.project.id) {
				throw new Error('The parent task must belong to the selected project.')
			}
		}

		const data = { title: options.title }
		if (options.description !== undefined) data.description = options.description
		if (options.dueDate) data.dueDate = normalizeDueDate(options.dueDate)
		if (options.priority) data.priority = normalizeEnum(options.priority, TASK_PRIORITIES, 'Priority')
		if (parent) data.parentId = parent.id

		const task = await createTask(project.id, data)
		console.log(`Created ${parent ? 'subtask' : 'task'} ${task.key}: ${task.title}`)
	} catch (error) {
		console.error(`Could not create task: ${errorMessage(error)}`)
	}
}

const viewAction = async (reference, options) => {
	try {
		const task = await resolveTask(reference, options.project)
		const assignees = (task.assignees || []).map(({ user }) => user.displayName || user.email).join(', ') || 'Unassigned'
		console.log(`${task.key}  ${task.title}`)
		console.log(`Project: ${task.project?.identifier || 'Unknown'} ${task.project?.name || ''}`.trim())
		console.log(`Status: ${task.status}    Priority: ${task.priority}`)
		console.log(`Assignee: ${assignees}`)
		console.log(`Created by: ${task.createdBy?.displayName || task.createdBy?.email || 'Unknown'}`)
		if (task.dueDate) console.log(`Due: ${new Date(task.dueDate).toLocaleDateString()}`)
		if (task.description) console.log(`Description: ${task.description}`)
		if (task.subTasks?.length) {
			console.log('\nSubtasks:')
			for (const subTask of task.subTasks) {
				console.log(`- ${task.project?.identifier}-${subTask.number} [${subTask.status}] ${subTask.title}`)
			}
		}
		if (task.comments?.length) {
			console.log('\nComments:')
			for (const comment of task.comments) {
				const author = comment.author?.displayName || comment.author?.email || 'Unknown'
				console.log(`- ${author}: ${comment.body}`)
			}
		}
	} catch (error) {
		console.error(`Could not view task: ${errorMessage(error)}`)
	}
}

const updateAction = async (reference, options) => {
	try {
		const data = {}
		if (options.status) data.status = normalizeEnum(options.status, TASK_STATUSES, 'Status')
		if (options.priority) data.priority = normalizeEnum(options.priority, TASK_PRIORITIES, 'Priority')
		if (options.description !== undefined) data.description = options.description
		if (options.clearDescription) data.description = null
		if (options.dueDate) data.dueDate = normalizeDueDate(options.dueDate)
		if (options.clearDueDate) data.dueDate = null
		if (!Object.keys(data).length) {
			throw new Error('Provide at least one of --status, --priority, --description, --clear-description, --due-date, or --clear-due-date.')
		}

		const task = await resolveTask(reference, options.project)
		const updated = await updateTask(task.id, data)
		console.log(`Updated ${updated.key}.`)
	} catch (error) {
		console.error(`Could not update task: ${errorMessage(error)}`)
	}
}

const assignAction = async (reference, username, options) => {
	try {
		const task = await resolveTask(reference, options.project)
		const workspaceSlug = task.project?.workspace?.slug || readConfig().activeWorkspace?.slug
		if (!workspaceSlug) throw new Error('Could not determine the task workspace.')
		const userId = await resolveMemberId(workspaceSlug, username)
		const assigneeIds = [...new Set([
			...(task.assignees || []).map(({ user }) => user.id),
			userId,
		])]
		const updated = await updateTask(task.id, { assigneeIds })
		console.log(`Assigned ${username} to ${updated.key}.`)
	} catch (error) {
		console.error(`Could not assign task: ${errorMessage(error)}`)
	}
}

const commentAction = async (reference, options) => {
	try {
		const task = await resolveTask(reference, options.project)
		await createTaskComment(task.id, options.body)
		console.log(`Comment added to ${task.key}.`)
	} catch (error) {
		console.error(`Could not add comment: ${errorMessage(error)}`)
	}
}

module.exports = { listAction, createAction, viewAction, updateAction, assignAction, commentAction }
