-- ينشئ حساب المالك المخفي (يُنفَّذ مرة واحدة في SQL Editor بعد schema.sql).
-- كلمة المرور محفوظة هنا كبصمة bcrypt فقط (لا يمكن عكسها). لا أحد يستطيع تسجيل هذا البريد لأنه محجوز.
-- لا يظهر أي شيء عن المالك داخل التطبيق؛ سجّل الدخول عادةً بالبريد وكلمة المرور.
do $$
declare
  uid uuid := gen_random_uuid();
  em  text := '2009omermohammed12@gmail.com';
begin
  if exists (select 1 from auth.users where lower(email) = em) then
    raise notice 'حساب المالك موجود مسبقاً';
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    '$2a$10$WdOFdE7/5sWW9pBCZ05nu.SjLBb5RVUCrqHleJtbfsWNLWcAqao.u', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, 'email',
          jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), now(), now(), now());

  -- trigger handle_new_user أنشأ الملف الشخصي كزبون؛ نرفعه إلى مالك
  update public.profiles set role = 'owner', full_name = 'المالك' where id = uid;
end $$;
