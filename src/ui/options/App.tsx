// ---------- src/ui/options/App.tsx ----------
/** Settings page inside extension Options */
import { useAuth } from "@/shared/hooks/useAuth";
export default function OptionsApp() {
  const { user, signInGoogle, signOut } = useAuth();
  return (
    <div className="p-6 font-sans space-y-4 max-w-xl">
      <h1 className="text-2xl font-semibold">LearnFlow Settings</h1>
      {user ? (
        <div className="space-y-2">
          <div>Hello, {user.displayName || user.email}</div>
          <button className="text-red-600" onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <button className="text-blue-600" onClick={signInGoogle}>Sign in with Google</button>
      )}
      {/* TODO – language selector, notification toggle, etc. */}
    </div>
  );
}