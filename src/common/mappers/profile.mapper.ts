export function mapProfile(profile: any) {
  return {
    id: Number(profile.id),
    auth_user_id: profile.auth_user_id,
    full_name: profile.full_name,
    username: profile.username,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    avatar_path: profile.avatar_path,
    is_active: profile.is_active,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}