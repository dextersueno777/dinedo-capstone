import { ResetPasswordForm } from './reset-password-form';

type Props = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const token = params.token ?? '';

  return (
    <main className="portal-shell">
      <section className="card auth-card auth-card-polished">
        <div className="auth-copy">
          <p className="eyebrow">Account Recovery</p>
          <h1>Create a New Password</h1>
          <p>
            This reset link can be used only once and expires
            15 minutes after the recovery request is approved.
          </p>
        </div>

        <ResetPasswordForm token={token} />
      </section>
    </main>
  );
}
