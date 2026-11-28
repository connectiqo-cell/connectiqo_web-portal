-- The creator video-usage agreement text lived only as hardcoded strings in
-- the web codebase — mobile has no way to fetch the same wording, only to
-- hand-copy it (which drifts silently whenever one side is updated and the
-- other isn't). Moves it into the database as the one shared source both
-- apps read, same pattern as platform_fee_rules / payout_settings.
--
-- clauses is a JSON array of strings; "{{brand}}" is a placeholder each
-- client replaces with the actual brand name at render time (campaigns vary
-- per-application, so this can't be baked in server-side).

create table public.legal_agreements (
  id text primary key,
  version integer not null default 1,
  clauses jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.legal_agreements enable row level security;

create policy legal_agreements_read_all
  on public.legal_agreements for select
  using (true);

create policy admin_all_legal_agreements
  on public.legal_agreements for all
  using (is_admin())
  with check (is_admin());

insert into public.legal_agreements (id, version, clauses) values (
  'creator_video_usage',
  1,
  '[
    "Full ownership transfer: once this video is approved and unlocked, you irrevocably assign and transfer to {{brand}} all right, title, and interest in it, including all copyright, worldwide and in perpetuity. {{brand}} becomes its full owner and may use, edit, reproduce, publish, or otherwise exploit it in any manner, for any purpose.",
    "Your reserved right: despite that transfer, you may still keep a copy to showcase in your own personal portfolio or reel (e.g. to prospective brands or clients) — but you may not otherwise republish, resell, or commercially exploit it once ownership has transferred.",
    "Your warranties: you confirm this is your own original work; you hold the rights to all music, footage, and other elements used in it; if any other identifiable person appears in it, you have their consent to be filmed and published; and it does not violate any law or infringe anyone else''s rights.",
    "{{brand}} may not use this video for any unlawful, discriminatory, or defamatory purpose, even as its owner.",
    "The campaign payout is full and final compensation for this transfer of ownership — no further payment is owed regardless of how, or for how long, {{brand}} uses this video going forward.",
    "You indemnify the brand against any claim arising from your breach of the warranties above (for example, a third-party music copyright claim).",
    "Connectiqo facilitates this agreement and the related payment between you and the brand, but is not a party to this transfer and is not liable for either side''s breach of it. Connectiqo keeps a timestamped record of your acceptance, which it can provide if a dispute arises.",
    "Nothing in this agreement creates an employment, agency, or partnership relationship between you, {{brand}}, or Connectiqo.",
    "This agreement is governed by the laws of India, with disputes subject to the exclusive jurisdiction of the courts of Haridwar, Uttarakhand."
  ]'::jsonb
);
