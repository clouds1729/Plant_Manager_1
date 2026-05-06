insert into organizations (id, name, country, currency)
values ('11111111-1111-1111-1111-111111111111', 'Demo Org', 'US', 'USD')
on conflict do nothing;
