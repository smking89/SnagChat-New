export type FollowPermission = "everyone" | "following" | "nobody";
export type InvitePermission = "everyone" | "following" | "nobody";

export type PermissionOption<T extends string> = { value: T; label: string; hint: string };

export const FOLLOW_PERMISSIONS: PermissionOption<FollowPermission>[] = [
  { value: "everyone", label: "Everyone", hint: "Anyone can follow you and see public posts." },
  { value: "following", label: "People you follow", hint: "Only players you follow back can follow you." },
  { value: "nobody", label: "No one", hint: "Nobody new can follow you. Existing followers stay." },
];

export const INVITE_PERMISSIONS: PermissionOption<InvitePermission>[] = [
  { value: "everyone", label: "Everyone", hint: "Any squad owner or member can invite you." },
  { value: "following", label: "People you follow", hint: "Only players you follow can send invites." },
  { value: "nobody", label: "No one", hint: "Squad invites are turned off for your account." },
];

export const DEFAULT_FOLLOW_PERMISSION: FollowPermission = "everyone";
export const DEFAULT_INVITE_PERMISSION: InvitePermission = "everyone";

export function followPermissionLabel(value?: string): string {
  return FOLLOW_PERMISSIONS.find((option) => option.value === value)?.label ?? "Everyone";
}

export function invitePermissionLabel(value?: string): string {
  return INVITE_PERMISSIONS.find((option) => option.value === value)?.label ?? "Everyone";
}
