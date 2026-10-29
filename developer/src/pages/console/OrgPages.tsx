import { useState } from "react";
import { Icon } from "../../components/Icon";
import { PageHead } from "../../components/console-page";
import { Modal } from "../../components/Overlay";
import { Button, Pill, Panel, PanelHead, Stat, buttonClass, cn } from "../../components/ui";
import { usePortal } from "../../lib/portal";
import { ConsoleLayout, EnvNotice } from "./ConsoleLayout";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Developer" | "Billing";
  twofa: boolean;
  lastSeen: string;
};

const MEMBERS: Member[] = [
  { id: "m1", name: "Kobe S.", email: "koba@nightshift.gg", role: "Owner", twofa: true, lastSeen: "now" },
  { id: "m2", name: "Priya N.", email: "priya@nightshift.gg", role: "Admin", twofa: true, lastSeen: "2h ago" },
  { id: "m3", name: "Marco T.", email: "marco@nightshift.gg", role: "Developer", twofa: false, lastSeen: "yesterday" },
  { id: "m4", name: "Dana R.", email: "dana@nightshift.gg", role: "Billing", twofa: true, lastSeen: "3d ago" },
];

const ROLE_NOTES = [
  ["Owner", "Everything, including deleting the organisation."],
  ["Admin", "Keys, webhooks, team and billing. No deletion."],
  ["Developer", "Keys and logs. Cannot reveal live keys."],
  ["Billing", "Invoices and payout account only."],
];

export function TeamPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [members, setMembers] = useState(MEMBERS);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("Developer");

  const invite = () => {
    const clean = email.trim();
    if (!clean.includes("@")) {
      toast("Enter an email address", "Invites are sent to a work address.", "danger");
      return;
    }
    setMembers((current) => [
      ...current,
      { id: `m${Date.now()}`, name: "Invited", email: clean, role, twofa: false, lastSeen: "pending" },
    ]);
    setEmail("");
    toast("Invite sent", `${clean} · ${role}`);
  };

  return (
    <ConsoleLayout active="team" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Organisation"
        title="Team"
        description="Who can touch live keys, who can only read logs, and who pays the invoice. Roles are enforced server-side, not hidden in the interface."
      >
        <Pill tone="neutral">4 members · 1 pending</Pill>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <PanelHead title="Members" hint="Night Shift Studio" />
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
                  <th className="px-4 py-2 font-extrabold">Member</th>
                  <th className="px-4 py-2 font-extrabold">Role</th>
                  <th className="px-4 py-2 font-extrabold">2FA</th>
                  <th className="px-4 py-2 font-extrabold">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((member) => (
                  <tr key={member.id} className="text-[12px]">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold leading-tight">{member.name}</p>
                      <p className="mt-0.5 text-[10.5px] text-faint">{member.email}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={member.role}
                        onChange={(event) => {
                          const next = event.target.value as Member["role"];
                          setMembers((current) =>
                            current.map((item) =>
                              item.id === member.id ? { ...item, role: next } : item,
                            ),
                          );
                          toast("Role updated", `${member.email} · ${next}`);
                        }}
                        className="h-7 rounded-md border border-line bg-white px-1.5 text-[11px] outline-none focus:border-brand/40"
                      >
                        {["Owner", "Admin", "Developer", "Billing"].map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill tone={member.twofa ? "success" : "warn"}>
                        {member.twofa ? "On" : "Off"}
                      </Pill>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-muted">{member.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel>
            <PanelHead title="Invite" hint="The link expires in 72 hours" />
            <div className="flex flex-wrap items-end gap-2 px-4 py-3.5">
              <label className="min-w-[220px] flex-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                  Work email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") invite();
                  }}
                  placeholder="name@studio.gg"
                  className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                />
              </label>
              <label>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Role</span>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as Member["role"])}
                  className="mt-1.5 block h-9 rounded-lg border border-line bg-white px-2 text-[11.5px] outline-none focus:border-brand/40"
                >
                  {["Admin", "Developer", "Billing"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <Button variant="primary" size="sm" onClick={invite}>
                <Icon name="plus" size={13} />
                Send invite
              </Button>
            </div>
          </Panel>
        </div>

        <Panel className="self-start">
          <PanelHead title="What each role can do" />
          <dl className="divide-y divide-line">
            {ROLE_NOTES.map(([name, note]) => (
              <div key={name} className="px-4 py-2.5">
                <dt className="text-[11.5px] font-semibold">{name}</dt>
                <dd className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{note}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </ConsoleLayout>
  );
}

const AUDIT = {
  keys: [
    { at: "13:56:02", actor: "koba@nightshift.gg", action: "key.rotated", target: "key_capture", ip: "82.14.9.31" },
    { at: "11:20:44", actor: "priya@nightshift.gg", action: "key.created", target: "key_ci", ip: "82.14.9.40" },
    { at: "Oct 26", actor: "koba@nightshift.gg", action: "key.revoked", target: "key_old", ip: "82.14.9.31" },
  ],
  webhooks: [
    { at: "13:58:10", actor: "system", action: "endpoint.failing", target: "staging", ip: "—" },
    { at: "Oct 26", actor: "priya@nightshift.gg", action: "endpoint.created", target: "prod-capture", ip: "82.14.9.40" },
    { at: "Oct 24", actor: "koba@nightshift.gg", action: "delivery.replayed", target: "dlv_449e08", ip: "82.14.9.31" },
  ],
  team: [
    { at: "Oct 26", actor: "koba@nightshift.gg", action: "member.invited", target: "dana@nightshift.gg", ip: "82.14.9.31" },
    { at: "Oct 25", actor: "koba@nightshift.gg", action: "role.changed", target: "marco@nightshift.gg", ip: "82.14.9.31" },
    { at: "Oct 24", actor: "priya@nightshift.gg", action: "member.removed", target: "temp@nightshift.gg", ip: "82.14.9.40" },
  ],
} as const;

const FILTERS = ["All", "Keys", "Webhooks", "Team"] as const;

export function AuditPage({ onSearch }: { onSearch: () => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const rows =
    filter === "All"
      ? [...AUDIT.keys, ...AUDIT.webhooks, ...AUDIT.team]
      : filter === "Keys"
        ? AUDIT.keys
        : filter === "Webhooks"
          ? AUDIT.webhooks
          : AUDIT.team;

  return (
    <ConsoleLayout active="audit" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Organisation"
        title="Audit log"
        description="Every change to a key, an endpoint or a member. Kept for a year, exportable, and never editable — not even by the owner."
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const blob = new Blob(
              [
                "at,actor,action,target,ip\n" +
                  rows.map((row) => `${row.at},${row.actor},${row.action},${row.target},${row.ip}`).join("\n"),
              ],
              { type: "text/csv" },
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "night-shift-audit-log.csv";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Icon name="download" size={13} />
          Export CSV
        </Button>
      </PageHead>

      <div className="mt-4 flex gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
              filter === option
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-muted hover:border-line-strong",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <Panel className="mt-3 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
              <th className="px-4 py-2 font-extrabold">When</th>
              <th className="px-4 py-2 font-extrabold">Actor</th>
              <th className="px-4 py-2 font-extrabold">Action</th>
              <th className="px-4 py-2 font-extrabold">Target</th>
              <th className="px-4 py-2 text-right font-extrabold">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, index) => (
              <tr key={`${row.action}-${index}`} className="text-[12px] hover:bg-surface/60">
                <td className="px-4 py-2.5 font-mono text-[10.5px] text-muted">{row.at}</td>
                <td className="px-4 py-2.5">{row.actor}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
                    {row.action}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-[10.5px] text-muted">{row.target}</td>
                <td className="px-4 py-2.5 text-right font-mono text-[10.5px] text-faint">{row.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </ConsoleLayout>
  );
}

const INVOICES = [
  { id: "INV-2026-011", date: "Nov 1, 2026", amount: "$0.00", note: "Included in plan" },
  { id: "INV-2026-010", date: "Oct 1, 2026", amount: "$184.20", note: "Overage · 460k requests" },
  { id: "INV-2026-009", date: "Sep 1, 2026", amount: "$96.40", note: "Overage · 241k requests" },
];

export function BillingPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();

  return (
    <ConsoleLayout active="billing" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Organisation"
        title="Billing"
        description="The Scale plan, the overage it allows and the card behind it. Invoices go out monthly; nothing here is charged without a line in the usage report."
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => toast("Plan changes are handled by sales", "Usually answered within a day")}
        >
          Change plan
        </Button>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Stat label="Plan" value="Scale" hint="$0 platform fee · metered overage" />
        <Stat label="This month" value="$184.20" delta={{ value: "Overage" }} hint="Billed Dec 1" />
        <Stat label="Payouts" value="$1,284.91" hint="Next transfer Nov 15" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel className="overflow-hidden">
          <PanelHead title="Invoices" hint="PDF, VAT-ready" />
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-faint">
                <th className="px-4 py-2 font-extrabold">Invoice</th>
                <th className="px-4 py-2 font-extrabold">Date</th>
                <th className="px-4 py-2 font-extrabold">Note</th>
                <th className="px-4 py-2 text-right font-extrabold">Amount</th>
                <th className="w-16 px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {INVOICES.map((invoice) => (
                <tr key={invoice.id} className="text-[12px]">
                  <td className="px-4 py-2.5 font-mono text-[10.5px]">{invoice.id}</td>
                  <td className="px-4 py-2.5 text-muted">{invoice.date}</td>
                  <td className="px-4 py-2.5 text-[11px] text-muted">{invoice.note}</td>
                  <td className="num px-4 py-2.5 text-right font-mono text-[11px]">{invoice.amount}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      aria-label={`Download ${invoice.id}`}
                      onClick={() => toast("Invoice downloaded", `${invoice.id}.pdf`)}
                      className="text-faint transition-colors hover:text-brand"
                    >
                      <Icon name="download" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHead title="Payment method" />
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="grid h-8 w-11 place-items-center rounded-md border border-line bg-surface text-[9px] font-bold text-muted">
                VISA
              </span>
              <div>
                <p className="text-[11.5px] font-semibold">•••• 4242</p>
                <p className="text-[10.5px] text-faint">Expires 09 / 2029</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => toast("Card update is handled by Stripe", "A secure link would be emailed")}
              >
                Update
              </Button>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Billing details" hint="On every invoice" />
            <dl className="divide-y divide-line text-[11.5px]">
              {[
                ["Account", "nightshift.gg"],
                ["Email", "billing@nightshift.gg"],
                ["Address", "Rotterdam, NL"],
                ["VAT", "NL001234567B01"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 px-4 py-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="border-t border-line px-4 py-2.5 text-[10.5px] text-muted">
              Invoices are issued through Stripe and emailed on the first of the month.
            </p>
          </Panel>
        </div>
      </div>
    </ConsoleLayout>
  );
}

export function SettingsPage({ onSearch }: { onSearch: () => void }) {
  const { toast } = usePortal();
  const [name, setName] = useState("Night Shift Studio");
  const [slug, setSlug] = useState("night-shift");
  const [support, setSupport] = useState("developers@nightshift.gg");
  const [retention, setRetention] = useState("7 days");
  const [confirm, setConfirm] = useState(false);

  return (
    <ConsoleLayout active="settings" onSearch={onSearch}>
      <EnvNotice />
      <PageHead
        section="Organisation"
        title="Settings"
        description="The details that appear on consent screens, webhook signatures and invoices. Changes are logged in the audit trail."
      >
        <Button variant="primary" size="sm" onClick={() => toast("Settings saved", "Changes apply on the next request")}>
          Save changes
        </Button>
      </PageHead>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Panel>
            <PanelHead title="Organisation" hint="Visible on consent screens and invoices" />
            <div className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-2">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">Slug</span>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 font-mono text-[11px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                  Support email
                </span>
                <input
                  value={support}
                  onChange={(event) => setSupport(event.target.value)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[12px] outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                />
                <span className="mt-1 block text-[10px] text-faint">
                  Must be on the same domain as the app you claim in the catalogue.
                </span>
              </label>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Data" hint="What the portal keeps, and for how long" />
            <div className="divide-y divide-line">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[11.5px] font-semibold">Request log retention</p>
                  <p className="mt-0.5 text-[10.5px] text-muted">Webhook payloads are replayable for the same window.</p>
                </div>
                <select
                  value={retention}
                  onChange={(event) => {
                    setRetention(event.target.value);
                    toast("Retention updated", event.target.value);
                  }}
                  className="h-8 rounded-lg border border-line bg-white px-2 text-[11.5px] outline-none focus:border-brand/40"
                >
                  {["7 days", "30 days", "90 days"].map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-[11.5px] font-semibold">Export everything</p>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    Keys are excluded; their hashes and labels are included.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast("Export started", "You will get an email when the archive is ready")}
                >
                  <Icon name="download" size={13} />
                  Request export
                </Button>
              </div>
              <div className="px-4 py-3">
                <p className="text-[11.5px] font-semibold">What SnagChat stores about your app</p>
                <ul className="mt-1.5 space-y-1 text-[10.5px] text-muted">
                  <li>· Key labels and hashes, never the secret after creation.</li>
                  <li>· Delivery bodies for the retention window, so you can replay them.</li>
                  <li>· 7 days of request metadata: method, route, status, duration, request id.</li>
                  <li>· No clip contents are stored for apps that only read the feed.</li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHead title="Danger zone" />
            <div className="px-4 py-3">
              <p className="text-[11px] leading-relaxed text-muted">
                Deleting the organisation revokes every key, disables every endpoint and removes the
                team. Request logs go with it.
              </p>
              <Button
                variant="danger"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setConfirm(true)}
              >
                <Icon name="trash" size={13} />
                Delete organisation
              </Button>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Ownership" />
            <dl className="divide-y divide-line text-[11.5px]">
              {[
                ["Owner", "koba@nightshift.gg"],
                ["Created", "Oct 24, 2026"],
                ["Plan", "Scale"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 px-4 py-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        eyebrow="Danger zone"
        title="Delete Night Shift Studio?"
        description="This revokes all keys and endpoints. It cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setConfirm(false)}>
              Keep it
            </button>
            <button
              type="button"
              className={buttonClass("danger", "sm")}
              onClick={() => {
                setConfirm(false);
                toast("Deletion is disabled in this preview", "Nothing was removed");
              }}
            >
              Delete organisation
            </button>
          </div>
        }
      >
        <p className="text-[12px] leading-relaxed text-muted">
          Type is not required in this preview. In production you would confirm the organisation slug{" "}
          <span className="font-mono text-[11px] text-ink">{slug}</span> first.
        </p>
      </Modal>
    </ConsoleLayout>
  );
}
