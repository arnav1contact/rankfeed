// eslint-disable-next-line import/no-unresolved -- Supabase's Deno runtime resolves npm: specifiers.
import { withSupabase } from 'npm:@supabase/server@^1';

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'DELETE') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const userId = context.userClaims?.sub;
    if (!userId) {
      return Response.json({ error: 'Authenticated user id is missing' }, { status: 401 });
    }

    const { error } = await context.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ deleted: true });
  }),
};
