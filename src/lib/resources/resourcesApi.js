import { supabase } from '@/lib/customSupabaseClient';

/**
 * List all resources marked as global (is_global = true).
 */
export async function listGlobalResources() {
	const { data, error } = await supabase
		.from('resources')
		.select('*')
		.eq('is_global', true)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data;
}

/**
 * List resources assigned to a specific user via resource_assignments table.
 */
export async function listResourcesAssignedToUser(userId) {
	// Avoid embedded joins (can break PostgREST schema cache if FK names differ).
	const { data: assigns, error: assignsError } = await supabase
		.from('resource_assignments')
		.select('resource_id, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (assignsError) throw assignsError;

	const ids = (assigns || []).map(a => a.resource_id).filter(Boolean);
	if (ids.length === 0) return [];

	const { data: resources, error: resourcesError } = await supabase
		.from('resources')
		.select('*')
		.in('id', ids);

	if (resourcesError) throw resourcesError;

	const byId = new Map((resources || []).map(r => [r.id, r]));
	return ids.map(id => byId.get(id)).filter(Boolean);
}



/**
 * List resources visible to a user:
 * - Global resources (is_global = true)
 * - Resources assigned to the user via resource_assignments
 *
 * Returns items with an extra field: _scope = 'global' | 'assigned'
 */
export async function listVisibleResourcesForUser(userId) {
	if (!userId) return [];

	const [globals, assigned] = await Promise.all([
		listGlobalResources().catch(() => []),
		listResourcesAssignedToUser(userId).catch(() => []),
	]);

	const byId = new Map();
	(globals || []).forEach((r) => {
		if (r?.id) byId.set(r.id, { ...r, _scope: "global" });
	});
	(assigned || []).forEach((r) => {
		if (!r?.id) return;
		// If a resource is both global and assigned, we keep it as global.
		if (!byId.has(r.id)) byId.set(r.id, { ...r, _scope: "assigned" });
	});

	const merged = Array.from(byId.values());
	merged.sort((a, b) => {
		const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
		const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
		return tb - ta;
	});
	return merged;
}

/**
 * Search for clients (profiles with role='client') by email, name, or username.
 */
export async function searchClients(query, limit = 10) {
	// Using the RPC function 'search_clients' if available, or a direct query
	// Based on database schema provided, there is a 'search_clients' function.

	const { data, error } = await supabase.rpc('search_clients', {
		p_query: query,
		p_limit: limit
	});

	if (error) {
		// Fallback to direct query if RPC fails or doesn't exist
		console.warn('RPC search_clients failed, falling back to direct query', error);
		const { data: fallbackData, error: fallbackError } = await supabase
			.from('profiles')
			.select('id, email, full_name, name, username, role, created_at')
			.eq('role', 'client')
			.or(`email.ilike.%${query}%,full_name.ilike.%${query}%,username.ilike.%${query}%`)
			.limit(limit);

		if (fallbackError) throw fallbackError;
		return fallbackData;
	}

	return data;
}

/**
 * Create a new resource.
 * 1. Upload file to storage bucket 'resources'.
 * 2. Insert record into 'resources' table.
 * 3. If targetUserId is provided, insert into 'resource_assignments'.
 */
export async function createResource({ uploaderId, title, description, isGlobal, targetUserId, file }) {
	if (!file) throw new Error('No file provided');
	if (!uploaderId) throw new Error('Missing uploaderId');

	// 1) Upload file to bucket 'resources'
	const safeName = (file.name || 'archivo').replace(/[^a-zA-Z0-9._-]/g, '_');
	const fileExt = safeName.includes('.') ? safeName.split('.').pop() : '';
	const rand = Math.random().toString(36).slice(2);
	const fileName = `${Date.now()}_${rand}${fileExt ? `.${fileExt}` : ''}`;

	// Path structure: resources/{uid}/{fileName}
	// Note: This "resources/" prefix is part of the object path, not the bucket name.
	// It matches the storage policies created in the resources SQL patch.
	const filePath = `resources/${uploaderId}/${fileName}`;

	const { error: uploadError } = await supabase.storage
		.from('resources')
		.upload(filePath, file, {
			cacheControl: '3600',
			upsert: false,
			contentType: file.type || 'application/octet-stream',
		});

	if (uploadError) throw uploadError;

	// 2) Insert resource row (IMPORTANT: include uploader_id to satisfy RLS policy)
	const { data: resourceData, error: insertError } = await supabase
		.from('resources')
		.insert({
			uploader_id: uploaderId,
			title: title || file.name,
			description: description || null,
			file_bucket: 'resources',
			file_path: filePath,
			file_name: file.name,
			mime: file.type,
			size: file.size,
			is_global: !!isGlobal,
		})
		.select()
		.single();

	if (insertError) {
		// Cleanup uploaded file if DB insert fails
		try {
			await supabase.storage.from('resources').remove([filePath]);
		} catch {
			// ignore cleanup errors
		}
		throw insertError;
	}

	// 3) Assign to user if needed
	if (!isGlobal && targetUserId) {
		const { error: assignError } = await supabase
			.from('resource_assignments')
			.insert({
				resource_id: resourceData.id,
				user_id: targetUserId,
			});

		if (assignError) {
			// We keep the resource row and storage object to avoid data loss.
			// If you prefer transactional behavior, we can move this into an RPC later.
			throw assignError;
		}
	}

	return resourceData;
}


/**
 * Delete a resource.
 * 1. Delete from storage.
 * 2. Delete from database (cascade should handle assignments, but we delete explicitly if needed).
 */
export async function deleteResource(resourceId) {
	// First get the resource to know the file path
	const { data: resource, error: fetchError } = await supabase
		.from('resources')
		.select('*')
		.eq('id', resourceId)
		.single();

	if (fetchError) throw fetchError;
	if (!resource) throw new Error('Resource not found');

	// Delete from storage
	if (resource.file_bucket && resource.file_path) {
		const { error: storageError } = await supabase.storage
			.from(resource.file_bucket)
			.remove([resource.file_path]);

		if (storageError) {
			console.warn('Failed to delete file from storage', storageError);
			// Continue to delete DB record anyway
		}
	}

	// Delete from DB
	const { error: deleteError } = await supabase
		.from('resources')
		.delete()
		.eq('id', resourceId);

	if (deleteError) throw deleteError;

	return true;
}

/**
 * Crea una URL firmada para descargar un archivo privado.
 *
 * Compatibilidad:
 * - createSignedDownloadUrl(bucket, path, expires)
 * - createSignedDownloadUrl(resourceObj, expires)
 */
export async function createSignedDownloadUrl(bucketOrResource, pathOrExpires = 600, maybeExpires) {
	let bucket = bucketOrResource;
	let path = typeof pathOrExpires === 'string' ? pathOrExpires : undefined;
	let expiresInSeconds = typeof pathOrExpires === 'number' ? pathOrExpires : maybeExpires ?? 600;
	let downloadName;

	// Soporta: createSignedDownloadUrl(resource, expires)
	if (bucketOrResource && typeof bucketOrResource === 'object') {
		bucket = bucketOrResource.file_bucket;
		path = bucketOrResource.file_path;
		expiresInSeconds = typeof pathOrExpires === 'number' ? pathOrExpires : 600;
		downloadName = bucketOrResource.original_name || bucketOrResource.title;
	}

	if (!bucket || !path) {
		throw new Error('Recurso sin archivo asociado');
	}

	// Algunos recursos antiguos se guardaron con/ sin prefijo "resources/".
	// Probamos variantes para evitar 404 ("Object not found") por desajustes.
	const candidates = [];
	const pushUnique = (p) => {
		if (p && !candidates.includes(p)) candidates.push(p);
	};
	pushUnique(path);
	if (typeof path === 'string') {
		if (path.startsWith('resources/')) pushUnique(path.replace(/^resources\//, ''));
		else pushUnique(`resources/${path}`);
	}

	let lastError;
	for (const candidate of candidates) {
		const { data, error } = await supabase.storage
			.from(bucket)
			.createSignedUrl(candidate, expiresInSeconds, {
				// Fuerza descarga y preserva el nombre original si está disponible.
				download: downloadName || true,
			});
		if (!error && data?.signedUrl) return data.signedUrl;
		lastError = error;
	}

	throw lastError || new Error('No se pudo generar la URL de descarga');
}

// Legacy exports for compatibility if needed, though not used in the provided AdminResourcesTab
export function fetchResources() {
	return listGlobalResources();
}

export function updateResource() {
	throw new Error('Not implemented');
}