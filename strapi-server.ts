import routes from './server/routes';
import controllers from './server/controllers';
import services from './server/services';
import contentTypes from './server/content-types';
import config from './server/config';

const PLUGIN_ID = 'ai-youtube-article';

const ACTIONS = [
	{
		section: 'plugins',
		displayName: 'Access the AI YouTube Article plugin',
		uid: 'read',
		pluginName: PLUGIN_ID,
	},
	{
		section: 'plugins',
		displayName: 'Create jobs',
		uid: 'jobs.create',
		pluginName: PLUGIN_ID,
	},
	{
		section: 'plugins',
		displayName: 'Read jobs',
		uid: 'jobs.read',
		pluginName: PLUGIN_ID,
	},
	{
		section: 'plugins',
		displayName: 'Update jobs',
		uid: 'jobs.update',
		pluginName: PLUGIN_ID,
	},
	{
		section: 'plugins',
		displayName: 'Delete jobs',
		uid: 'jobs.delete',
		pluginName: PLUGIN_ID,
	},
	{
		section: 'settings',
		category: 'ai-youtube-article',
		displayName: 'Read settings',
		uid: 'settings.read',
		pluginName: PLUGIN_ID,
		subCategory: 'general',
	},
	{
		section: 'settings',
		category: 'ai-youtube-article',
		displayName: 'Update settings',
		uid: 'settings.update',
		pluginName: PLUGIN_ID,
		subCategory: 'general',
	},
];

async function ensureSuperAdminHasPermissions(strapi: any) {
	try {
		const superAdminRole = await strapi
			.db
			.query('admin::role')
			.findOne({ where: { code: 'strapi-super-admin' } });

		if (!superAdminRole) {
			console.error('❌ [AI YouTube] Super Admin role not found');
			return;
		}

		console.log(`✅ [AI YouTube] Found Super Admin role (ID: ${superAdminRole.id})`);

		for (const action of ACTIONS) {
			const actionId = `plugin::${PLUGIN_ID}.${action.uid}`;

			// Query permissions WITH role populated to properly check existing assignments
			const permissions = await strapi.db.query('admin::permission').findMany({
				where: { action: actionId, subject: null },
				populate: ['role'],
			});

			console.log(`🔍 [AI YouTube] Checking ${actionId}: found ${permissions.length} existing permission(s)`);

			const permissionForSuperAdmin = permissions.find((p: any) => {
				const roleId = p.role?.id || p.role;
				return roleId === superAdminRole.id;
			});

			if (permissionForSuperAdmin) {
				console.log(`✅ [AI YouTube] Permission ${actionId} already assigned to Super Admin`);
				continue;
			}

			// Check for orphan permission (no role assigned)
			const orphanPermission = permissions.find((p: any) => !p.role);
			if (orphanPermission) {
				console.log(`🔧 [AI YouTube] Assigning orphan permission ${actionId} to Super Admin`);
				await strapi.db.query('admin::permission').update({
					where: { id: orphanPermission.id },
					data: { role: superAdminRole.id },
				});
				console.log(`✅ [AI YouTube] Successfully updated permission ${actionId}`);
				continue;
			}

			// Create new permission
			console.log(`➕ [AI YouTube] Creating new permission ${actionId} for Super Admin`);
			const newPermission = await strapi.db.query('admin::permission').create({
				data: {
					action: actionId,
					subject: null,
					role: superAdminRole.id,
					actionParameters: {},
					properties: {},
					conditions: [],
				},
			});
			console.log(`✅ [AI YouTube] Successfully created permission ${actionId} (ID: ${newPermission.id})`);
		}

		console.log('✅ [AI YouTube] All permissions processed successfully');
	} catch (error) {
		console.error('❌ [AI YouTube] Error in ensureSuperAdminHasPermissions:', error);
		throw error;
	}
}

// Strapi v5 local plugins must export a plain object (NOT a factory function).
// The object should have routes, controllers, services, contentTypes, config, register, and bootstrap.
export default {
	routes,
	controllers,
	services,
	contentTypes,
	config,

	// Register phase: Register actions with actionProvider
	async register({ strapi }: { strapi: any }) {
		console.log('📝 [AI YouTube] Registering plugin actions...');
		
		// Debug: Log routes structure
		console.log('🗺️ [AI YouTube] Routes object type:', typeof routes);
		console.log('🗺️ [AI YouTube] Routes keys:', Object.keys(routes || {}));
		if (routes?.admin) {
			console.log('🗺️ [AI YouTube] Admin routes type:', typeof routes.admin);
			console.log('🗺️ [AI YouTube] Admin routes full:', JSON.stringify(routes.admin, null, 2));
		}
		
		try {
			await strapi.service('admin::permission').actionProvider.registerMany(ACTIONS);
			console.log('✅ [AI YouTube] Actions registered with actionProvider');
		} catch (error) {
			console.error('❌ [AI YouTube] Error registering actions:', error);
			throw error;
		}
	},

	// Bootstrap phase: Assign permissions to Super Admin
	async bootstrap({ strapi }: { strapi: any }) {
		try {
			await ensureSuperAdminHasPermissions(strapi);
		} catch (error) {
			console.error('❌ [AI YouTube] Error in bootstrap:', error);
		}
	},
};
