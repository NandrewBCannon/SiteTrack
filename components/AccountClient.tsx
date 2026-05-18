"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { inputClass } from "@/components/Field";
import { supabase } from "@/lib/supabase";
import { loadSupabaseStore, setActiveWorkspaceId, type WorkspaceSummary } from "@/lib/supabaseStore";
import type { Site, StoreData } from "@/lib/types";

type Role = "admin" | "technician" | "viewer";

type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: Role;
  created_at: string;
};

type SiteMember = {
  id: string;
  site_id: string;
  user_id: string;
  role: Role;
  created_at: string;
};

type Invite = {
  id: string;
  workspace_id: string;
  site_id: string | null;
  email: string;
  token: string;
  role: Role;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

type AccountData = {
  store: StoreData;
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  workspaceMembers: WorkspaceMember[];
  siteMembers: SiteMember[];
  invites: Invite[];
};

const emptyStore: StoreData = {
  sites: [],
  buildings: [],
  rooms: [],
  assets: [],
  asset_photos: [],
  asset_logs: []
};

const roles: Role[] = ["admin", "technician", "viewer"];

export function AccountClient() {
  const { isConfigured, user, signOut } = useAuth();
  const [data, setData] = useState<AccountData>({
    store: emptyStore,
    workspaces: [],
    activeWorkspace: null,
    workspaceMembers: [],
    siteMembers: [],
    invites: []
  });
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(isConfigured && user));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshAccount() {
    if (!isConfigured || !user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const result = await loadSupabaseStore();
      const workspaceId = result.workspace?.id;
      const siteIds = result.data.sites.map((site) => site.id);
      let activeWorkspace = result.workspace;

      if (workspaceId) {
        const joinCodeResult = await supabase!.from("workspaces").select("join_code").eq("id", workspaceId).maybeSingle();
        if (!joinCodeResult.error && activeWorkspace) {
          activeWorkspace = { ...activeWorkspace, join_code: joinCodeResult.data?.join_code ?? undefined };
        }
      }

      const [membersResult, siteMembersResult, invitesResult] = await Promise.all([
        workspaceId
          ? supabase!.from("workspace_members").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        siteIds.length
          ? supabase!.from("site_members").select("*").in("site_id", siteIds).order("created_at", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        workspaceId
          ? supabase!.from("invites").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null })
      ]);

      const loadError = membersResult.error || siteMembersResult.error || invitesResult.error;
      if (loadError) throw loadError;

      setData({
        store: result.data,
        workspaces: result.workspaces,
        activeWorkspace,
        workspaceMembers: (membersResult.data ?? []) as WorkspaceMember[],
        siteMembers: (siteMembersResult.data ?? []) as SiteMember[],
        invites: (invitesResult.data ?? []) as Invite[]
      });
      setSelectedSiteId((current) => current || result.data.sites[0]?.id || "");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (cancelled) return;
      await refreshAccount();
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, user]);

  const initials = useMemo(() => {
    const email = user?.email ?? "Site user";
    return email.slice(0, 2).toUpperCase();
  }, [user]);

  const isAdmin = data.activeWorkspace?.role === "admin";

  async function sendResetEmail() {
    if (!supabase || !user?.email) return;
    setMessage("");
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`
      });
      if (resetError) throw resetError;
      setMessage("Password reset email sent.");
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  function switchWorkspace(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
    window.location.reload();
  }

  if (!isConfigured) {
    return (
      <AccountShell title="Account unavailable" subtitle="Connect Supabase keys to manage a real account.">
        <p className="rounded-[8px] bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">The app is currently in local demo mode.</p>
      </AccountShell>
    );
  }

  if (!user) {
    return (
      <AccountShell title="Sign in required" subtitle="Your account page is available after login.">
        <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-semibold text-white">
          Go to Login
        </Link>
      </AccountShell>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="glass overflow-hidden rounded-[8px] p-5 shadow-panel sm:p-7 animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[8px] bg-gradient-to-br from-ink via-signal to-mint text-xl font-semibold text-white shadow-panel">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-steel shadow-sm">
                <ShieldCheck size={14} className="text-signal" />
                Account
              </p>
              <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight">Your SiteTrack profile</h1>
              <p className="mt-1 truncate text-sm text-steel">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </section>

      {message ? <p className="rounded-[8px] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-[8px] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      {isLoading ? (
        <div className="rounded-[8px] border border-zinc-200 bg-white p-6 text-center shadow-panel">
          <Loader2 className="mx-auto animate-spin text-signal" size={28} />
          <p className="mt-3 text-sm font-semibold text-steel">Loading account...</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-5">
            <WorkspaceCard
              activeWorkspace={data.activeWorkspace}
              workspaces={data.workspaces}
              onSwitch={switchWorkspace}
              isAdmin={isAdmin}
              onChanged={refreshAccount}
              onMessage={setMessage}
              onError={setError}
            />
            <WorkspaceUsersCard
              activeWorkspace={data.activeWorkspace}
              currentUserId={user.id}
              currentUserEmail={user.email ?? ""}
              isAdmin={isAdmin}
              members={data.workspaceMembers}
              invites={data.invites.filter((invite) => !invite.site_id)}
              onChanged={refreshAccount}
              onMessage={setMessage}
              onError={setError}
            />
          </section>
          <aside className="grid content-start gap-5">
            <JobSiteAccessCard
              currentUserId={user.id}
              isAdmin={isAdmin}
              selectedSiteId={selectedSiteId}
              onSelectSite={setSelectedSiteId}
              sites={data.store.sites}
              workspaceMembers={data.workspaceMembers}
              siteMembers={data.siteMembers}
              invites={data.invites.filter((invite) => !!invite.site_id)}
              workspaceId={data.activeWorkspace?.id ?? ""}
              onChanged={refreshAccount}
              onMessage={setMessage}
              onError={setError}
            />
          </aside>
          <div className="lg:col-span-2">
            <SecurityCard email={user.email ?? ""} onResetPassword={() => void sendResetEmail()} />
          </div>
        </div>
      )}
    </div>
  );
}

function AccountShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center">
      <section className="w-full rounded-[8px] border border-zinc-200 bg-white p-6 text-center shadow-panel animate-rise">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[8px] bg-ink text-white">
          <UserRound size={23} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-steel">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

function WorkspaceCard({
  activeWorkspace,
  workspaces,
  onSwitch,
  isAdmin,
  onChanged,
  onMessage,
  onError
}: {
  activeWorkspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
  onSwitch: (workspaceId: string) => void;
  isAdmin: boolean;
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const joinCode = activeWorkspace?.join_code ?? "";

  async function regenerateJoinCode() {
    if (!supabase || !activeWorkspace) return;
    setIsRegenerating(true);
    onError("");
    onMessage("");
    try {
      const { error } = await supabase.rpc("regenerate_workspace_join_code", { target_workspace_id: activeWorkspace.id });
      if (error) throw error;
      onMessage("Workspace join code regenerated.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <section className="rounded-[8px] border border-zinc-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><Building2 size={17} className="text-signal" />Current workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{activeWorkspace?.name ?? "No workspace yet"}</h2>
          <p className="mt-1 text-sm text-steel">Role: {activeWorkspace?.role ?? "None"}</p>
        </div>
        <Link href="/workspace/new" className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-semibold text-white">New</Link>
      </div>
      <div className="mt-4 grid gap-2">
        {workspaces.length ? workspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            onClick={() => onSwitch(workspace.id)}
            className={`flex items-center justify-between rounded-[8px] border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
              workspace.id === activeWorkspace?.id ? "border-signal bg-blue-50" : "border-zinc-200 bg-zinc-50"
            }`}
          >
            <span>
              <span className="block text-sm font-semibold text-ink">{workspace.name}</span>
              <span className="text-xs font-medium text-steel">{workspace.role ?? "member"}</span>
            </span>
            {workspace.id === activeWorkspace?.id ? <CheckCircle2 size={18} className="text-signal" /> : <ArrowRight size={16} className="text-steel" />}
          </button>
        )) : (
          <p className="rounded-[8px] bg-zinc-50 px-3 py-3 text-sm text-steel">Create a workspace to start adding sites.</p>
        )}
      </div>

      <div className="mt-4 rounded-[8px] border border-zinc-200 bg-zinc-50 p-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><KeyRound size={16} className="text-coral" />Workspace join code</p>
        <p className="mt-1 text-xs leading-5 text-steel">New users can create an account, open the join page, and enter this code.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="rounded-[8px] bg-white px-3 py-3 font-mono text-lg font-semibold tracking-[0.12em] text-ink shadow-sm">
            {joinCode || "Not enabled"}
          </div>
          <button
            type="button"
            disabled={!joinCode}
            onClick={() => copyText(joinCode, onMessage, onError, "Join code copied.")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-3 text-sm font-semibold text-ink shadow-sm disabled:opacity-40"
          >
            <Copy size={16} />
            Code
          </button>
          <button
            type="button"
            disabled={!joinCode}
            onClick={() => copyText(buildJoinUrl("code", joinCode), onMessage, onError, "Join link copied.")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-white px-3 text-sm font-semibold text-ink shadow-sm disabled:opacity-40"
          >
            <Copy size={16} />
            Link
          </button>
        </div>
        {!joinCode ? <p className="mt-2 text-xs font-semibold text-amber-700">Run supabase/workspace_join_codes.sql to enable workspace codes.</p> : null}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => void regenerateJoinCode()}
            disabled={!activeWorkspace || isRegenerating}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            {isRegenerating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Regenerate Code
          </button>
        ) : null}
      </div>
    </section>
  );
}

function WorkspaceUsersCard({
  activeWorkspace,
  currentUserId,
  currentUserEmail,
  isAdmin,
  members,
  invites,
  onChanged,
  onMessage,
  onError
}: {
  activeWorkspace: WorkspaceSummary | null;
  currentUserId: string;
  currentUserEmail: string;
  isAdmin: boolean;
  members: WorkspaceMember[];
  invites: Invite[];
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("technician");
  const workspaceId = activeWorkspace?.id ?? "";

  async function inviteUser(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !workspaceId) return;
    onError("");
    onMessage("");
    try {
      const { error } = await supabase.from("invites").insert({ workspace_id: workspaceId, email: email.trim(), role });
      if (error) throw error;
      setEmail("");
      setRole("technician");
      onMessage("Workspace invite saved. Copy the invite link from Pending invites and send it to the user.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    }
  }

  async function updateRole(memberId: string, nextRole: Role) {
    if (!supabase) return;
    onError("");
    try {
      const { error } = await supabase.from("workspace_members").update({ role: nextRole }).eq("id", memberId);
      if (error) throw error;
      onMessage("Workspace role updated.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    }
  }

  async function removeMember(memberId: string, memberUserId: string) {
    if (!supabase || memberUserId === currentUserId) return;
    const ok = window.confirm("Remove this user from the workspace?");
    if (!ok) return;
    onError("");
    try {
      const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
      if (error) throw error;
      onMessage("Workspace member removed.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    }
  }

  return (
    <section className="rounded-[8px] border border-zinc-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><UsersRound size={17} className="text-signal" />Workspace editor</p>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-steel">{members.length} users</span>
      </div>

      <div className="mt-4 grid gap-2">
        {members.map((member) => (
          <div key={member.id} className="grid gap-2 rounded-[8px] border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-[1fr_150px_40px] sm:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{member.user_id === currentUserId ? currentUserEmail : `User ${member.user_id.slice(0, 8)}`}</p>
              <p className="mt-1 text-xs text-steel">{member.user_id === currentUserId ? "You" : member.user_id}</p>
            </div>
            <select className={inputClass} value={member.role} disabled={!isAdmin} onChange={(event) => void updateRole(member.id, event.target.value as Role)}>
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button
              type="button"
              disabled={!isAdmin || member.user_id === currentUserId}
              onClick={() => void removeMember(member.id, member.user_id)}
              className="inline-flex h-10 items-center justify-center rounded-[8px] bg-white text-rose-700 shadow-sm disabled:opacity-40"
              aria-label="Remove workspace member"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {isAdmin ? (
        <form onSubmit={inviteUser} className="mt-4 grid gap-2 rounded-[8px] border border-zinc-200 bg-white p-3 sm:grid-cols-[1fr_150px_110px]">
          <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@company.com" required />
          <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as Role)}>
            {roles.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-3 text-sm font-semibold text-white">
            <UserPlus size={16} />
            Invite
          </button>
        </form>
      ) : null}

      <PendingInvites invites={invites} emptyText="No pending workspace invites." onMessage={onMessage} onError={onError} />
    </section>
  );
}

function JobSiteAccessCard({
  currentUserId,
  isAdmin,
  selectedSiteId,
  onSelectSite,
  sites,
  workspaceMembers,
  siteMembers,
  invites,
  workspaceId,
  onChanged,
  onMessage,
  onError
}: {
  currentUserId: string;
  isAdmin: boolean;
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  sites: Site[];
  workspaceMembers: WorkspaceMember[];
  siteMembers: SiteMember[];
  invites: Invite[];
  workspaceId: string;
  onChanged: () => Promise<void>;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("technician");
  const [memberUserId, setMemberUserId] = useState("");
  const selectedSite = sites.find((site) => site.id === selectedSiteId) ?? sites[0];
  const selectedSiteMembers = selectedSite ? siteMembers.filter((member) => member.site_id === selectedSite.id) : [];
  const selectedInvites = selectedSite ? invites.filter((invite) => invite.site_id === selectedSite.id) : [];

  async function addExistingMember(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !selectedSite || !memberUserId) return;
    onError("");
    try {
      const { error } = await supabase.from("site_members").upsert({ site_id: selectedSite.id, user_id: memberUserId, role });
      if (error) throw error;
      setMemberUserId("");
      setRole("technician");
      onMessage("Job-site access updated.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    }
  }

  async function inviteToSite(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || !selectedSite || !workspaceId) return;
    onError("");
    try {
      const { error } = await supabase.from("invites").insert({ workspace_id: workspaceId, site_id: selectedSite.id, email: email.trim(), role });
      if (error) throw error;
      setEmail("");
      setRole("technician");
      onMessage("Job-site invite saved. Copy the invite link from Pending invites and send it to the user.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    }
  }

  async function updateSiteRole(memberId: string, nextRole: Role) {
    if (!supabase) return;
    onError("");
    try {
      const { error } = await supabase.from("site_members").update({ role: nextRole }).eq("id", memberId);
      if (error) throw error;
      onMessage("Job-site role updated.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    }
  }

  async function removeSiteMember(memberId: string) {
    if (!supabase) return;
    const ok = window.confirm("Remove this user's job-site access?");
    if (!ok) return;
    onError("");
    try {
      const { error } = await supabase.from("site_members").delete().eq("id", memberId);
      if (error) throw error;
      onMessage("Job-site access removed.");
      await onChanged();
    } catch (caught) {
      onError(getErrorMessage(caught));
    }
  }

  return (
    <section className="rounded-[8px] border border-zinc-200 bg-white p-5 shadow-panel">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><MapPinned size={17} className="text-coral" />Job-site access</p>
      <p className="mt-2 text-xs leading-5 text-steel">This controls who can access a job site. Site names, buildings, and rooms stay in the Sites tab.</p>

      {sites.length ? (
        <div className="mt-4 grid gap-3">
          <select className={inputClass} value={selectedSite?.id ?? ""} onChange={(event) => onSelectSite(event.target.value)}>
            {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>

          <div className="grid gap-2">
            {selectedSiteMembers.length ? selectedSiteMembers.map((member) => (
              <div key={member.id} className="grid gap-2 rounded-[8px] bg-zinc-50 p-3">
                <p className="truncate text-sm font-semibold text-ink">{member.user_id === currentUserId ? "You" : `User ${member.user_id.slice(0, 8)}`}</p>
                <div className="grid grid-cols-[1fr_40px] gap-2">
                  <select className={inputClass} value={member.role} disabled={!isAdmin} onChange={(event) => void updateSiteRole(member.id, event.target.value as Role)}>
                    {roles.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => void removeSiteMember(member.id)}
                    className="inline-flex h-11 items-center justify-center rounded-[8px] bg-white text-rose-700 shadow-sm disabled:opacity-40"
                    aria-label="Remove site member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <p className="rounded-[8px] bg-zinc-50 px-3 py-3 text-sm text-steel">No specific site members yet. Workspace members can still access this site based on workspace role.</p>
            )}
          </div>

          {isAdmin ? (
            <>
              <form onSubmit={addExistingMember} className="grid gap-2 rounded-[8px] border border-zinc-200 p-3">
                <p className="text-sm font-semibold text-ink">Add existing workspace user</p>
                <select className={inputClass} value={memberUserId} onChange={(event) => setMemberUserId(event.target.value)} required>
                  <option value="">Choose user</option>
                  {workspaceMembers.map((member) => (
                    <option key={member.id} value={member.user_id}>
                      {member.user_id === currentUserId ? "You" : `User ${member.user_id.slice(0, 8)}`} | {member.role}
                    </option>
                  ))}
                </select>
                <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as Role)}>
                  {roles.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-semibold text-white">Add Access</button>
              </form>

              <form onSubmit={inviteToSite} className="grid gap-2 rounded-[8px] border border-zinc-200 p-3">
                <p className="text-sm font-semibold text-ink">Invite by email to this job site</p>
                <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@company.com" required />
                <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as Role)}>
                  {roles.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-semibold text-white">Invite to Site</button>
              </form>
            </>
          ) : null}

          <PendingInvites invites={selectedInvites} emptyText="No pending job-site invites." onMessage={onMessage} onError={onError} />
        </div>
      ) : (
        <p className="mt-4 rounded-[8px] bg-zinc-50 px-3 py-3 text-sm text-steel">Create a job site in the Sites tab before assigning site access.</p>
      )}
    </section>
  );
}

function PendingInvites({
  invites,
  emptyText,
  onMessage,
  onError
}: {
  invites: Invite[];
  emptyText: string;
  onMessage: (message: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-steel">Pending invites</p>
      <div className="mt-2 grid gap-2">
        {invites.length ? invites.map((invite) => (
          <div key={invite.id} className="grid gap-2 rounded-[8px] bg-blue-50 px-3 py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{invite.email}</p>
              <p className="text-xs text-steel">{invite.role} | expires {new Date(invite.expires_at).toLocaleDateString()}</p>
            </div>
            <button
              type="button"
              onClick={() => copyText(buildJoinUrl("token", invite.token), onMessage, onError, "Invite link copied.")}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] bg-white px-3 text-xs font-semibold text-ink shadow-sm"
            >
              <Copy size={15} />
              Copy Link
            </button>
          </div>
        )) : (
          <p className="rounded-[8px] bg-zinc-50 px-3 py-3 text-sm text-steel">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function buildJoinUrl(kind: "code" | "token", value: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/join?${kind}=${encodeURIComponent(value)}`;
}

async function copyText(
  text: string,
  onMessage: (message: string) => void,
  onError: (message: string) => void,
  successMessage: string
) {
  onError("");
  try {
    await navigator.clipboard.writeText(text);
    onMessage(successMessage);
  } catch {
    onError("Could not copy automatically. Select the text and copy it manually.");
  }
}

function SecurityCard({ email, onResetPassword }: { email: string; onResetPassword: () => void }) {
  return (
    <section className="rounded-[8px] border border-zinc-200 bg-white p-5 shadow-panel">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink"><LockKeyhole size={17} className="text-mint" />Security</p>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="rounded-[8px] bg-zinc-50 p-3">
          <p className="font-semibold text-ink">Email</p>
          <p className="mt-1 break-all text-steel">{email}</p>
        </div>
        <div className="rounded-[8px] bg-zinc-50 p-3">
          <p className="font-semibold text-ink">MFA</p>
          <p className="mt-1 text-steel">Not enabled yet</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onResetPassword}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-zinc-200 bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
      >
        <Mail size={17} />
        Send Password Reset
      </button>
    </section>
  );
}

function getErrorMessage(caught: unknown) {
  if (caught instanceof Error) return caught.message;
  if (caught && typeof caught === "object") {
    const error = caught as { message?: string; details?: string; hint?: string; code?: string };
    return [error.message, error.details, error.hint, error.code].filter(Boolean).join(" ");
  }
  return "Could not load account.";
}
